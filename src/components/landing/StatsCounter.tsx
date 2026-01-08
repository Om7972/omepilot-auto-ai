import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCounterProps {
  value: number;
  label: string;
  icon: LucideIcon;
  suffix?: string;
  color?: string;
  delay?: number;
}

export const StatsCounter = ({ 
  value, 
  label, 
  icon: Icon, 
  suffix = '',
  color = 'text-primary',
  delay = 0
}: StatsCounterProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    
    const controls = animate(count, value, {
      duration: 2,
      delay,
      ease: 'easeOut'
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, delay, count, rounded]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm text-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn("inline-flex p-3 rounded-xl mb-3", `bg-${color.split('-')[1]}/10`)}
        >
          <Icon className={cn("w-6 h-6", color)} />
        </motion.div>
        
        <div className={cn("text-4xl font-bold mb-1", color)}>
          {displayValue}{suffix}
        </div>
        
        <div className="text-sm text-muted-foreground font-medium">
          {label}
        </div>
      </div>
    </motion.div>
  );
};
