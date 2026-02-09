import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveSettings, getSettings } from '@/lib/storage';
import { Settings } from '@/lib/types';

export default function SetupPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [reunionDate, setReunionDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const data = await getSettings();
      setSettings(data);
      setPartnerName(data.partnerName);
      setReunionDate(data.reunionDate);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    await saveSettings({
      partnerName,
      reunionDate,
      isSetupComplete: true,
    });
    setSaving(false);
    navigate('/');
  };

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart size={40} className="text-primary fill-primary" />
          </div>
        </motion.div>

        <motion.h1
          className="text-display-s text-center mb-2 gradient-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Love Journal
        </motion.h1>
        <motion.p
          className="text-body-s text-muted-foreground text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          记录每一天，等待重逢的那天
        </motion.p>

        <motion.div
          className="space-y-6 bg-card rounded-2xl p-6 shadow-elevated"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <label className="text-body-s font-medium text-foreground mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              TA的名字（可选）
            </label>
            <Input
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="你最爱的人"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-body-s font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              重逢日期
            </label>
            <Input
              type="date"
              value={reunionDate}
              onChange={(e) => setReunionDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-12 text-body-l font-medium bg-gradient-to-r from-primary to-accent-rose-gold text-primary-foreground rounded-xl shadow-elevated hover:shadow-glow transition-all"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              '开始记录我们的故事'
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-body-s text-muted-foreground text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          每一天的思念，都会变成最美的礼物 💕
        </motion.p>
      </motion.div>
    </div>
  );
}
