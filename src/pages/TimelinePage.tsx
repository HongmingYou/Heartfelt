import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import { getRecords, groupRecordsByDate } from '@/lib/storage';
import { JournalRecord, RecordType, RECORD_TYPE_INFO } from '@/lib/types';
import { RecordCard } from '@/components/RecordCard';
import { EmptyState } from '@/components/EmptyState';

export default function TimelinePage() {
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [filter, setFilter] = useState<RecordType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      const data = await getRecords();
      setRecords(data);
      setLoading(false);
    }
    loadRecords();
  }, []);

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.type === filter);
  
  const groupedRecords = groupRecordsByDate(filteredRecords);
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={32} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 safe-area-top">
          <h1 className="text-display-s text-foreground mb-4">时光轴</h1>
          
          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-body-s font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              全部
            </motion.button>
            {(Object.keys(RECORD_TYPE_INFO) as RecordType[]).map((type) => (
              <motion.button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-body-s font-medium whitespace-nowrap transition-colors ${
                  filter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {RECORD_TYPE_INFO[type].label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {sortedDates.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="还没有记录"
            description="开始记录你的每一天吧，这些都会成为最珍贵的回忆"
          />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date, dateIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dateIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <h2 className="text-headline-s text-foreground">
                    {format(new Date(date), 'M月d日 EEEE', { locale: zhCN })}
                  </h2>
                  <span className="text-body-s text-muted-foreground">
                    {groupedRecords[date].length} 条
                  </span>
                </div>
                
                <div className="ml-6 border-l-2 border-border pl-4 space-y-3">
                  {groupedRecords[date].map((record) => (
                    <RecordCard key={record.id} record={record} compact />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
