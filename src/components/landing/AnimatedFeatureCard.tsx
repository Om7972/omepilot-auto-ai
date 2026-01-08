import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

export const AnimatedFeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay = 0 
}: AnimatedFeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 }
      }}
      className="group relative"
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        gradient
      )} />
      
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 h-full">
        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
        
        {/* Icon container */}
        <motion.div 
          className={cn(
            "relative w-14 h-14 rounded-xl flex items-center justify-center mb-4",
            gradient
          )}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-7 h-7 text-primary-foreground" />
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg" />
        </motion.div>
        
        {/* Content */}
        <div className="relative space-y-2">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};
