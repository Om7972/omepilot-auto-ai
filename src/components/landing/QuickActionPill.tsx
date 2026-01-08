import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionPillProps {
  text: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  delay?: number;
}

export const QuickActionPill = ({ 
  text, 
  icon: Icon, 
  color, 
  onClick,
  delay = 0 
}: QuickActionPillProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-2.5 rounded-full",
        "border border-border/50 bg-card/60 backdrop-blur-sm",
        "hover:border-primary/50 hover:bg-card/80 transition-all duration-300",
        "shadow-sm hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
      
      <motion.span
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <Icon className={cn("w-4 h-4 transition-colors duration-300", color, "group-hover:text-primary")} />
      </motion.span>
      
      <span className="relative text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
        {text}
      </span>
      
      {/* Trailing glow */}
      <div className={cn(
        "absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        color.replace('text-', 'bg-')
      )} />
    </motion.button>
  );
};
