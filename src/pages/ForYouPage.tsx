import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Loader2, ChevronDown, Calendar, Camera, MessageCircleHeart, Utensils, Sunrise, Sun, Moon } from 'lucide-react';
import { getRecords, getSettings, getDaysUntilReunion, groupRecordsByDate } from '@/lib/storage';
import { JournalRecord, Settings, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';

const iconMap = {
  Sunrise,
  Sun,
  Moon,
  Camera,
  MessageCircleHeart,
};

export default function ForYouPage() {
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [recordsData, settingsData] = await Promise.all([
        getRecords(),
        getSettings(),
      ]);
      setRecords(recordsData);
      setSettings(settingsData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart size={48} className="text-primary fill-primary" />
          </motion.div>
          <p className="text-muted-foreground">正在加载...</p>
        </motion.div>
      </div>
    );
  }

  if (!settings) return null;

  const daysLeft = getDaysUntilReunion(settings.reunionDate);
  const groupedRecords = groupRecordsByDate(records);
  const sortedDates = Object.keys(groupedRecords).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Stats
  const totalRecords = records.length;
  const totalDays = sortedDates.length;
  const forYouMessages = records.filter(r => r.forYou).length;
  const totalPhotos = records.reduce((acc, r) => acc + r.images.length, 0);

  // Featured photos (latest 9)
  const featuredPhotos = records
    .filter(r => r.images.length > 0)
    .flatMap(r => r.images)
    .slice(0, 9);

  // All forYou messages
  const allForYouMessages = records
    .filter(r => r.forYou)
    .map(r => ({
      text: r.forYou,
      date: r.createdAt,
      type: r.type,
    }));

  if (records.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background p-6">
        <EmptyState
          icon={Heart}
          title={`亲爱的${settings.partnerName || '你'}`}
          description="TA还没有开始记录，但TA一定很想你..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background overflow-y-auto">
      {/* Hero Section */}
      {!showContent ? (
        <motion.div
          className="min-h-screen flex flex-col items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart size={48} className="text-primary-foreground fill-primary-foreground" />
            </motion.div>

            <motion.h1
              className="text-display-l gradient-text mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {settings.partnerName || '亲爱的'}
            </motion.h1>

            <motion.p
              className="text-body-l text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              这是为你准备的
            </motion.p>

            {/* Countdown */}
            <motion.div
              className="mb-8 p-6 bg-card rounded-3xl shadow-elevated border border-border inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-body-s text-muted-foreground mb-1">距离我们重逢还有</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-display-l gradient-text">{Math.max(0, daysLeft)}</span>
                <span className="text-headline-l text-muted-foreground">天</span>
              </div>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="text-center">
                <div className="text-headline-l text-primary">{totalDays}</div>
                <div className="text-body-s text-muted-foreground">天记录</div>
              </div>
              <div className="text-center">
                <div className="text-headline-l text-primary">{totalPhotos}</div>
                <div className="text-body-s text-muted-foreground">张照片</div>
              </div>
              <div className="text-center">
                <div className="text-headline-l text-primary">{forYouMessages}</div>
                <div className="text-body-s text-muted-foreground">句想说的话</div>
              </div>
            </motion.div>

            {/* Enter Button */}
            <motion.button
              onClick={() => setShowContent(true)}
              className="flex flex-col items-center gap-2 text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-body-l">点击查看</span>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown size={24} />
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        <div className="pb-12">
          {/* Header */}
          <motion.div
            className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 safe-area-top">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Heart size={20} className="text-primary-foreground fill-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-headline-s text-foreground">给{settings.partnerName || '你'}的日记</h1>
                    <p className="text-body-s text-muted-foreground">每一天都在想你</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-headline-s gradient-text">{Math.max(0, daysLeft)}</div>
                  <div className="text-body-s text-muted-foreground">天后重逢</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For You Messages Section */}
          {allForYouMessages.length > 0 && (
            <motion.section
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Heart size={20} className="text-primary" />
                <h2 className="text-headline-s text-foreground">想对你说的话</h2>
              </div>
              <div className="space-y-3">
                {allForYouMessages.slice(0, 5).map((msg, i) => (
                  <motion.div
                    key={i}
                    className="p-4 bg-card rounded-2xl shadow-soft border border-border"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <p className="text-body-l text-foreground mb-2 italic">"{msg.text}"</p>
                    <p className="text-body-s text-muted-foreground">
                      {format(new Date(msg.date), 'M月d日 HH:mm', { locale: zhCN })}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Photo Gallery */}
          {featuredPhotos.length > 0 && (
            <motion.section
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Camera size={20} className="text-primary" />
                <h2 className="text-headline-s text-foreground">精选照片</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {featuredPhotos.map((photo, i) => (
                  <motion.div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Timeline */}
          <motion.section
            className="p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-primary" />
              <h2 className="text-headline-s text-foreground">时光轴</h2>
            </div>
            <div className="space-y-6">
              {sortedDates.map((date, dateIndex) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + dateIndex * 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <h3 className="text-headline-s text-foreground">
                      {format(new Date(date), 'M月d日 EEEE', { locale: zhCN })}
                    </h3>
                  </div>
                  <div className="ml-6 border-l-2 border-border pl-4 space-y-3">
                    {groupedRecords[date].map((record) => (
                      <ForYouRecordCard key={record.id} record={record} onImageClick={setSelectedImage} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Confession */}
          {settings.confession && (
            <motion.section
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={20} className="text-primary fill-primary" />
                  <h2 className="text-headline-s text-foreground">最想对你说</h2>
                </div>
                <p className="text-body-l text-foreground leading-relaxed whitespace-pre-wrap">
                  {settings.confession}
                </p>
              </div>
            </motion.section>
          )}

          {/* Footer */}
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart size={32} className="mx-auto text-primary fill-primary mb-2" />
            </motion.div>
            <p className="text-body-l text-muted-foreground">每一天都在想你</p>
          </motion.div>
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              src={selectedImage}
              alt=""
              className="max-w-full max-h-full rounded-2xl shadow-elevated"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Record card for the partner view
function ForYouRecordCard({ record, onImageClick }: { record: JournalRecord; onImageClick: (url: string) => void }) {
  const typeInfo = RECORD_TYPE_INFO[record.type];
  const moodInfo = MOOD_INFO[record.mood];
  const IconComponent = iconMap[typeInfo.icon as keyof typeof iconMap];

  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-soft border border-border"
      whileHover={{ y: -2 }}
    >
      {/* Images */}
      {record.images.length > 0 && (
        <div className={`mb-3 ${record.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
          {record.images.slice(0, 4).map((img, i) => (
            <motion.div
              key={i}
              className={`rounded-xl overflow-hidden cursor-pointer ${record.images.length === 1 ? 'aspect-video' : 'aspect-square'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onImageClick(img)}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <IconComponent size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body-s font-medium text-foreground">{typeInfo.label}</span>
            <span className="text-body-s text-muted-foreground">
              {format(new Date(record.createdAt), 'HH:mm')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-body-s text-secondary-foreground">
              <span>{moodInfo.emoji}</span>
              <span>{moodInfo.label}</span>
            </span>
          </div>

          {record.text && (
            <p className="text-body-l text-foreground mb-2">{record.text}</p>
          )}

          {record.forYou && (
            <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-1 text-primary mb-1">
                <Heart size={14} className="fill-primary" />
                <span className="text-body-s font-medium">想对你说</span>
              </div>
              <p className="text-body-l text-foreground italic">"{record.forYou}"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
