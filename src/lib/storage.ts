import { supabase } from '@/integrations/supabase/client';
import { JournalRecord, Settings } from './types';

// ============ Retry Helper ============

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Retry failed');
}

// ============ Records ============

export async function getRecords(): Promise<JournalRecord[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('journal_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDbRecord);
  });
}

export async function saveRecord(record: Omit<JournalRecord, 'id'>): Promise<JournalRecord | null> {
  const { data, error } = await supabase
    .from('journal_records')
    .insert({
      type: record.type,
      images: record.images,
      text: record.text,
      mood: record.mood,
      for_you: record.forYou,
      created_at: record.createdAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving record:', error);
    return null;
  }

  return transformDbRecord(data);
}

export async function updateRecord(id: string, updates: Partial<JournalRecord>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.type) dbUpdates.type = updates.type;
  if (updates.images) dbUpdates.images = updates.images;
  if (updates.text !== undefined) dbUpdates.text = updates.text;
  if (updates.mood) dbUpdates.mood = updates.mood;
  if (updates.forYou !== undefined) dbUpdates.for_you = updates.forYou;

  const { error } = await supabase
    .from('journal_records')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating record:', error);
    return false;
  }

  return true;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('journal_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting record:', error);
    return false;
  }

  return true;
}

export async function clearAllRecords(): Promise<boolean> {
  const { error } = await supabase
    .from('journal_records')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error('Error clearing records:', error);
    return false;
  }

  return true;
}

// ============ Settings ============

export async function getSettings(): Promise<Settings> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 60);
      return {
        reunionDate: defaultDate.toISOString().split('T')[0],
        partnerName: '',
        isSetupComplete: false,
        confession: '',
      };
    }

    return {
      reunionDate: data.reunion_date,
      partnerName: data.partner_name || '',
      isSetupComplete: data.is_setup_complete || false,
      confession: data.confession || '',
    };
  });
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  // Use upsert to combine check + insert/update into one request
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  const payload = {
    reunion_date: settings.reunionDate,
    partner_name: settings.partnerName,
    is_setup_complete: settings.isSetupComplete,
    confession: settings.confession || '',
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from('user_settings').update(payload).eq('id', existing.id)
    : await supabase.from('user_settings').insert(payload);

  if (error) {
    console.error('Error saving settings:', error);
    return false;
  }
  return true;
}

// ============ Media Upload (Image + Video) ============

export async function uploadMedia(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const isVideo = file.type.startsWith('video/');
  const filePath = isVideo ? `videos/${fileName}` : `images/${fileName}`;

  let uploadData: Blob | File;
  let contentType: string;

  if (isVideo) {
    uploadData = file;
    contentType = file.type || 'video/mp4';
  } else {
    uploadData = await compressImageToBlob(file);
    contentType = 'image/jpeg';
  }

  const { error } = await supabase.storage
    .from('journal-images')
    .upload(filePath, uploadData, { contentType });

  if (error) {
    console.error('Error uploading media:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function uploadImage(file: File): Promise<string | null> {
  return uploadMedia(file);
}

export async function deleteImage(imageUrl: string): Promise<boolean> {
  // Extract file path from URL
  const urlParts = imageUrl.split('/journal-images/');
  if (urlParts.length < 2) return false;
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('journal-images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
}

// ============ Export ============

export async function exportData(): Promise<string> {
  const records = await getRecords();
  const settings = await getSettings();
  return JSON.stringify({ records, settings, exportedAt: new Date().toISOString() }, null, 2);
}

// ============ Utilities ============

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function compressImageToBlob(file: File, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Transform database record to app format
interface DbRecord {
  id: string;
  type: string;
  images: string[];
  text: string;
  mood: string;
  for_you: string;
  created_at: string;
}

function transformDbRecord(dbRecord: DbRecord): JournalRecord {
  return {
    id: dbRecord.id,
    type: dbRecord.type as JournalRecord['type'],
    images: dbRecord.images || [],
    text: dbRecord.text || '',
    mood: dbRecord.mood as JournalRecord['mood'],
    forYou: dbRecord.for_you || '',
    createdAt: dbRecord.created_at,
  };
}

export function getDaysUntilReunion(reunionDate: string): number {
  const reunion = new Date(reunionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reunion.setHours(0, 0, 0, 0);
  
  const diff = reunion.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the "logical date" for a record — day boundary is 6:00 AM local time.
 * Records before 6am belong to the previous day.
 */
export function getLogicalDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() - 6);
  return d.toISOString().split('T')[0];
}

export function groupRecordsByDate(records: JournalRecord[]): Record<string, JournalRecord[]> {
  const grouped: Record<string, JournalRecord[]> = {};
  
  records.forEach(record => {
    const date = getLogicalDate(record.createdAt);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(record);
  });
  
  return grouped;
}

export function groupRecordsByWeek(records: JournalRecord[]): { week: number; records: JournalRecord[] }[] {
  if (records.length === 0) return [];
  
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const firstDate = new Date(sortedRecords[0].createdAt);
  const weeks: { week: number; records: JournalRecord[] }[] = [];
  
  sortedRecords.forEach(record => {
    const recordDate = new Date(record.createdAt);
    const diffDays = Math.floor((recordDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    
    const existingWeek = weeks.find(w => w.week === weekNum);
    if (existingWeek) {
      existingWeek.records.push(record);
    } else {
      weeks.push({ week: weekNum, records: [record] });
    }
  });
  
  return weeks.sort((a, b) => b.week - a.week);
}

// ============ Comments ============

export interface Comment {
  id: string;
  recordId: string;
  content: string;
  authorType: 'partner' | 'author';
  replyTo: string | null;
  createdAt: string;
}

export async function getCommentsByRecord(recordId: string): Promise<Comment[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      recordId: c.record_id,
      content: c.content,
      authorType: c.author_type as 'partner' | 'author',
      replyTo: c.reply_to,
      createdAt: c.created_at,
    }));
  });
}

export async function getCommentsByRecords(_recordIds?: string[]): Promise<Record<string, Comment[]>> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const grouped: Record<string, Comment[]> = {};
    (data || []).forEach(c => {
      const comment: Comment = {
        id: c.id,
        recordId: c.record_id,
        content: c.content,
        authorType: c.author_type as 'partner' | 'author',
        replyTo: c.reply_to,
        createdAt: c.created_at,
      };
      if (!grouped[comment.recordId]) {
        grouped[comment.recordId] = [];
      }
      grouped[comment.recordId].push(comment);
    });

    return grouped;
  });
}

export async function addComment(
  recordId: string,
  content: string,
  authorType: 'partner' | 'author',
  replyTo?: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      record_id: recordId,
      content,
      author_type: authorType,
      reply_to: replyTo || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  return {
    id: data.id,
    recordId: data.record_id,
    content: data.content,
    authorType: data.author_type as 'partner' | 'author',
    replyTo: data.reply_to,
    createdAt: data.created_at,
  };
}

export async function updateComment(commentId: string, content: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId);

  if (error) {
    console.error('Error updating comment:', error);
    return false;
  }
  return true;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
  return true;
}
