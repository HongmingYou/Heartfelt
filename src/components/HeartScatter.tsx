import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartScatterProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function HeartScatter({ trigger, onComplete }: HeartScatterProps) {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newHearts = Array.from({ length: 10 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 200,
        y: -100 - Math.random() * 100,
        rotation: (Math.random() - 0.5) * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));
      setHearts(newHearts);

      const timer = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="fixed pointer-events-none z-[100]"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: 0,
            x: heart.x,
            y: heart.y,
            scale: heart.scale,
            rotate: heart.rotation,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Heart
            size={24}
            className="text-primary fill-primary"
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
