import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ImagePlus, X, Mic, MicOff, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveRecord, uploadImage } from '@/lib/storage';
import { RecordType, MoodType, RECORD_TYPE_INFO, MOOD_INFO } from '@/lib/types';
import { HeartScatter } from '@/components/HeartScatter';
import { toast } from 'sonner';

export default function NewRecordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as RecordType) || 'photo';
  
  const [type, setType] = useState<RecordType>(initialType);
  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodType>('normal');
  const [forYou, setForYou] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef(''); // 记录开始语音前的文本

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 遍历所有结果
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // 更新文本：基础文本 + 最终结果 + 临时结果（用于实时显示）
        setText(baseTextRef.current + finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onend = () => {
        // 语音结束时，更新基础文本为当前文本（只保留最终结果）
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast.error('请允许麦克风权限');
        } else if (event.error === 'no-speech') {
          toast.error('没有检测到语音');
        } else {
          toast.error('语音识别出错');
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // 先请求麦克风权限
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        // 判断具体错误类型
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            toast.error('麦克风权限被拒绝，请在浏览器设置中允许');
          } else if (err.name === 'NotFoundError') {
            toast.error('未检测到麦克风设备');
          } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
            toast.error('当前环境不支持语音输入，请在新窗口中打开网站');
          } else {
            toast.error('无法访问麦克风');
          }
        } else {
          toast.error('无法访问麦克风');
        }
        return;
      }
      
      // 保存开始语音前的文本
      baseTextRef.current = text;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        toast.error('无法启动语音识别，请尝试在新窗口中打开');
      }
    }
  };

  const handleSave = async () => {
    if (!text.trim() && images.length === 0) {
      toast.error('请添加内容或图片');
      return;
    }
    
    setSaving(true);
    
    const record = await saveRecord({
      type,
      images,
      text: text.trim(),
      mood,
      forYou: forYou.trim(),
      createdAt: new Date().toISOString(),
    });
    
    setSaving(false);
    
    if (record) {
      setShowHearts(true);
    } else {
      toast.error('保存失败，请重试');
    }
  };

  const handleHeartsComplete = () => {
    setShowHearts(false);
    toast.success('记录已保存 💕');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <HeartScatter trigger={showHearts} onComplete={handleHeartsComplete} />
      
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
          <h1 className="text-headline-s text-foreground">新记录</h1>
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
          <label className="text-body-s font-medium text-foreground mb-3 block">添加照片</label>
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
                whileHover={{ borderColor: 'hsl(var(--primary))' }}
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
          <div className="flex items-center justify-between mb-3">
            <label className="text-body-s font-medium text-foreground">写点什么</label>
            {isSpeechSupported && (
              <motion.button
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-body-s ${
                  isRecording
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isRecording ? (
                  <>
                    <MicOff size={14} />
                    <span>停止</span>
                  </>
                ) : (
                  <>
                    <Mic size={14} />
                    <span>语音</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="今天发生了什么..."
            className="min-h-[120px] resize-none"
          />
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="flex items-center gap-2 mt-2 text-destructive"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-destructive"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-body-s">正在听你说...</span>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 text-body-l font-medium bg-gradient-to-r from-primary to-accent-rose-gold text-primary-foreground rounded-2xl shadow-elevated"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              '保存这份记录 💕'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
