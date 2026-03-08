import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ExpandableSectionProps {
  title: string;
  icon?: any;
  children: React.ReactNode;
  color?: string;
  badge?: string;
  defaultOpen?: boolean;
}

export const ExpandableSection = ({ title, icon: Icon, children, color = 'hsl(var(--primary))', badge, defaultOpen = false }: ExpandableSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300" style={{
      backgroundColor: open ? 'hsl(222 28% 13%)' : 'hsl(222 28% 11%)',
      borderLeft: `3px solid ${open ? color : 'hsl(var(--border) / 0.3)'}`,
      border: `1px solid ${open ? color + '35' : 'hsl(var(--border) / 0.15)'}`,
      borderLeftWidth: '3px',
      borderLeftColor: open ? color : 'hsl(var(--border) / 0.25)',
      boxShadow: open ? `0 4px 24px ${color}12, inset 0 1px 0 ${color}10` : 'none',
    }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left group transition-colors"
        style={{ background: open ? `linear-gradient(135deg, ${color}08, transparent)` : 'transparent' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: open ? color + '18' : 'hsl(var(--muted) / 0.1)',
                boxShadow: open ? `0 0 12px ${color}30` : 'none',
              }}>
              <Icon className="w-3.5 h-3.5 transition-colors" style={{ color: open ? color : 'hsl(var(--muted-foreground))' }} />
            </div>
          )}
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {badge && (
            <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0 h-4 border-primary/20 bg-primary/5 text-primary">
              {badge}
            </Badge>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="shrink-0 ml-2 w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: open ? color + '12' : 'transparent' }}>
          <ChevronDown className="w-4 h-4 transition-colors" style={{ color: open ? color : 'hsl(var(--muted-foreground))' }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground"
              style={{ borderTop: `1px solid ${color}15` }}>
              <div className="pt-3">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
