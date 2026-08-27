import { Brain, FlaskConical, Waves, Ruler } from '../components/ui/icons';
import type { LucideIcon } from 'lucide-react';

export type Domain = 'mind' | 'matter' | 'motion' | 'mathematics';

interface DomainEntry {
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
}

export const domainConfig: Record<Domain, DomainEntry> = {
  mind: {
    label: 'Mind',
    description: 'Neuroscience, psychology, and cognition',
    color: '#8b5cf6',
    icon: Brain,
  },
  matter: {
    label: 'Matter',
    description: 'Chemistry, biology, and materials science',
    color: '#10b981',
    icon: FlaskConical,
  },
  motion: {
    label: 'Motion',
    description: 'Physics, engineering, and dynamics',
    color: '#f59e0b',
    icon: Waves,
  },
  mathematics: {
    label: 'Mathematics',
    description: 'Pure and applied mathematics',
    color: '#3b82f6',
    icon: Ruler,
  },
};

export const domainKeys = Object.keys(domainConfig) as Domain[];
