import { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize2, Image as ImageIcon, Layers } from '../ui/icons';
import { A2UIRenderer } from './A2UIRenderer';
import { parseA2UIData, validateA2UIData } from '../../lib/a2uiConfig';
import type { A2UICanvasData } from '../../types/diagram.types';

interface DiagramCanvasProps {
  imageData?: string;
  diagramData?: string | object;
  isGenerating?: boolean;
  iteration?: number;
  stage?: string;
  message?: string;
}

type RenderMode = 'image' | 'a2ui' | 'none';

export function DiagramCanvas({
  imageData,
  diagramData,
  isGenerating = false,
  iteration = 0,
  stage = '',
  message = ''
}: DiagramCanvasProps) {
  const [zoom, setZoom] = useState(100);
  const [preferA2UI, setPreferA2UI] = useState(true);

  const parsedA2UIData = useMemo((): A2UICanvasData | null => {
    if (!diagramData) return null;
    const parsed = parseA2UIData(diagramData);
    if (parsed && validateA2UIData(parsed)) {
      return parsed;
    }
    return null;
  }, [diagramData]);

  const renderMode = useMemo((): RenderMode => {
    if (isGenerating) return 'none';
    if (preferA2UI && parsedA2UIData) return 'a2ui';
    if (imageData) return 'image';
    return 'none';
  }, [isGenerating, preferA2UI, parsedA2UIData, imageData]);

  const canToggleMode = !!parsedA2UIData && !!imageData;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `diagram-${Date.now()}.png`;
    link.click();
  };

  const handleFullscreen = () => {
    if (!imageData) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Diagram Fullscreen</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;">
            <img src="${imageData}" style="max-width:100%;max-height:100vh;" />
          </body>
        </html>
      `);
    }
  };

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    if (format === 'json' && parsedA2UIData) {
      const blob = new Blob([JSON.stringify(parsedA2UIData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagram-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png' && imageData) {
      handleDownload();
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 glass glass-shadow animate-pulse"
            style={{ border: '2px solid var(--accent-1)' }}
          >
            <ImageIcon size={32} style={{ color: 'var(--accent-1)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {message || 'Generating diagram...'}
          </h2>
          {iteration > 0 && (
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Iteration {iteration} - {stage}
            </p>
          )}
          <div className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((iteration || 0) / 3) * 100}%`,
                backgroundColor: 'var(--accent-1)'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (renderMode === 'none') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 glass glass-shadow"
            style={{ border: '2px dashed var(--border)' }}
          >
            <ImageIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No visualization yet
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start a conversation with the AI to generate scientific visualizations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between p-4 border-b glass"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {renderMode === 'a2ui' ? 'Interactive View' : `Zoom: ${zoom}%`}
          </span>
          {canToggleMode && (
            <button
              onClick={() => setPreferA2UI(!preferA2UI)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all"
              style={{
                backgroundColor: preferA2UI ? 'var(--accent-1)' : 'var(--surface)',
                color: preferA2UI ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}
              title={preferA2UI ? 'Switch to Image View' : 'Switch to Interactive View'}
            >
              <Layers size={14} />
              {preferA2UI ? 'Interactive' : 'Image'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderMode === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-md hover:glass transition-all"
                style={{ color: 'var(--text-primary)' }}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-md hover:glass transition-all"
                style={{ color: 'var(--text-primary)' }}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-md hover:glass transition-all"
                style={{ color: 'var(--text-primary)' }}
                title="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-2 rounded-md hover:glass transition-all"
            style={{ color: 'var(--text-primary)' }}
            title="Download PNG"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto p-8 flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        {renderMode === 'a2ui' && parsedA2UIData ? (
          <div className="w-full h-full min-h-[500px]">
            <A2UIRenderer
              data={parsedA2UIData}
              onExport={handleExport}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div
            className="transition-all duration-200"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
          >
            <img
              src={imageData}
              alt="Generated Diagram"
              className="max-w-full h-auto shadow-lg rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
