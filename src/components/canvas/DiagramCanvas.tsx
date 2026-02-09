import { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize2, Image as ImageIcon } from '../ui/icons';

interface DiagramCanvasProps {
  imageData?: string;
  isGenerating?: boolean;
  iteration?: number;
  stage?: string;
  message?: string;
}

export function DiagramCanvas({
  imageData,
  isGenerating = false,
  iteration = 0,
  stage = '',
  message = ''
}: DiagramCanvasProps) {
  const [zoom, setZoom] = useState(100);

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

    const img = new Image();
    img.src = imageData;

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

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 glass glass-shadow animate-pulse"
            style={{
              border: '2px solid var(--accent-1)'
            }}
          >
            <ImageIcon size={32} style={{ color: 'var(--accent-1)' }} />
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {message || 'Generating diagram...'}
          </h2>
          {iteration > 0 && (
            <p
              className="text-sm mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
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

  if (!imageData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 glass glass-shadow"
            style={{
              border: '2px dashed var(--border)'
            }}
          >
            <ImageIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            No visualization yet
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
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
            Zoom: {zoom}%
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleDownload}
            className="p-2 rounded-md hover:glass transition-all"
            style={{ color: 'var(--text-primary)' }}
            title="Download"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto p-8 flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface)' }}
      >
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
      </div>
    </div>
  );
}
