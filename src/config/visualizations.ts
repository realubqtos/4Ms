import { GitBranch, Boxes, BarChart3, GraduationCap, type LucideIcon } from 'lucide-react';

export type VisualizationType = 'processes' | 'structural' | 'statistical' | 'educational';

export interface VisualizationConfig {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  examples: string[];
}

export const visualizationTypes: VisualizationType[] = ['processes', 'structural', 'statistical', 'educational'];

export const visualizationConfig: Record<VisualizationType, VisualizationConfig> = {
  processes: {
    name: 'Processes',
    description: 'Methodology diagrams, workflows, research pipelines, and decision trees',
    icon: GitBranch,
    color: '#10b981',
    examples: ['PRISMA flow diagram', 'experimental pipeline', 'algorithm flowchart'],
  },
  structural: {
    name: 'Structural',
    description: 'System architectures, component diagrams, molecular structures, and hierarchies',
    icon: Boxes,
    color: '#3b82f6',
    examples: ['neural network architecture', 'protein structure', 'system design'],
  },
  statistical: {
    name: 'Statistical',
    description: 'Charts, plots, distributions, regression analyses, and data visualizations',
    icon: BarChart3,
    color: '#f59e0b',
    examples: ['scatter plot with regression', 'box plot comparison', 'correlation heatmap'],
  },
  educational: {
    name: 'Educational',
    description: 'Explanatory figures, concept maps, poster assets, and teaching materials',
    icon: GraduationCap,
    color: '#8b5cf6',
    examples: ['concept diagram', 'poster figure panel', 'annotated illustration'],
  },
};

export const domainConfig = visualizationConfig;
export const domains = visualizationTypes;
export type Domain = VisualizationType;
