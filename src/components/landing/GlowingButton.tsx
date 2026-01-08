import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlowingButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlowingButton = ({ 
  children, 
  icon: Icon, 
  onClick, 
  variant = 'primary',
  size = 'md',
  className 
}: GlowingButtonProps) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
    ghost: 'bg-transparent hover:bg-primary/10 text-foreground border border-border/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {/* Glow effect for primary */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-xl bg-primary/50 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 -z-10" />
      )}
      
      {Icon && (
        <motion.span
          whileHover={{ rotate: 12 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-4 h-4" />
        </motion.span>
      )}
      {children}
    </motion.button>
  );
};
