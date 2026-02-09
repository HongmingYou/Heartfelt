import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sunrise, Sun, Moon, Camera, MessageCircleHeart } from 'lucide-react';
import { JournalRecord, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';

const iconMap = {
  Sunrise,
  Sun,
  Moon,
  Camera,
  MessageCircleHeart,
};

interface RecordCardProps {
  record: JournalRecord;
  onClick?: () => void;
  compact?: boolean;
}

export function RecordCard({ record, onClick, compact = false }: RecordCardProps) {
  const typeInfo = RECORD_TYPE_INFO[record.type];
  const moodInfo = MOOD_INFO[record.mood];
  const IconComponent = iconMap[typeInfo.icon as keyof typeof iconMap];

  return (
    <motion.div
      onClick={onClick}
      className="bg-card rounded-2xl p-4 shadow-soft border border-border cursor-pointer"
      whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(255, 182, 193, 0.2)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {record.images.length > 0 && !compact && (
        <div className="mb-3 rounded-xl overflow-hidden aspect-video">
          <img
            src={record.images[0]}
            alt=""
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Image failed to load:', record.images[0]);
              e.currentTarget.parentElement?.remove();
            }}
          />
        </div>
      )}
      
      <div className="flex items-start gap-3">
        {record.images.length > 0 && compact && (
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={record.images[0]}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Image failed to load:', record.images[0]);
                e.currentTarget.parentElement?.remove();
              }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
              <IconComponent size={14} className="text-primary-900" />
            </div>
            <span className="text-body-s font-medium text-foreground">
              {typeInfo.label}
            </span>
            <span className="text-body-s text-muted-foreground">
              {format(new Date(record.createdAt), 'HH:mm')}
            </span>
          </div>
          
          {record.text && (
            <p className={`text-body-s text-foreground ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {record.text}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-body-s text-secondary-foreground whitespace-nowrap">
              <span>{moodInfo.emoji}</span>
              <span>{moodInfo.label}</span>
            </span>
            
            {record.forYou && (
              <span className="text-body-s text-primary-900 truncate">
                💕 {record.forYou}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
