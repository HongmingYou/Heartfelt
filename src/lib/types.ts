export type RecordType = 'breakfast' | 'lunch' | 'dinner' | 'photo' | 'thought';

export type MoodType = 'miss' | 'yummy' | 'fun' | 'normal';

export interface JournalRecord {
  id: string;
  type: RecordType;
  images: string[];
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
};

export const MOOD_INFO: Record<MoodType, { label: string; emoji: string }> = {
  miss: { label: '想你了', emoji: '❤️' },
  yummy: { label: '吃到好吃的', emoji: '🍰' },
  fun: { label: '有趣的事', emoji: '😄' },
  normal: { label: '普通日常', emoji: '📝' },
};
