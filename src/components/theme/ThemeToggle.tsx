import { useTheme } from '../../providers/ThemeProvider';
import { FlaskConical, BookOpen, Ruler, Palette } from '../ui/icons';

const themes = [
  { id: 'lab' as const, label: 'Lab', icon: FlaskConical },
  { id: 'sketchbook' as const, label: 'Sketchbook', icon: BookOpen },
  { id: 'blueprint' as const, label: 'Blueprint', icon: Ruler },
  { id: 'sidewalk' as const, label: 'Sidewalk', icon: Palette },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-md glass glass-shadow" style={{ backgroundColor: 'var(--surface-hover)' }}>
      {themes.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`p-2 rounded transition-all ${
              theme === t.id ? '' : 'opacity-50 hover:opacity-100'
            }`}
            style={{
              backgroundColor: theme === t.id ? 'var(--accent-1)' : 'transparent',
              color: theme === t.id ? '#FFFFFF' : 'var(--text-secondary)'
            }}
            title={`${t.label} theme (Ctrl+Shift+T to cycle)`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
