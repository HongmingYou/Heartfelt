import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ChevronDown, Loader2 } from 'lucide-react';
import { getRecords, groupRecordsByWeek } from '@/lib/storage';
import { JournalRecord, MOOD_INFO } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';

interface WeekData {
  week: number;
  records: JournalRecord[];
}

function extractKeywords(records: JournalRecord[]): string[] {
  const text = records.map(r => r.text).join(' ');
  const words = text.split(/[\s，。！？、；：""''（）【】《》\n]+/).filter(w => w.length >= 2);
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function getMoodStats(records: JournalRecord[]) {
  const stats: Record<string, number> = {};
  records.forEach(r => {
    stats[r.mood] = (stats[r.mood] || 0) + 1;
  });
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({
      mood,
      count,
      emoji: MOOD_INFO[mood as keyof typeof MOOD_INFO]?.emoji || '📝',
    }));
}

export default function CapsulePage() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      const records = await getRecords();
      const grouped = groupRecordsByWeek(records);
      setWeeks(grouped);
      setLoading(false);
    }
    loadRecords();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={32} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="min-h-screen pb-24 bg-background flex items-center justify-center">
        <EmptyState
          icon={Gift}
          title="时光胶囊还是空的"
          description="记录一周的生活，就能看到这周的精华总结啦"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="p-4 pt-8 safe-area-top">
        <motion.h1
          className="text-display-s text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          时光胶囊
        </motion.h1>
        <motion.p
          className="text-body-s text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          每一周都是一份珍贵的礼物
        </motion.p>
      </div>

      {/* Week Capsules */}
      <div className="p-4 space-y-4">
        {weeks.map((weekData, index) => {
          const isExpanded = expandedWeek === weekData.week;
          const keywords = extractKeywords(weekData.records);
          const moodStats = getMoodStats(weekData.records);
          const photos = weekData.records
            .flatMap(r => r.images)
            .slice(0, 4);
          const forYouQuotes = weekData.records
            .filter(r => r.forYou)
            .map(r => r.forYou)
            .slice(0, 3);

          return (
            <motion.div
              key={weekData.week}
              className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => setExpandedWeek(isExpanded ? null : weekData.week)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-rose-gold flex items-center justify-center"
                    animate={isExpanded ? { rotate: 10 } : { rotate: 0 }}
                  >
                    <Gift size={24} className="text-primary-foreground" />
                  </motion.div>
                  <div className="text-left">
                    <h3 className="text-headline-s text-foreground">第 {weekData.week} 周</h3>
                    <p className="text-body-s text-muted-foreground">
                      {weekData.records.length} 条记录
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} className="text-muted-foreground" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Photos */}
                      {photos.length > 0 && (
                        <div>
                          <h4 className="text-body-s font-medium text-muted-foreground mb-2">
                            这周的照片
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                            {photos.map((photo, i) => (
                              <motion.div
                                key={i}
                                className="aspect-square rounded-lg overflow-hidden"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <img
                                  src={photo}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keywords */}
                      {keywords.length > 0 && (
                        <div>
                          <h4 className="text-body-s font-medium text-muted-foreground mb-2">
                            关键词云
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((word, i) => (
                              <motion.span
                                key={i}
                                className="px-3 py-1 bg-secondary rounded-full text-body-s text-secondary-foreground"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                {word}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mood Stats */}
                      <div>
                        <h4 className="text-body-s font-medium text-muted-foreground mb-2">
                          心情统计
                        </h4>
                        <div className="flex gap-4">
                          {moodStats.map((stat, i) => (
                            <motion.div
                              key={stat.mood}
                              className="flex items-center gap-1"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <span className="text-xl">{stat.emoji}</span>
                              <span className="text-body-s text-foreground">×{stat.count}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* For You Quotes */}
                      {forYouQuotes.length > 0 && (
                        <div>
                          <h4 className="text-body-s font-medium text-muted-foreground mb-2">
                            想对你说
                          </h4>
                          <div className="space-y-2">
                            {forYouQuotes.map((quote, i) => (
                              <motion.p
                                key={i}
                                className="text-body-s text-primary italic pl-3 border-l-2 border-primary"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                "{quote}"
                              </motion.p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
