import type { A2UICanvasData, DiagramLayer } from '../types/diagram.types';

export interface A2UIConfig {
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomEnabled: boolean;
  panEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export const defaultA2UIConfig: A2UIConfig = {
  defaultZoom: 1,
  minZoom: 0.1,
  maxZoom: 4,
  zoomEnabled: true,
  panEnabled: true,
  gridSize: 20,
  snapToGrid: false,
  showGrid: false,
};

export function parseA2UIData(data: unknown): A2UICanvasData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const parsed = data as Record<string, unknown>;

  const defaultCanvas = {
    width: 800,
    height: 600,
    background: '#ffffff',
  };

  const defaultMetadata = {
    title: '',
    version: '1.0',
  };

  const defaultLayer: DiagramLayer = {
    id: 'default',
    name: 'Default Layer',
    visible: true,
    locked: false,
    opacity: 1,
    elements: [],
  };

  return {
    version: typeof parsed.version === 'string' ? parsed.version : '1.0',
    metadata: typeof parsed.metadata === 'object' && parsed.metadata ? parsed.metadata as A2UICanvasData['metadata'] : defaultMetadata,
    canvas: typeof parsed.canvas === 'object' && parsed.canvas ? parsed.canvas as A2UICanvasData['canvas'] : defaultCanvas,
    layers: Array.isArray(parsed.layers) ? parsed.layers as DiagramLayer[] : [defaultLayer],
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes as A2UICanvasData['nodes'] : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges as A2UICanvasData['edges'] : [],
    annotations: Array.isArray(parsed.annotations) ? parsed.annotations as A2UICanvasData['annotations'] : [],
  };
}

export function validateA2UIData(data: A2UICanvasData): boolean {
  if (!data.canvas || typeof data.canvas.width !== 'number' || typeof data.canvas.height !== 'number') {
    return false;
  }

  if (!Array.isArray(data.layers)) {
    return false;
  }

  const nodeIds = new Set<string>();

  if (data.nodes) {
    for (const node of data.nodes) {
      if (!node.id) return false;
      nodeIds.add(node.id);
    }
  }

  for (const layer of data.layers) {
    for (const element of layer.elements) {
      if ('id' in element && element.id) {
        nodeIds.add(element.id);
      }
    }
  }

  if (data.edges) {
    for (const edge of data.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false;
      }
    }
  }

  return true;
}
