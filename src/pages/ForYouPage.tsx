import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Loader2, ChevronLeft, ChevronRight, Camera, Sunrise, Sun, Moon, MessageCircleHeart, X } from 'lucide-react';
import { getRecords, getSettings, getDaysUntilReunion, groupRecordsByDate } from '@/lib/storage';
import { JournalRecord, Settings, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

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
  const [currentSection, setCurrentSection] = useState(0); // 0: cover, 1: timeline, 2: photos, 3: messages
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

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

    // 记录访问
    const recordPageView = async () => {
      try {
        await supabase.from('page_views').insert({
          page_path: '/for-you',
          user_agent: navigator.userAgent,
          visited_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to record page view:', error);
      }
    };
    recordPageView();
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
    new Date(b).getTime() - new Date(a).getTime() // 按时间倒序（最新在前）
  );

  const partnerName = settings.partnerName || '你';

  // 统计数据
  const totalDays = sortedDates.length;
  const photoCount = records.reduce((acc, r) => acc + r.images.length, 0);
  const messageCount = records.filter(r => r.forYou).length;

  // 所有想说的话（按时间倒序）
  const allMessages = records
    .filter(r => r.forYou)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(r => ({
      text: r.forYou,
      date: r.createdAt,
      mood: r.mood,
    }));

  // 所有照片（按时间倒序）
  const allPhotos = records
    .filter(r => r.images.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .flatMap(r => r.images.map(img => ({ url: img, date: r.createdAt })));

  // 空状态
  if (records.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background p-6">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart size={64} className="mx-auto text-primary fill-primary mb-6" />
          </motion.div>
          <h1 className="text-display-s gradient-text mb-4">亲爱的{partnerName}</h1>
          <p className="text-body-l text-muted-foreground leading-relaxed">
            他正在为你准备一份特别的礼物<br />
            请再等等...
          </p>
        </motion.div>
      </div>
    );
  }

  const handleNext = () => {
    const maxSection = 3;
    if (currentSection < maxSection) {
      setCurrentSection(prev => prev + 1);
      setCurrentDateIndex(0); // 重置日期索引
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      setCurrentDateIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-secondary/20">
      <div className="h-screen overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* Section 0: Cover - 封面 */}
          {currentSection === 0 && (
            <CoverSection 
              key="cover"
              partnerName={partnerName}
              daysLeft={daysLeft}
              totalDays={totalDays}
              photoCount={photoCount}
              messageCount={messageCount}
              onNext={handleNext}
            />
          )}

          {/* Section 1: Timeline - 时光轴（左右滑动切换日期） */}
          {currentSection === 1 && (
            <TimelineSection
              key="timeline"
              groupedRecords={groupedRecords}
              sortedDates={sortedDates}
              currentDateIndex={currentDateIndex}
              setCurrentDateIndex={setCurrentDateIndex}
              onImageClick={setSelectedImage}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {/* Section 2: Photos - 照片墙 */}
          {currentSection === 2 && (
            <PhotosSection
              key="photos"
              photos={allPhotos}
              onImageClick={setSelectedImage}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {/* Section 3: Messages - 星空（想对你说的话） */}
          {currentSection === 3 && (
            <MessagesSection
              key="messages"
              messages={allMessages}
              confession={settings.confession}
              partnerName={partnerName}
              daysLeft={daysLeft}
              onPrev={handlePrev}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              onClick={() => setSelectedImage(null)}
            >
              <X size={20} className="text-foreground" />
            </button>
            <motion.img
              src={selectedImage}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl shadow-elevated"
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

// ============ Section Components ============

// 封面
function CoverSection({ 
  partnerName, 
  daysLeft, 
  totalDays,
  photoCount,
  messageCount,
  onNext 
}: { 
  partnerName: string;
  daysLeft: number;
  totalDays: number;
  photoCount: number;
  messageCount: number;
  onNext: () => void;
}) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Floating hearts background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <Heart size={20 + i * 4} className="fill-current" />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Heart icon */}
        <motion.div
          className="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-elevated"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart size={56} className="text-primary-foreground fill-primary-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-display-l gradient-text mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Hi {partnerName}
        </motion.h1>

        {/* Countdown card */}
        <motion.div
          className="inline-block p-6 bg-card/80 backdrop-blur rounded-3xl shadow-elevated border border-border mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-body-s text-muted-foreground mb-2">距离我们重逢</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-display-l gradient-text">{Math.max(0, daysLeft)}</span>
            <span className="text-headline-l text-muted-foreground">天</span>
          </div>
        </motion.div>

        {/* Stats preview */}
        <motion.div
          className="flex items-center justify-center gap-6 mb-8 text-body-s text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <span>{totalDays} 天记录</span>
          <span>•</span>
          <span>{photoCount} 张照片</span>
          <span>•</span>
          <span>{messageCount} 句心里话</span>
        </motion.div>

        {/* Enter button */}
        <motion.button
          onClick={onNext}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full text-body-l font-medium shadow-elevated"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          打开这封信
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// 时光轴（支持左右滑动）
function TimelineSection({
  groupedRecords,
  sortedDates,
  currentDateIndex,
  setCurrentDateIndex,
  onImageClick,
  onNext,
  onPrev,
}: {
  groupedRecords: Record<string, JournalRecord[]>;
  sortedDates: string[];
  currentDateIndex: number;
  setCurrentDateIndex: (index: number) => void;
  onImageClick: (url: string) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const currentDate = sortedDates[currentDateIndex];
  const currentRecords = groupedRecords[currentDate] || [];
  
  const canGoPrev = currentDateIndex > 0;
  const canGoNext = currentDateIndex < sortedDates.length - 1;

  return (
    <motion.div
      className="flex-1 flex flex-col p-6 pt-12 min-h-0"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Heart size={18} className="text-primary" />
          <span className="text-body-l font-medium text-primary">时光轴</span>
        </div>
        <p className="text-body-s text-muted-foreground">
          左右滑动查看 {sortedDates.length} 天的记录
        </p>
      </motion.div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={() => canGoPrev && setCurrentDateIndex(currentDateIndex - 1)}
          disabled={!canGoPrev}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            canGoPrev ? 'bg-secondary text-foreground' : 'bg-secondary/30 text-muted-foreground'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <motion.div
          key={currentDate}
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-headline-l text-foreground">
            {format(new Date(currentDate), 'M月d日', { locale: zhCN })}
          </h2>
          <p className="text-body-s text-muted-foreground">
            {format(new Date(currentDate), 'EEEE', { locale: zhCN })} • {currentRecords.length} 条记录
          </p>
          <p className="text-body-s text-muted-foreground mt-1">
            {currentDateIndex + 1} / {sortedDates.length}
          </p>
        </motion.div>

        <button
          onClick={() => canGoNext && setCurrentDateIndex(currentDateIndex + 1)}
          disabled={!canGoNext}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            canGoNext ? 'bg-secondary text-foreground' : 'bg-secondary/30 text-muted-foreground'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Records for current date */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {currentRecords.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TimelineRecordCard record={record} onImageClick={onImageClick} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0">
        <NavigationButtons onPrev={onPrev} onNext={onNext} nextLabel="看看生活照片" />
      </div>
    </motion.div>
  );
}

// 照片墙
function PhotosSection({
  photos,
  onImageClick,
  onNext,
  onPrev,
}: {
  photos: { url: string; date: string }[];
  onImageClick: (url: string) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const validPhotos = photos.filter((_, i) => !imageErrors[i]);
  
  return (
    <motion.div
      className="flex-1 flex flex-col p-6 pt-12 min-h-0"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Camera size={18} className="text-primary" />
          <span className="text-body-l font-medium text-primary">生活照片</span>
        </div>
        <p className="text-body-s text-muted-foreground">
          点击可以放大查看 • 共 {validPhotos.length} 张
        </p>
      </motion.div>

      {/* Photo Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            !imageErrors[i] && (
              <motion.div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-soft"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onImageClick(photo.url)}
              >
                <img 
                  src={photo.url} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={() => setImageErrors(prev => ({ ...prev, [i]: true }))}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                  <p className="text-[11px] text-white/90">
                    {format(new Date(photo.date), 'M/d', { locale: zhCN })}
                  </p>
                </div>
              </motion.div>
            )
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0">
        <NavigationButtons onPrev={onPrev} onNext={onNext} nextLabel="看看星空" />
      </div>
    </motion.div>
  );
}

// 星空（想对你说的话）
function MessagesSection({
  messages,
  confession,
  partnerName,
  daysLeft,
  onPrev,
}: {
  messages: { text: string; date: string; mood: string }[];
  confession?: string;
  partnerName: string;
  daysLeft: number;
  onPrev: () => void;
}) {
  return (
    <motion.div
      className="flex-1 flex flex-col p-6 pt-12 bg-gradient-to-b from-accent-starry to-accent-starry min-h-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Twinkling stars background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent-star-glow rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-6 relative z-10 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-star-glow/20 rounded-full mb-4">
          <Heart size={18} className="text-accent-star-glow" />
          <span className="text-body-l font-medium text-accent-star-glow">星空</span>
        </div>
        <p className="text-body-s text-white/70">
          每一颗星星都是一句想对你说的话
        </p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4 space-y-4 relative z-10">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className="p-5 bg-white/5 backdrop-blur rounded-2xl border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <p className="text-body-l text-white leading-relaxed italic">
              "{msg.text}"
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="text-body-s text-white/60">
                {format(new Date(msg.date), 'M月d日', { locale: zhCN })}
              </span>
              <span className="text-body-s">
                {MOOD_INFO[msg.mood as keyof typeof MOOD_INFO]?.emoji || '💭'}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Confession */}
        {confession && (
          <motion.div
            className="p-6 bg-accent-star-glow/10 backdrop-blur rounded-3xl border border-accent-star-glow/30 mt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart size={20} className="text-accent-star-glow fill-accent-star-glow" />
              <h3 className="text-headline-s text-accent-star-glow">最想对你说</h3>
            </div>
            <p className="text-body-l text-white leading-relaxed whitespace-pre-wrap">
              {confession}
            </p>
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-body-s text-white/60 mb-2">
                距离重逢还有 <span className="text-accent-star-glow font-medium">{Math.max(0, daysLeft)}</span> 天
              </p>
              <motion.p
                className="text-body-l text-white"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                我会一直等你
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Back button */}
      <div className="pt-4 relative z-10 flex-shrink-0">
        <motion.button
          onClick={onPrev}
          className="flex items-center gap-2 mx-auto px-4 py-3 text-white/70"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={20} />
          <span className="text-body-s">返回</span>
        </motion.button>
      </div>

      {/* Footer */}
      <motion.div
        className="text-center py-4 relative z-10 flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-body-s text-white/50">
          —— 写给{partnerName}的信 ——
        </p>
      </motion.div>
    </motion.div>
  );
}

// 时光轴记录卡片
function TimelineRecordCard({ 
  record, 
  onImageClick 
}: { 
  record: JournalRecord; 
  onImageClick: (url: string) => void;
}) {
  const typeInfo = RECORD_TYPE_INFO[record.type];
  const moodInfo = MOOD_INFO[record.mood];
  const IconComponent = iconMap[typeInfo.icon as keyof typeof iconMap];
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  const validImages = record.images.filter((_, i) => !imageErrors[i]);

  return (
    <div className="bg-card/80 backdrop-blur rounded-2xl p-4 shadow-soft border border-border">
      {/* Images */}
      {validImages.length > 0 && (
        <div className={`mb-3 ${validImages.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
          {record.images.slice(0, 4).map((img, i) => (
            !imageErrors[i] && (
              <motion.div
                key={i}
                className={`rounded-xl overflow-hidden cursor-pointer ${
                  validImages.length === 1 ? 'aspect-video' : 'aspect-square'
                }`}
                whileTap={{ scale: 0.98 }}
                onClick={() => onImageClick(img)}
              >
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={() => setImageErrors(prev => ({ ...prev, [i]: true }))}
                />
              </motion.div>
            )
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <IconComponent size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-body-s font-medium text-foreground">{typeInfo.label}</span>
            <span className="text-body-s text-muted-foreground">
              {format(new Date(record.createdAt), 'HH:mm')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-body-s text-secondary-foreground whitespace-nowrap">
              <span>{moodInfo.emoji}</span>
            </span>
          </div>

          {record.text && (
            <p className="text-body-l text-foreground mb-2">{record.text}</p>
          )}

          {record.forYou && (
            <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-1 text-primary mb-1">
                <Heart size={12} className="fill-primary" />
                <span className="text-body-s font-medium">想对你说</span>
              </div>
              <p className="text-body-s text-foreground italic">"{record.forYou}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 导航按钮组件
function NavigationButtons({
  onPrev,
  onNext,
  nextLabel,
}: {
  onPrev: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="pt-4 flex items-center justify-between gap-4">
      <motion.button
        onClick={onPrev}
        className="flex items-center gap-2 px-4 py-3 text-muted-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={20} />
        <span className="text-body-s">返回</span>
      </motion.button>

      <motion.button
        onClick={onNext}
        className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-elevated"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-body-s font-medium">{nextLabel}</span>
        <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}
