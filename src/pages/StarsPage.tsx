import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { getRecords } from '@/lib/storage';
import { JournalRecord } from '@/lib/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EmptyState } from '@/components/EmptyState';

interface Star {
  record: JournalRecord;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function StarsPage() {
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      const allRecords = await getRecords();
      const recordsWithImages = allRecords.filter(r => r.images.length > 0);
      setRecords(recordsWithImages);
      
      // Generate star positions
      const newStars = recordsWithImages.map((record) => ({
        record,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        size: 8 + Math.random() * 12,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      }));
      setStars(newStars);
      setLoading(false);
    }
    loadRecords();
  }, []);

  const handleStarClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : records.length - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex < records.length - 1 ? selectedIndex + 1 : 0);
  };

  const selectedRecord = selectedIndex !== null ? records[selectedIndex] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-accent-starry pb-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={32} className="text-accent-star-glow" />
        </motion.div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-accent-starry pb-24 flex items-center justify-center">
        <EmptyState
          icon={Sparkles}
          title="星空还是空的"
          description="上传一些照片，它们会变成闪烁的星星"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-starry pb-24 overflow-hidden relative">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-accent-star-glow rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.4,
              '--delay': `${Math.random() * 3}s`,
              '--duration': `${2 + Math.random() * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 pt-8 safe-area-top text-center">
        <motion.h1
          className="text-display-s text-accent-star-glow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          星空相册
        </motion.h1>
        <motion.p
          className="text-body-s text-accent-star-glow/60 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {records.length} 颗星星，每一颗都是想你的日子
        </motion.p>
      </div>

      {/* Draggable star field */}
      <motion.div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-180px)] cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
        dragElastic={0.1}
        style={{ x: position.x, y: position.y }}
        onDragEnd={(_, info) => {
          setPosition({
            x: position.x + info.offset.x,
            y: position.y + info.offset.y,
          });
        }}
      >
        {stars.map((star, index) => (
          <motion.button
            key={star.record.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
            }}
            onClick={() => handleStarClick(index)}
            whileHover={{ scale: 1.5 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.div
              className="relative"
              animate={{
                opacity: [0.6, 1, 0.6],
                filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
              }}
            >
              <div
                className="rounded-full bg-accent-star-glow shadow-glow"
                style={{
                  width: star.size,
                  height: star.size,
                  boxShadow: `0 0 ${star.size}px rgba(255, 229, 180, 0.6), 0 0 ${star.size * 2}px rgba(255, 229, 180, 0.3)`,
                }}
              />
              <img
                src={star.record.images[0]}
                alt=""
                className="absolute inset-0 w-full h-full rounded-full object-cover opacity-0 hover:opacity-100 transition-opacity"
              />
            </motion.div>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer text */}
      <motion.p
        className="absolute bottom-28 left-0 right-0 text-center text-body-s text-accent-star-glow/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        这片星空，都是我想你的日子
      </motion.p>

      {/* Photo viewer modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center safe-area-top"
              onClick={handleClose}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} className="text-white" />
            </motion.button>

            <motion.button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              onClick={handlePrev}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={24} className="text-white" />
            </motion.button>

            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              onClick={handleNext}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={24} className="text-white" />
            </motion.button>

            <motion.div
              className="w-full max-w-lg px-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="rounded-2xl overflow-hidden bg-card">
                <img
                  src={selectedRecord.images[0]}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4">
                  <div className="text-body-s text-muted-foreground mb-2">
                    {format(new Date(selectedRecord.createdAt), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                  </div>
                  {selectedRecord.text && (
                    <p className="text-body-l text-foreground mb-3">
                      {selectedRecord.text}
                    </p>
                  )}
                  {selectedRecord.forYou && (
                    <p className="text-body-s text-primary italic">
                      💕 "{selectedRecord.forYou}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
