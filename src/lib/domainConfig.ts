import { Brain, FlaskConical, Waves, Ruler } from '../components/ui/icons';
import type { LucideIcon } from 'lucide-react';

export interface DomainEntry {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
}

export const domainConfig: Record<string, DomainEntry> = {
  mind: {
    icon: Brain,
    color: 'var(--accent-1)',
    label: 'Mind',
    description: 'Neuroscience & Psychology',
  },
  matter: {
    icon: FlaskConical,
    color: 'var(--accent-2)',
    label: 'Matter',
    description: 'Chemistry & Materials',
  },
  motion: {
    icon: Waves,
    color: 'var(--accent-3)',
    label: 'Motion',
    description: 'Physics & Engineering',
  },
  mathematics: {
    icon: Ruler,
    color: 'var(--accent-1)',
    label: 'Mathematics',
    description: 'Pure & Applied Math',
  },
};

export const domainKeys = ['mind', 'matter', 'motion', 'mathematics'] as const;
