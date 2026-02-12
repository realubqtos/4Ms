import { domainConfig, domains } from '../../lib/domainConfig';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const domainDescriptions: Record<string, string> = {
  mind: 'Neuroscience and psychology visualizations for understanding cognition and behavior',
  matter: 'Chemistry and materials science figures for molecules, reactions, and structures',
  motion: 'Physics and engineering diagrams for forces, energy, and dynamics',
  mathematics: 'Mathematical visualizations for pure and applied mathematics',
};

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-3xl font-bold mb-4"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: 'var(--bg)'
          }}
        >
          4Ms
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome to 4Ms
        </h1>
        <p className="text-base sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
          mind | mathematics | motion | matter | science
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
        {domains.map((key) => {
          const domain = domainConfig[key];
          const Icon = domain.icon;
          return (
            <div
              key={key}
              className="p-6 rounded-xl border glass glass-shadow"
              style={{
                borderColor: 'var(--border)'
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `color-mix(in srgb, ${domain.color} 15%, transparent)` }}
              >
                <Icon size={24} style={{ color: domain.color }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {domain.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {domainDescriptions[key]}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="mt-8 sm:mt-12 p-4 sm:p-8 rounded-xl border text-center glass glass-shadow-lg"
        style={{
          borderColor: 'var(--border)'
        }}
      >
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Get Started
        </h3>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Create publication-ready scientific figures through natural language conversations
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-3 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: 'var(--bg)'
          }}
        >
          Create Your First Figure
        </button>
      </div>

      <div
        className="text-center text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <p>Press <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)' }}>Ctrl + Shift + T</kbd> to cycle through themes</p>
      </div>
    </div>
  );
}
