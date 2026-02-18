import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sunrise, Sun, Moon, Camera, MessageCircleHeart, Plus, Heart, Loader2, MessageSquare, ChevronRight, Reply } from 'lucide-react';
import { getSettings, getRecords, getDaysUntilReunion, getCommentsByRecords, Comment } from '@/lib/storage';
import { JournalRecord, RecordType, Settings, RECORD_TYPE_INFO } from '@/lib/types';
import { RecordCard } from '@/components/RecordCard';
import { EmptyState } from '@/components/EmptyState';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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

interface CommentWithRecord extends Comment {
  recordType: string;
  recordDate: string;
  hasReply: boolean;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [commentsWithRecords, setCommentsWithRecords] = useState<CommentWithRecord[]>([]);
  const [showCommentSheet, setShowCommentSheet] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [settingsData, recordsData] = await Promise.all([
        getSettings(),
        getRecords(),
      ]);
      
      setSettings(settingsData);
      setRecords(recordsData);

      if (recordsData.length > 0) {
        const ids = recordsData.map(r => r.id);
        const commentsMap = await getCommentsByRecords(ids);
        const recordMap = new Map(recordsData.map(r => [r.id, r]));

        const enriched: CommentWithRecord[] = [];
        for (const [recordId, comments] of Object.entries(commentsMap)) {
          const record = recordMap.get(recordId);
          if (!record) continue;

          const partnerComments = comments.filter(c => c.authorType === 'partner' && !c.replyTo);
          const authorReplies = comments.filter(c => c.authorType === 'author');

          for (const comment of partnerComments) {
            const hasReply = authorReplies.some(r => r.replyTo === comment.id);
            enriched.push({
              ...comment,
              recordType: record.type,
              recordDate: record.createdAt,
              hasReply,
            });
          }
        }

        enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCommentsWithRecords(enriched);
      }

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
  const unrepliedCount = commentsWithRecords.filter(c => !c.hasReply).length;

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

      {/* Comments Banner */}
      {commentsWithRecords.length > 0 && (
        <motion.div
          className="px-6 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="p-4 bg-primary/10 rounded-2xl border border-primary/20 cursor-pointer active:bg-primary/15 transition-colors"
            onClick={() => setShowCommentSheet(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-s font-medium text-foreground">TA 的留言</span>
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[11px] rounded-full font-medium">
                    {commentsWithRecords.length}
                  </span>
                  {unrepliedCount > 0 && (
                    <span className="text-[11px] text-primary">
                      {unrepliedCount} 条未回复
                    </span>
                  )}
                </div>
                <p className="text-body-s text-muted-foreground truncate mt-0.5">
                  点击查看全部留言
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Comments Sheet */}
      <Sheet open={showCommentSheet} onOpenChange={setShowCommentSheet}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl pb-safe">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-headline-s">
              TA 的留言 ({commentsWithRecords.length})
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 py-3 -mx-2 px-2" style={{ maxHeight: 'calc(75vh - 80px)' }}>
            {commentsWithRecords.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-body-s">
                暂无留言
              </div>
            ) : (
              <div className="space-y-2">
                {commentsWithRecords.map((comment) => {
                  const typeInfo = RECORD_TYPE_INFO[comment.recordType as RecordType];
                  return (
                    <motion.div
                      key={comment.id}
                      className="p-3 bg-card rounded-xl border border-border cursor-pointer active:bg-secondary/50 transition-colors"
                      onClick={() => {
                        setShowCommentSheet(false);
                        navigate(`/edit/${comment.recordId}`);
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[11px] text-primary font-medium">TA</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-s text-foreground leading-relaxed">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString('zh-CN', {
                                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">-</span>
                            <span className="text-[11px] text-muted-foreground">
                              {typeInfo?.label || '记录'}
                              ({format(new Date(comment.recordDate), 'M/d')})
                            </span>
                            {comment.hasReply ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                                <Reply size={9} /> 已回复
                              </span>
                            ) : (
                              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                                未回复
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/50 flex-shrink-0 mt-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
