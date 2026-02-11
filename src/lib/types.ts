export type RecordType = 'breakfast' | 'lunch' | 'dinner' | 'photo' | 'thought' | 'cat';

export type MoodType = 'miss' | 'yummy' | 'fun' | 'normal' | 'happy' | 'tired' | 'sad' | 'sleepy';

export interface JournalRecord {
  id: string;
  type: RecordType;
  images: string[]; // 包含图片和视频的 URL
  text: string;
  mood: MoodType;
  forYou: string;
  createdAt: string;
}

export interface Settings {
  reunionDate: string;
  partnerName: string;
  isSetupComplete: boolean;
  confession?: string;
}

export const RECORD_TYPE_INFO: Record<RecordType, { label: string; icon: string }> = {
  breakfast: { label: '早餐', icon: 'Sunrise' },
  lunch: { label: '午餐', icon: 'Sun' },
  dinner: { label: '晚餐', icon: 'Moon' },
  photo: { label: '随手拍', icon: 'Camera' },
  thought: { label: '想说的话', icon: 'MessageCircleHeart' },
  cat: { label: '猫猫', icon: 'Cat' },
};

export const MOOD_INFO: Record<MoodType, { label: string; emoji: string }> = {
  miss: { label: '想你了', emoji: '❤️' },
  yummy: { label: '吃到好吃的', emoji: '🍰' },
  fun: { label: '有趣的事', emoji: '😄' },
  happy: { label: '开心', emoji: '😊' },
  normal: { label: '普通日常', emoji: '📝' },
  tired: { label: '累了', emoji: '😪' },
  sad: { label: '有点难过', emoji: '😢' },
  sleepy: { label: '犯困', emoji: '😴' },
};

// 判断 URL 是否是视频
export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  const lowerUrl = url.split('?')[0].toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext));
}
