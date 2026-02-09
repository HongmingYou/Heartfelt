import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Loader2, ChevronDown, Camera, Sunrise, Sun, Moon, MessageCircleHeart, X } from 'lucide-react';
import { getRecords, getSettings, getDaysUntilReunion, groupRecordsByDate } from '@/lib/storage';
import { JournalRecord, Settings, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';

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
  const [currentSection, setCurrentSection] = useState(0); // 0: cover, 1: intro, 2: messages, 3: photos, 4: timeline, 5: confession
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    new Date(a).getTime() - new Date(b).getTime() // 按时间正序，从开始到现在
  );

  // 统计数据
  const totalDays = sortedDates.length;
  const mealCount = records.filter(r => ['breakfast', 'lunch', 'dinner'].includes(r.type)).length;
  const photoCount = records.reduce((acc, r) => acc + r.images.length, 0);
  const thoughtCount = records.filter(r => r.forYou).length;

  // 所有想说的话（按时间正序）
  const allMessages = records
    .filter(r => r.forYou)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(r => ({
      text: r.forYou,
      date: r.createdAt,
      mood: r.mood,
    }));

  // 所有照片
  const allPhotos = records
    .filter(r => r.images.length > 0)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .flatMap(r => r.images.map(img => ({ url: img, date: r.createdAt })));

  // 计算记录开始的日期
  const firstRecordDate = records.length > 0 
    ? new Date(records.reduce((min, r) => r.createdAt < min ? r.createdAt : min, records[0].createdAt))
    : new Date();

  const partnerName = settings.partnerName || '你';

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
    const maxSection = settings.confession ? 5 : 4;
    if (currentSection < maxSection) {
      setCurrentSection(prev => prev + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-secondary/20 overflow-hidden">
      <div ref={contentRef} className="h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Section 0: Cover - 封面 */}
          {currentSection === 0 && (
            <CoverSection 
              key="cover"
              partnerName={partnerName}
              daysLeft={daysLeft}
              totalDays={totalDays}
              onNext={handleNext}
            />
          )}

          {/* Section 1: Intro - 引言 */}
          {currentSection === 1 && (
            <IntroSection
              key="intro"
              partnerName={partnerName}
              firstRecordDate={firstRecordDate}
              totalDays={totalDays}
              mealCount={mealCount}
              photoCount={photoCount}
              thoughtCount={thoughtCount}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {/* Section 2: Messages - 想对你说的话 */}
          {currentSection === 2 && (
            <MessagesSection
              key="messages"
              messages={allMessages}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {/* Section 3: Photos - 照片墙 */}
          {currentSection === 3 && (
            <PhotosSection
              key="photos"
              photos={allPhotos}
              onImageClick={setSelectedImage}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {/* Section 4: Timeline - 时光轴 */}
          {currentSection === 4 && (
            <TimelineSection
              key="timeline"
              groupedRecords={groupedRecords}
              sortedDates={sortedDates}
              onImageClick={setSelectedImage}
              onNext={settings.confession ? handleNext : undefined}
              onPrev={handlePrev}
              hasConfession={!!settings.confession}
            />
          )}

          {/* Section 5: Confession - 最想说的话 */}
          {currentSection === 5 && settings.confession && (
            <ConfessionSection
              key="confession"
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
  onNext 
}: { 
  partnerName: string;
  daysLeft: number;
  totalDays: number;
  onNext: () => void;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
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
        <motion.p
          className="text-body-l text-muted-foreground mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          这是写给你的
        </motion.p>

        <motion.h1
          className="text-display-l gradient-text mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          亲爱的{partnerName}
        </motion.h1>

        {/* Countdown card */}
        <motion.div
          className="inline-block p-6 bg-card/80 backdrop-blur rounded-3xl shadow-elevated border border-border mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p className="text-body-s text-muted-foreground mb-2">距离我们重逢</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-display-l gradient-text">{Math.max(0, daysLeft)}</span>
            <span className="text-headline-l text-muted-foreground">天</span>
          </div>
          <p className="text-body-s text-muted-foreground mt-2">
            这 {totalDays} 天，我都在想你
          </p>
        </motion.div>

        {/* Enter button */}
        <motion.button
          onClick={onNext}
          className="flex flex-col items-center gap-2 mx-auto text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-body-l font-medium">打开这封信</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={28} />
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// 引言
function IntroSection({
  partnerName,
  firstRecordDate,
  totalDays,
  mealCount,
  photoCount,
  thoughtCount,
  onNext,
  onPrev,
}: {
  partnerName: string;
  firstRecordDate: Date;
  totalDays: number;
  mealCount: number;
  photoCount: number;
  thoughtCount: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col p-6 pt-12"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Letter paper style */}
      <div className="flex-1 bg-card/60 backdrop-blur rounded-3xl p-6 shadow-elevated border border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-body-l text-foreground leading-loose">
            亲爱的{partnerName}，
          </p>
          
          <p className="text-body-l text-foreground leading-loose mt-6">
            从 <span className="text-primary font-medium">{format(firstRecordDate, 'M月d日', { locale: zhCN })}</span> 开始，
            我决定记录下没有你在身边的每一天。
          </p>

          <p className="text-body-l text-foreground leading-loose mt-4">
            这 <span className="text-primary font-medium text-xl">{totalDays}</span> 天里...
          </p>

          {/* Stats */}
          <div className="mt-8 space-y-4">
            {mealCount > 0 && (
              <motion.div
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center">
                  <Sunrise size={24} className="text-foreground/80" />
                </div>
                <div>
                  <p className="text-headline-s text-foreground">
                    我认真吃了 <span className="gradient-text">{mealCount}</span> 顿饭
                  </p>
                  <p className="text-body-s text-muted-foreground">每一顿都想和你分享</p>
                </div>
              </motion.div>
            )}

            {photoCount > 0 && (
              <motion.div
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
                  <Camera size={24} className="text-foreground/80" />
                </div>
                <div>
                  <p className="text-headline-s text-foreground">
                    我拍了 <span className="gradient-text">{photoCount}</span> 张照片
                  </p>
                  <p className="text-body-s text-muted-foreground">想让你看看我的生活</p>
                </div>
              </motion.div>
            )}

            {thoughtCount > 0 && (
              <motion.div
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center">
                  <Heart size={24} className="text-foreground/80 fill-foreground/80" />
                </div>
                <div>
                  <p className="text-headline-s text-foreground">
                    我写了 <span className="gradient-text">{thoughtCount}</span> 句想对你说的话
                  </p>
                  <p className="text-body-s text-muted-foreground">每一句都是真心的</p>
                </div>
              </motion.div>
            )}
          </div>

          <motion.p
            className="text-body-l text-foreground leading-loose mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            现在，我想把这些都分享给你...
          </motion.p>
        </motion.div>
      </div>

      {/* Navigation */}
      <NavigationButtons onPrev={onPrev} onNext={onNext} nextLabel="看看我想说的话" />
    </motion.div>
  );
}

// 想对你说的话
function MessagesSection({
  messages,
  onNext,
  onPrev,
}: {
  messages: { text: string; date: string; mood: string }[];
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col p-6 pt-12"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Heart size={18} className="text-primary fill-primary" />
          <span className="text-body-l font-medium text-primary">想对你说的话</span>
        </div>
        <p className="text-body-s text-muted-foreground">
          每一句都是我想你的时候写的
        </p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className="p-5 bg-card/80 backdrop-blur rounded-2xl shadow-soft border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <p className="text-body-l text-foreground leading-relaxed italic">
              "{msg.text}"
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-body-s text-muted-foreground">
                {format(new Date(msg.date), 'M月d日 EEEE HH:mm', { locale: zhCN })}
              </span>
              <span className="text-body-s">
                {MOOD_INFO[msg.mood as keyof typeof MOOD_INFO]?.emoji || '💭'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <NavigationButtons onPrev={onPrev} onNext={onNext} nextLabel="看看我拍的照片" />
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
  return (
    <motion.div
      className="min-h-screen flex flex-col p-6 pt-12"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Camera size={18} className="text-primary" />
          <span className="text-body-l font-medium text-primary">我的生活照片</span>
        </div>
        <p className="text-body-s text-muted-foreground">
          点击可以放大查看
        </p>
      </motion.div>

      {/* Photo Grid */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
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
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-[11px] text-white/90">
                  {format(new Date(photo.date), 'M/d', { locale: zhCN })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <NavigationButtons onPrev={onPrev} onNext={onNext} nextLabel="查看完整时光轴" />
    </motion.div>
  );
}

// 时光轴
function TimelineSection({
  groupedRecords,
  sortedDates,
  onImageClick,
  onNext,
  onPrev,
  hasConfession,
}: {
  groupedRecords: Record<string, JournalRecord[]>;
  sortedDates: string[];
  onImageClick: (url: string) => void;
  onNext?: () => void;
  onPrev: () => void;
  hasConfession: boolean;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col p-6 pt-12"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Heart size={18} className="text-primary" />
          <span className="text-body-l font-medium text-primary">我们的时光轴</span>
        </div>
        <p className="text-body-s text-muted-foreground">
          记录了 {sortedDates.length} 天的点点滴滴
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-6">
        {sortedDates.map((date, dateIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + dateIndex * 0.05 }}
          >
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-glow" />
              <h3 className="text-headline-s text-foreground">
                {format(new Date(date), 'M月d日 EEEE', { locale: zhCN })}
              </h3>
            </div>

            {/* Records */}
            <div className="ml-6 border-l-2 border-primary/20 pl-4 space-y-3">
              {groupedRecords[date].map((record) => (
                <TimelineRecordCard 
                  key={record.id} 
                  record={record} 
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <NavigationButtons 
        onPrev={onPrev} 
        onNext={hasConfession ? onNext : undefined} 
        nextLabel={hasConfession ? "看看最后想说的话" : undefined}
        isLast={!hasConfession}
      />
    </motion.div>
  );
}

// 表白
function ConfessionSection({
  confession,
  partnerName,
  daysLeft,
  onPrev,
}: {
  confession: string;
  partnerName: string;
  daysLeft: number;
  onPrev: () => void;
}) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Love letter style card */}
        <div className="bg-card/80 backdrop-blur rounded-3xl p-8 shadow-elevated border border-primary/20">
          {/* Header decoration */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart size={40} className="text-primary fill-primary" />
          </motion.div>

          {/* Title */}
          <h2 className="text-headline-l text-center text-foreground mb-6">
            最想对你说的话
          </h2>

          {/* Confession content */}
          <p className="text-body-l text-foreground leading-loose whitespace-pre-wrap text-center">
            {confession}
          </p>

          {/* Signature */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-body-s text-muted-foreground mb-2">
              距离重逢还有 <span className="text-primary font-medium">{Math.max(0, daysLeft)}</span> 天
            </p>
            <motion.p
              className="text-body-l text-foreground"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              我会一直等你 💕
            </motion.p>
          </div>
        </div>

        {/* Back button */}
        <motion.button
          onClick={onPrev}
          className="mt-6 mx-auto flex items-center gap-2 px-6 py-3 text-muted-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronDown size={20} className="rotate-90" />
          <span>返回上一页</span>
        </motion.button>

        {/* Footer */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-body-s text-muted-foreground">
            —— 写给{partnerName}的信 ——
          </p>
        </motion.div>
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

  return (
    <div className="bg-card/60 backdrop-blur rounded-2xl p-4 shadow-soft border border-border">
      {/* Images */}
      {record.images.length > 0 && (
        <div className={`mb-3 ${record.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
          {record.images.slice(0, 4).map((img, i) => (
            <motion.div
              key={i}
              className={`rounded-xl overflow-hidden cursor-pointer ${
                record.images.length === 1 ? 'aspect-video' : 'aspect-square'
              }`}
              whileTap={{ scale: 0.98 }}
              onClick={() => onImageClick(img)}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </motion.div>
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-body-s text-secondary-foreground">
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
  isLast = false,
}: {
  onPrev: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isLast?: boolean;
}) {
  return (
    <div className="pt-4 flex items-center justify-between gap-4">
      <motion.button
        onClick={onPrev}
        className="flex items-center gap-2 px-4 py-3 text-muted-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronDown size={20} className="rotate-90" />
        <span className="text-body-s">返回</span>
      </motion.button>

      {onNext && nextLabel && (
        <motion.button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-elevated"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-body-s font-medium">{nextLabel}</span>
          <ChevronDown size={18} className="-rotate-90" />
        </motion.button>
      )}

      {isLast && (
        <motion.div
          className="flex items-center gap-2 px-4 py-3 text-primary"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart size={18} className="fill-primary" />
          <span className="text-body-s font-medium">完</span>
        </motion.div>
      )}
    </div>
  );
}
