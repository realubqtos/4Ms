export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface DiagramNode {
  id: string;
  type: 'circle' | 'rect' | 'ellipse' | 'polygon' | 'text' | 'image' | 'path';
  position: Point;
  size?: Size;
  style?: NodeStyle;
  data?: Record<string, unknown>;
  label?: string;
  children?: DiagramNode[];
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: 'straight' | 'bezier' | 'step' | 'smooth';
  style?: EdgeStyle;
  label?: string;
  points?: Point[];
}

export interface DiagramAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'line' | 'box' | 'callout';
  position: Point;
  content: string;
  style?: AnnotationStyle;
  target?: string;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
  markerEnd?: string;
  markerStart?: string;
}

export interface AnnotationStyle extends NodeStyle {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
}

export interface DiagramLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: (DiagramNode | DiagramEdge | DiagramAnnotation)[];
}

export interface DiagramMetadata {
  title?: string;
  description?: string;
  domain?: string;
  type?: string;
  created_at?: string;
  version?: string;
  author?: string;
}

export interface A2UICanvasData {
  version: string;
  metadata: DiagramMetadata;
  canvas: {
    width: number;
    height: number;
    background?: string;
    viewBox?: string;
  };
  layers: DiagramLayer[];
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  annotations?: DiagramAnnotation[];
}

export type DiagramElement = DiagramNode | DiagramEdge | DiagramAnnotation;

export interface CanvasState {
  zoom: number;
  pan: Point;
  selectedElements: string[];
  hoveredElement: string | null;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'json' | 'pdf';
  quality?: number;
  scale?: number;
  includeBackground?: boolean;
}
