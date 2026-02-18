import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Clock, Sparkles, Gift, Eye, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/timeline', icon: Clock, label: '时光轴' },
  { path: '/stars', icon: Sparkles, label: '星空' },
  { path: '/capsule', icon: Gift, label: '胶囊' },
  { path: '/for-you?preview=true', icon: Eye, label: '预览' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide on certain pages (show on preview mode)
  const isPreview = location.pathname === '/for-you' && location.search.includes('preview=true');
  if ((['/new', '/settings', '/setup', '/for-you'].includes(location.pathname) && !isPreview) || location.pathname.startsWith('/edit/') || location.pathname.startsWith('/visit-stats')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const itemPath = item.path.split('?')[0];
          const isActive = location.pathname === itemPath || (itemPath === '/for-you' && isPreview);
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Icon
                  size={24}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl"
          whileTap={{ scale: 0.9 }}
        >
          <Settings size={20} className="text-muted-foreground" />
          <span className="text-[10px] mt-1 text-muted-foreground">设置</span>
        </motion.button>
      </div>
    </nav>
  );
}
