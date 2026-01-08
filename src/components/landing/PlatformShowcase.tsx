import { motion } from 'framer-motion';
import { 
  Users, 
  Globe, 
  Shield, 
  Rocket,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GlowingButton } from './GlowingButton';

const platformStats = [
  { metric: 'Active Users', value: '50K+', trend: '+12%' },
  { metric: 'Messages Sent', value: '2.5M+', trend: '+28%' },
  { metric: 'Images Created', value: '500K+', trend: '+45%' },
  { metric: 'Documents Processed', value: '100K+', trend: '+18%' },
];

const testimonials = [
  { 
    name: 'Sarah Chen', 
    role: 'Product Designer', 
    avatar: '', 
    initials: 'SC',
    quote: 'Revolutionized my workflow!'
  },
  { 
    name: 'Alex Rivera', 
    role: 'Developer', 
    avatar: '', 
    initials: 'AR',
    quote: 'Best AI assistant ever!'
  },
  { 
    name: 'Jordan Kim', 
    role: 'Writer', 
    avatar: '', 
    initials: 'JK',
    quote: 'Incredibly intuitive!'
  },
];

const capabilities = [
  { icon: Users, label: 'Team Collaboration', desc: 'Work together in real-time' },
  { icon: Globe, label: 'Multi-language', desc: '100+ languages supported' },
  { icon: Shield, label: 'Enterprise Security', desc: 'SOC 2 compliant' },
  { icon: Rocket, label: 'Lightning Fast', desc: 'Sub-second responses' },
];

export const PlatformShowcase = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="w-full space-y-12 mt-16"
    >
      {/* Capabilities Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ y: -4 }}
            className="group p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <cap.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{cap.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cap.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Table with modern design */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border/50 bg-card/60">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Platform Performance
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Metric</TableHead>
              <TableHead className="text-muted-foreground text-right">Value</TableHead>
              <TableHead className="text-muted-foreground text-right">Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platformStats.map((stat, i) => (
              <motion.tr
                key={stat.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="border-border/30 hover:bg-primary/5 transition-colors"
              >
                <TableCell className="font-medium">{stat.metric}</TableCell>
                <TableCell className="text-right font-bold text-primary">{stat.value}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {stat.trend}
                  </Badge>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Testimonials with Avatars */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="space-y-4"
      >
        <h3 className="text-center text-lg font-semibold text-foreground mb-6">
          Trusted by Creators Worldwide
        </h3>
        
        <div className="flex flex-wrap justify-center gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all"
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={t.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {t.quote}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="text-center pt-8"
      >
        <GlowingButton variant="primary" size="lg" icon={ArrowRight}>
          Start Creating Now
        </GlowingButton>
        <p className="mt-3 text-sm text-muted-foreground">
          No credit card required • Free forever plan available
        </p>
      </motion.div>
    </motion.div>
  );
};
