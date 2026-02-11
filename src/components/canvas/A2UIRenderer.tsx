import { useRef, useState, useEffect, useCallback } from 'react';
import type { A2UICanvasData, DiagramNode, DiagramEdge, DiagramAnnotation, Point, CanvasState } from '../../types/diagram.types';
import { defaultA2UIConfig } from '../../lib/a2uiConfig';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

interface A2UIRendererProps {
  data: A2UICanvasData;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
  className?: string;
}

export function A2UIRenderer({ data, onExport, className = '' }: A2UIRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: defaultA2UIConfig.defaultZoom,
    pan: { x: 0, y: 0 },
    selectedElements: [],
    hoveredElement: null,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!defaultA2UIConfig.zoomEnabled) return;
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(
      defaultA2UIConfig.maxZoom,
      Math.max(defaultA2UIConfig.minZoom, canvasState.zoom + delta)
    );

    setCanvasState(prev => ({ ...prev, zoom: newZoom }));
  }, [canvasState.zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && defaultA2UIConfig.panEnabled) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y });
    }
  }, [canvasState.pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        },
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = () => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.min(defaultA2UIConfig.maxZoom, prev.zoom + 0.1),
    }));
  };

  const handleZoomOut = () => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(defaultA2UIConfig.minZoom, prev.zoom - 0.1),
    }));
  };

  const handleResetView = () => {
    setCanvasState({
      zoom: defaultA2UIConfig.defaultZoom,
      pan: { x: 0, y: 0 },
      selectedElements: [],
      hoveredElement: null,
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const renderNode = (node: DiagramNode) => {
    const { id, type, position, size, style, label } = node;
    const defaultSize = { width: 100, height: 100 };
    const nodeSize = size || defaultSize;

    const commonProps = {
      key: id,
      fill: style?.fill || '#3b82f6',
      stroke: style?.stroke || '#1e40af',
      strokeWidth: style?.strokeWidth || 2,
      opacity: style?.opacity || 1,
    };

    switch (type) {
      case 'rect':
        return (
          <g key={id}>
            <rect
              {...commonProps}
              x={position.x}
              y={position.y}
              width={nodeSize.width}
              height={nodeSize.height}
            />
            {label && (
              <text
                x={position.x + nodeSize.width / 2}
                y={position.y + nodeSize.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style?.stroke || '#000'}
                fontSize={style?.fontSize || 14}
              >
                {label}
              </text>
            )}
          </g>
        );
      case 'circle':
        return (
          <g key={id}>
            <circle
              {...commonProps}
              cx={position.x}
              cy={position.y}
              r={nodeSize.width / 2}
            />
            {label && (
              <text
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style?.stroke || '#000'}
                fontSize={style?.fontSize || 14}
              >
                {label}
              </text>
            )}
          </g>
        );
      case 'ellipse':
        return (
          <g key={id}>
            <ellipse
              {...commonProps}
              cx={position.x}
              cy={position.y}
              rx={nodeSize.width / 2}
              ry={nodeSize.height / 2}
            />
            {label && (
              <text
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style?.stroke || '#000'}
                fontSize={style?.fontSize || 14}
              >
                {label}
              </text>
            )}
          </g>
        );
      case 'text':
        return (
          <text
            key={id}
            x={position.x}
            y={position.y}
            fill={style?.fill || '#000'}
            fontSize={style?.fontSize || 16}
            fontFamily={style?.fontFamily || 'sans-serif'}
            fontWeight={style?.fontWeight || 'normal'}
          >
            {label}
          </text>
        );
      default:
        return null;
    }
  };

  const renderEdge = (edge: DiagramEdge) => {
    const { id, source, target, style, label, points } = edge;

    const sourceNode = data.nodes?.find(n => n.id === source);
    const targetNode = data.nodes?.find(n => n.id === target);

    if (!sourceNode || !targetNode) return null;

    const path = points && points.length > 0
      ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`
      : `M ${sourceNode.position.x} ${sourceNode.position.y} L ${targetNode.position.x} ${targetNode.position.y}`;

    return (
      <g key={id}>
        <path
          d={path}
          stroke={style?.stroke || '#64748b'}
          strokeWidth={style?.strokeWidth || 2}
          fill="none"
          opacity={style?.opacity || 1}
          strokeDasharray={style?.strokeDasharray}
          markerEnd={style?.markerEnd || 'url(#arrowhead)'}
        />
        {label && (
          <text
            x={(sourceNode.position.x + targetNode.position.x) / 2}
            y={(sourceNode.position.y + targetNode.position.y) / 2}
            textAnchor="middle"
            fill="#000"
            fontSize={12}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const renderAnnotation = (annotation: DiagramAnnotation) => {
    const { id, type, position, content, style } = annotation;

    switch (type) {
      case 'text':
        return (
          <text
            key={id}
            x={position.x}
            y={position.y}
            fill={style?.fill || '#000'}
            fontSize={style?.fontSize || 14}
          >
            {content}
          </text>
        );
      case 'arrow':
        return (
          <line
            key={id}
            x1={position.x}
            y1={position.y}
            x2={position.x + 50}
            y2={position.y + 50}
            stroke={style?.stroke || '#000'}
            strokeWidth={style?.strokeWidth || 2}
            markerEnd="url(#arrowhead)"
          />
        );
      default:
        return null;
    }
  };

  const viewBox = `0 0 ${data.canvas.width} ${data.canvas.height}`;

  return (
    <div className={`relative w-full h-full ${className}`} ref={containerRef}>
      <div
        className="w-full h-full overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${canvasState.zoom}) translate(${canvasState.pan.x / canvasState.zoom}px, ${canvasState.pan.y / canvasState.zoom}px)`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
            </marker>
          </defs>

          <rect
            width={data.canvas.width}
            height={data.canvas.height}
            fill={data.canvas.background || '#ffffff'}
          />

          {data.layers?.map(layer => (
            layer.visible && (
              <g key={layer.id} opacity={layer.opacity}>
                {layer.elements.map(element => {
                  if ('source' in element) {
                    return renderEdge(element as DiagramEdge);
                  } else if ('content' in element) {
                    return renderAnnotation(element as DiagramAnnotation);
                  } else {
                    return renderNode(element as DiagramNode);
                  }
                })}
              </g>
            )
          ))}

          {data.nodes?.map(renderNode)}
          {data.edges?.map(renderEdge)}
          {data.annotations?.map(renderAnnotation)}
        </svg>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Reset View"
        >
          <Maximize2 size={20} />
        </button>
        {onExport && (
          <button
            onClick={() => onExport('svg')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Export"
          >
            <Download size={20} />
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-sm">
        Zoom: {Math.round(canvasState.zoom * 100)}%
      </div>
    </div>
  );
}
