import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Heart, Camera, MessageSquare, Utensils, Edit3, Copy, Loader2 } from 'lucide-react';
import { getRecords, getSettings, getDaysUntilReunion, saveSettings } from '@/lib/storage';
import { JournalRecord, Settings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';

export default function LetterPage() {
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [confession, setConfession] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [recordsData, settingsData] = await Promise.all([
        getRecords(),
        getSettings(),
      ]);
      setRecords(recordsData);
      setSettings(settingsData);
      setConfession(settingsData.confession || '');
      setLoading(false);
    }
    loadData();
  }, []);

  const saveConfession = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings({
      ...settings,
      confession,
    });
    setSaving(false);
    setIsEditing(false);
    toast.success('已保存');
  };

  if (loading || !settings) {
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

  if (records.length === 0) {
    return (
      <div className="min-h-screen pb-24 bg-background flex items-center justify-center">
        <EmptyState
          icon={Mail}
          title="这封信还是空的"
          description="开始记录你的每一天，然后这封信会自动帮你汇总"
        />
      </div>
    );
  }

  const totalDays = records.length > 0 
    ? Math.ceil((new Date().getTime() - new Date(records[records.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const mealCount = records.filter(r => ['breakfast', 'lunch', 'dinner'].includes(r.type)).length;
  const photoCount = records.filter(r => r.images.length > 0).length;
  const thoughtCount = records.filter(r => r.text.length > 0).length;

  const featuredPhotos = records
    .filter(r => r.images.length > 0)
    .slice(0, 6)
    .map(r => r.images[0]);

  const featuredQuotes = records
    .filter(r => r.forYou)
    .slice(0, 5)
    .map(r => ({ text: r.forYou, date: r.createdAt }));

  const handleShare = () => {
    const text = `这${totalDays}天里，我记录了${mealCount}顿饭、拍了${photoCount}张照片、写了${thoughtCount}段话。每一天都在想你。`;
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-secondary/50 to-background">
      {/* Letter Paper Effect */}
      <motion.div
        className="mx-4 mt-8 bg-card rounded-2xl shadow-elevated overflow-hidden safe-area-top"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Letter Header */}
        <div className="bg-gradient-to-r from-primary to-accent-rose-gold p-6 text-center">
          <motion.div
            className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Mail size={32} className="text-primary-foreground" />
          </motion.div>
          <h1 className="text-display-s text-primary-foreground">
            给{settings.partnerName || '你'}的信
          </h1>
        </div>

        {/* Letter Content */}
        <div className="p-6 space-y-8">
          {/* Stats Summary */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.p
              className="text-body-l text-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              在这 <span className="text-primary font-bold text-xl">{totalDays}</span> 天里
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Utensils, count: mealCount, label: '顿饭' },
              { icon: Camera, count: photoCount, label: '张照片' },
              { icon: MessageSquare, count: thoughtCount, label: '段话' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                className="text-center p-4 rounded-xl bg-secondary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <item.icon size={20} className="mx-auto text-primary mb-2" />
                <div className="text-headline-l text-foreground">{item.count}</div>
                <div className="text-body-s text-muted-foreground">{item.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Featured Photos */}
          {featuredPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <h3 className="text-headline-s text-foreground mb-3 flex items-center gap-2">
                <Camera size={18} className="text-primary" />
                精选照片
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {featuredPhotos.map((photo, i) => (
                  <motion.div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Featured Quotes */}
          {featuredQuotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <h3 className="text-headline-s text-foreground mb-3 flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                想对你说
              </h3>
              <div className="space-y-3">
                {featuredQuotes.map((quote, i) => (
                  <motion.div
                    key={i}
                    className="p-3 bg-secondary rounded-xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                  >
                    <p className="text-body-l text-foreground italic">"{quote.text}"</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confession */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-headline-s text-foreground flex items-center gap-2">
                <Edit3 size={18} className="text-primary" />
                最后一段话
              </h3>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-primary"
                >
                  编辑
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  placeholder="写下你最想说的话..."
                  className="min-h-[120px]"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={saveConfession} disabled={saving} className="flex-1">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            ) : confession ? (
              <motion.div
                className="p-4 bg-gradient-to-r from-primary/10 to-accent-rose-gold/10 rounded-xl border border-primary/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-body-l text-foreground leading-relaxed whitespace-pre-wrap">
                  {confession}
                </p>
              </motion.div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full p-4 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground hover:border-primary transition-colors"
              >
                点击添加你最想说的话
              </button>
            )}
          </motion.div>

          {/* Sign off */}
          <motion.div
            className="text-center pt-4 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
          >
            <p className="text-body-s text-muted-foreground">
              每一天都在想你 💕
            </p>
            <p className="text-body-s text-muted-foreground mt-1">
              距离重逢还有 <span className="text-primary font-medium">{getDaysUntilReunion(settings.reunionDate)}</span> 天
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Share Button */}
      <motion.div
        className="p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        <Button
          onClick={handleShare}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent-rose-gold text-primary-foreground rounded-2xl shadow-elevated"
        >
          <Copy size={18} className="mr-2" />
          复制分享文案
        </Button>
      </motion.div>
    </div>
  );
}
