import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ImagePlus, X, Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { getRecords, updateRecord, deleteRecord, uploadImage, deleteImage } from '@/lib/storage';
import { JournalRecord, RecordType, MoodType, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';
import { toast } from 'sonner';

export default function EditRecordPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [record, setRecord] = useState<JournalRecord | null>(null);
  const [type, setType] = useState<RecordType>('photo');
  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodType>('normal');
  const [forYou, setForYou] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadRecord() {
      if (!id) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      const records = await getRecords();
      const found = records.find(r => r.id === id);
      
      if (found) {
        setRecord(found);
        setType(found.type);
        setImages(found.images);
        setText(found.text);
        setMood(found.mood);
        setForYou(found.forYou);
      } else {
        toast.error('记录不存在');
        navigate('/');
      }
      setLoading(false);
    }
    loadRecord();
  }, [id, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setUploading(true);
    try {
      const filesToUpload = Array.from(files).slice(0, 4 - images.length);
      const uploadedUrls: string[] = [];
      
      for (const file of filesToUpload) {
        const url = await uploadImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      setImages(prev => [...prev, ...uploadedUrls].slice(0, 4));
    } catch {
      toast.error('图片上传失败');
    }
    setUploading(false);
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    // 尝试删除云端图片
    await deleteImage(imageUrl);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!record) return;
    
    if (!text.trim() && images.length === 0) {
      toast.error('请添加内容或图片');
      return;
    }
    
    setSaving(true);
    
    const success = await updateRecord(record.id, {
      type,
      images,
      text: text.trim(),
      mood,
      forYou: forYou.trim(),
    });
    
    setSaving(false);
    
    if (success) {
      toast.success('已保存修改');
      navigate(-1);
    } else {
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    
    setDeleting(true);
    
    // 删除关联的图片
    for (const imageUrl of record.images) {
      await deleteImage(imageUrl);
    }
    
    const success = await deleteRecord(record.id);
    
    setDeleting(false);
    
    if (success) {
      toast.success('记录已删除');
      navigate('/');
    } else {
      toast.error('删除失败，请重试');
    }
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

  if (!record) return null;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4 safe-area-top">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} className="text-foreground" />
          </motion.button>
          <h1 className="text-headline-s text-foreground">编辑记录</h1>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary"
            whileTap={{ scale: 0.9 }}
          >
            {saving ? (
              <Loader2 size={20} className="text-primary-foreground animate-spin" />
            ) : (
              <Check size={20} className="text-primary-foreground" />
            )}
          </motion.button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Type Selection */}
        <div>
          <label className="text-body-s font-medium text-foreground mb-3 block">记录类型</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RECORD_TYPE_INFO) as RecordType[]).map((t) => (
              <motion.button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-full text-body-s font-medium transition-colors ${
                  type === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {RECORD_TYPE_INFO[t].label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-body-s font-medium text-foreground mb-3 block">照片</label>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, index) => (
              <motion.div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-foreground/50 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-background" />
                </button>
              </motion.div>
            ))}
            {images.length < 4 && (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-secondary/50"
                whileTap={{ scale: 0.95 }}
              >
                {uploading ? (
                  <Loader2 size={24} className="text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={24} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">添加</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Text Input */}
        <div>
          <label className="text-body-s font-medium text-foreground mb-3 block">内容</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="今天发生了什么..."
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Mood Selection */}
        <div>
          <label className="text-body-s font-medium text-foreground mb-3 block">此刻心情</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOOD_INFO) as MoodType[]).map((m) => (
              <motion.button
                key={m}
                onClick={() => setMood(m)}
                className={`px-4 py-2 rounded-full text-body-s font-medium transition-colors flex items-center gap-1 ${
                  mood === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span>{MOOD_INFO[m].emoji}</span>
                <span>{MOOD_INFO[m].label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* For You */}
        <div>
          <label className="text-body-s font-medium text-foreground mb-3 block">
            想对TA说 💕
          </label>
          <Input
            value={forYou}
            onChange={(e) => setForYou(e.target.value)}
            placeholder="这一刻，我想对你说..."
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 text-body-l font-medium bg-gradient-to-r from-primary to-accent-rose-gold text-primary-foreground rounded-2xl shadow-elevated"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              '保存修改'
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={deleting}
                className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-2xl"
              >
                {deleting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    删除这条记录
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要删除这条记录吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作无法撤销。这条记录和相关的照片都会被永久删除。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  确定删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
