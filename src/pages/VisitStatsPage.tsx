import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Eye, Calendar, Clock, TrendingUp, Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PageView {
  id: string;
  page_path: string;
  visited_at: string;
  user_agent: string | null;
}

export default function VisitStatsPage() {
  const navigate = useNavigate();
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadViews();
  }, []);

  async function loadViews() {
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .eq('page_path', '/for-you')
        .order('visited_at', { ascending: false });

      if (error) throw error;
      setViews(data || []);
    } catch (error) {
      console.error('Failed to load views:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteView(id: string) {
    try {
      const { error } = await supabase
        .from('page_views')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setViews(prev => prev.filter(v => v.id !== id));
      toast.success('记录已删除');
    } catch (error) {
      console.error('Failed to delete view:', error);
      toast.error('删除失败');
    }
  }

  async function clearAllViews() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('page_views')
        .delete()
        .eq('page_path', '/for-you');

      if (error) throw error;
      
      setViews([]);
      toast.success('已清空所有记录');
    } catch (error) {
      console.error('Failed to clear views:', error);
      toast.error('清空失败');
    } finally {
      setDeleting(false);
    }
  }

  // 按日期分组统计
  const viewsByDate = views.reduce((acc, view) => {
    const date = format(new Date(view.visited_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(view);
    return acc;
  }, {} as Record<string, PageView[]>);

  const sortedDates = Object.keys(viewsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const totalViews = views.length;
  const uniqueDays = sortedDates.length;
  const lastVisit = views.length > 0 ? views[0].visited_at : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-foreground"
          >
            <ArrowLeft size={20} />
            <span className="text-body-l">返回</span>
          </button>
          <h1 className="text-headline-l">数据统计</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-destructive/10">
                <Trash2 size={18} className="text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>清空所有访问记录？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将删除所有访问记录，无法恢复。确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAllViews}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleting ? '删除中...' : '确定清空'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            className="bg-card/80 backdrop-blur rounded-2xl p-4 border border-border shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-primary" />
              <span className="text-body-s text-muted-foreground">总访问</span>
            </div>
            <p className="text-headline-l text-foreground">{totalViews}</p>
            <p className="text-body-s text-muted-foreground">次</p>
          </motion.div>

          <motion.div
            className="bg-card/80 backdrop-blur rounded-2xl p-4 border border-border shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-body-s text-muted-foreground">访问天数</span>
            </div>
            <p className="text-headline-l text-foreground">{uniqueDays}</p>
            <p className="text-body-s text-muted-foreground">天</p>
          </motion.div>

          <motion.div
            className="bg-card/80 backdrop-blur rounded-2xl p-4 border border-border shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-body-s text-muted-foreground">日均</span>
            </div>
            <p className="text-headline-l text-foreground">
              {uniqueDays > 0 ? (totalViews / uniqueDays).toFixed(1) : 0}
            </p>
            <p className="text-body-s text-muted-foreground">次</p>
          </motion.div>
        </div>

        {/* Last Visit */}
        {lastVisit && (
          <motion.div
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart size={18} className="text-primary fill-primary" />
              <span className="text-body-l font-medium text-primary">最近访问</span>
            </div>
            <p className="text-headline-s text-foreground mb-1">
              {format(new Date(lastVisit), 'M月d日 EEEE', { locale: zhCN })}
            </p>
            <p className="text-body-s text-muted-foreground">
              {format(new Date(lastVisit), 'HH:mm:ss')}
            </p>
          </motion.div>
        )}

        {/* Visit History by Date */}
        <div>
          <h2 className="text-headline-s text-foreground mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            访问记录
          </h2>

          {views.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Eye size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-body-l text-muted-foreground mb-2">还没有访问记录</p>
              <p className="text-body-s text-muted-foreground">
                分享链接给TA，就能看到访问数据了
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {sortedDates.map((date, i) => (
                <motion.div
                  key={date}
                  className="bg-card/80 backdrop-blur rounded-2xl p-4 border border-border shadow-soft"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-body-l font-medium text-foreground">
                      {format(new Date(date), 'M月d日 EEEE', { locale: zhCN })}
                    </h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-body-s">
                      {viewsByDate[date].length} 次
                    </span>
                  </div>

                  <div className="space-y-2">
                    {viewsByDate[date].map((view, idx) => (
                      <div
                        key={view.id}
                        className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-xl group"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-body-s text-foreground">
                            第 {viewsByDate[date].length - idx} 次访问
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-body-s text-muted-foreground">
                            {format(new Date(view.visited_at), 'HH:mm:ss')}
                          </span>
                          <button
                            onClick={() => deleteView(view.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            title="删除此记录"
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <motion.div
          className="bg-secondary/50 rounded-2xl p-5 border border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-body-s text-muted-foreground leading-relaxed">
            💡 提示：悬停在记录上可以删除单条数据，点击右上角图标可以清空所有记录。
          </p>
        </motion.div>
      </div>
    </div>
  );
}
