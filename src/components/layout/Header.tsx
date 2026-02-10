import { ThemeToggle } from '../theme/ThemeToggle';
import { useAuth } from '../../providers/AuthProvider';
import { Menu } from '../ui/icons';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const { isAdmin } = useAuth();

  return (
    <header
      className="sticky top-8 z-50 glass glass-shadow"
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1rem'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-opacity-80 transition-all"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'var(--accent-1)',
                color: '#FFFFFF'
              }}
            >
              4M
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
                <span style={{ fontFamily: 'Ojuju, sans-serif', fontWeight: 800, fontOpticalSizing: 'auto' }}>
                  4Ms
                </span>{' '}
                <span className="hidden sm:inline" style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                  /fɔːrmz/
                </span>
              </h1>
              <p
                className="text-[10px] leading-tight tracking-wide hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                mind | mathematics | motion | matter | +science
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <div
              className="px-2 sm:px-3 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: 'var(--accent-3)',
                color: '#FFFFFF',
              }}
            >
              Admin
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
