import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Download, Trash2, AlertTriangle, Heart, Loader2, Share2, Copy, Check, MessageCircleHeart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { getSettings, saveSettings, exportData, clearAllRecords, getRecords } from '@/lib/storage';
import { Settings, JournalRecord } from '@/lib/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [copied, setCopied] = useState(false);

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
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    toast.success('设置已保存');
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/for-you`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('链接已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-journal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('数据已导出');
  };

  const handleClearData = async () => {
    setClearing(true);
    await clearAllRecords();
    setClearing(false);
    toast.success('数据已清除');
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4 safe-area-top">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} className="text-foreground" />
          </motion.button>
          <h1 className="text-headline-s text-foreground">设置</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Card */}
        <motion.div
          className="p-4 bg-card rounded-2xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Heart size={20} className="text-primary fill-primary" />
            </div>
            <div>
              <h3 className="text-headline-s text-foreground">Love Journal</h3>
              <p className="text-body-s text-muted-foreground">
                已记录 {records.length} 条内容
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reunion Date */}
        <motion.div
          className="p-4 bg-card rounded-2xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-body-l font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            重逢日期
          </label>
          <Input
            type="date"
            value={settings.reunionDate}
            onChange={(e) => setSettings({ ...settings, reunionDate: e.target.value })}
            className="mt-2"
          />
        </motion.div>

        {/* Partner Name */}
        <motion.div
          className="p-4 bg-card rounded-2xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-body-l font-medium text-foreground mb-3 flex items-center gap-2">
            <User size={18} className="text-primary" />
            TA的名字
          </label>
          <Input
            value={settings.partnerName}
            onChange={(e) => setSettings({ ...settings, partnerName: e.target.value })}
            placeholder="你最爱的人"
            className="mt-2"
          />
        </motion.div>

        {/* Confession - 最想说的话 */}
        <motion.div
          className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-body-l font-medium text-foreground mb-3 flex items-center gap-2">
            <MessageCircleHeart size={18} className="text-primary" />
            最想对TA说的话
          </label>
          <p className="text-body-s text-muted-foreground mb-3">
            这段话会在TA查看你的记录最后展示，是最重要的心里话
          </p>
          <Textarea
            value={settings.confession || ''}
            onChange={(e) => setSettings({ ...settings, confession: e.target.value })}
            placeholder="写下你最想对TA说的话..."
            className="mt-2 min-h-[120px] resize-none"
          />
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-gradient-to-r from-primary to-accent-rose-gold text-primary-foreground rounded-2xl shadow-elevated"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : '保存设置'}
          </Button>
        </motion.div>

        {/* Share Link for Partner */}
        <motion.div
          className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Share2 size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-body-l font-medium text-foreground">分享给TA</h3>
              <p className="text-body-s text-muted-foreground">让{settings.partnerName || 'TA'}看到你的记录</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-card rounded-xl text-body-s text-muted-foreground truncate border border-border">
              {window.location.origin}/for-you
            </div>
            <Button
              onClick={handleCopyShareLink}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </Button>
          </div>
          <p className="text-body-s text-muted-foreground mt-2 text-center">
            复制链接发送给{settings.partnerName || 'TA'}，让TA看到你的用心
          </p>
        </motion.div>

        {/* Visit Stats */}
        <motion.div
          className="p-4 bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl border border-accent/20 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          onClick={() => navigate('/visit-stats')}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Eye size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="text-body-l font-medium text-foreground">访问统计</h3>
                <p className="text-body-s text-muted-foreground">查看TA何时访问了你的记录</p>
              </div>
            </div>
            <div className="text-accent">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Export Data */}
        <motion.div
          className="p-4 bg-card rounded-2xl border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Download size={18} className="text-foreground" />
              </div>
              <div>
                <h3 className="text-body-l font-medium text-foreground">导出数据</h3>
                <p className="text-body-s text-muted-foreground">备份所有记录</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExport}>
              导出
            </Button>
          </div>
        </motion.div>

        {/* Clear Data */}
        <motion.div
          className="p-4 bg-card rounded-2xl border border-destructive/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 size={18} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-body-l font-medium text-foreground">清除数据</h3>
                <p className="text-body-s text-muted-foreground">删除所有记录</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={clearing}>
                  {clearing ? <Loader2 size={16} className="animate-spin" /> : '清除'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-destructive" />
                    确定要清除所有数据吗？
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作无法撤销。所有的记录、照片和文字都会被永久删除。建议先导出数据备份。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    确定清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-body-s text-muted-foreground">
            Love Journal 💕
          </p>
          <p className="text-body-s text-muted-foreground mt-1">
            用心记录每一天，等待与你重逢
          </p>
        </motion.div>
      </div>
    </div>
  );
}
