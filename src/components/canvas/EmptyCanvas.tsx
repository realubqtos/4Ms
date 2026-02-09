import { Image } from '../ui/icons';

export function EmptyCanvas() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 glass glass-shadow"
          style={{
            border: '2px dashed var(--border)'
          }}
        >
          <Image size={32} style={{ color: 'var(--text-tertiary)' }} />
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
          Upload a file or start a conversation with the AI to generate scientific visualizations
        </p>
      </div>
    </div>
  );
}
