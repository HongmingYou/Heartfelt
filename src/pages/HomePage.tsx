import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sunrise, Sun, Moon, Camera, MessageCircleHeart, Plus, Heart, Loader2 } from 'lucide-react';
import { getSettings, getRecords, getDaysUntilReunion } from '@/lib/storage';
import { JournalRecord, RecordType, Settings } from '@/lib/types';
import { RecordCard } from '@/components/RecordCard';
import { EmptyState } from '@/components/EmptyState';

const greetings = [
  '今天也要好好照顾自己哦',
  '想TA的时候，就来记录一下吧',
  '每一天都在靠近重逢的那天',
  '记录此刻，等TA回来看',
  '你的坚持，TA一定能感受到',
  '用心记录，用爱等待',
];

const quickActions: { type: RecordType; icon: typeof Sunrise; label: string; gradient: string }[] = [
  { type: 'breakfast', icon: Sunrise, label: '早餐', gradient: 'from-orange-200 to-amber-200' },
  { type: 'lunch', icon: Sun, label: '午餐', gradient: 'from-yellow-200 to-orange-200' },
  { type: 'dinner', icon: Moon, label: '晚餐', gradient: 'from-indigo-200 to-purple-200' },
  { type: 'photo', icon: Camera, label: '随手拍', gradient: 'from-pink-200 to-rose-200' },
  { type: 'thought', icon: MessageCircleHeart, label: '想说的话', gradient: 'from-rose-200 to-pink-200' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [settingsData, recordsData] = await Promise.all([
        getSettings(),
        getRecords(),
      ]);
      
      setSettings(settingsData);
      setRecords(recordsData);
      setLoading(false);

      if (!settingsData.isSetupComplete) {
        navigate('/setup');
      }
    }
    loadData();
  }, [navigate]);

  if (loading || !settings) {
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

  if (!settings.isSetupComplete) return null;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.createdAt.startsWith(todayStr));
  const daysLeft = getDaysUntilReunion(settings.reunionDate);

  const handleQuickAction = (type: RecordType) => {
    navigate(`/new?type=${type}`);
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <motion.div
        className="p-6 pt-8 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-body-s text-muted-foreground">
          {format(today, 'yyyy年M月d日 EEEE', { locale: zhCN })}
        </div>
        
        <motion.div
          className="mt-4 p-4 bg-card rounded-2xl shadow-soft border border-border"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-body-s text-muted-foreground">重逢倒计时</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-display-l gradient-text">{Math.max(0, daysLeft)}</span>
                <span className="text-body-l text-muted-foreground">天</span>
              </div>
            </div>
            <motion.div
              className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart size={28} className="text-primary fill-primary" />
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          className="mt-4 text-body-l text-center text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {greeting}
        </motion.p>
      </motion.div>

      {/* Quick Actions */}
      <div className="px-6">
        <h2 className="text-headline-s text-foreground mb-3">快速记录</h2>
        <div className="grid grid-cols-5 gap-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.type}
              onClick={() => handleQuickAction(action.type)}
              className={`flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br ${action.gradient}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(255, 182, 193, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon size={24} className="text-foreground/80" />
              <span className="text-[11px] mt-1 text-foreground/80 font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today's Records */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-headline-s text-foreground">今日记录</h2>
          {todayRecords.length > 0 && (
            <span className="text-body-s text-muted-foreground">
              {todayRecords.length} 条
            </span>
          )}
        </div>

        {todayRecords.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="还没有今天的记录"
            description="点击上方的按钮，记录此刻的生活吧"
          />
        ) : (
          <div className="space-y-3">
            {todayRecords.map((record) => (
              <RecordCard 
                key={record.id} 
                record={record} 
                compact 
                onClick={() => navigate(`/edit/${record.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
