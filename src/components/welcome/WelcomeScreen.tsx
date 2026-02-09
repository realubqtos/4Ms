interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

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
        <h1 className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome to 4Ms
        </h1>
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          mind | mathematics | motion | matter | science
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-12">
        <div
          className="p-6 rounded-xl border glass glass-shadow"
          style={{
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-3xl mb-3">🧠</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Mind
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Neuroscience and psychology visualizations for understanding cognition and behavior
          </p>
        </div>

        <div
          className="p-6 rounded-xl border glass glass-shadow"
          style={{
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-3xl mb-3">⚗️</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Matter
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Chemistry and materials science figures for molecules, reactions, and structures
          </p>
        </div>

        <div
          className="p-6 rounded-xl border glass glass-shadow"
          style={{
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Motion
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Physics and engineering diagrams for forces, energy, and dynamics
          </p>
        </div>

        <div
          className="p-6 rounded-xl border glass glass-shadow"
          style={{
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-3xl mb-3">📐</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Mathematics
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Mathematical visualizations for pure and applied mathematics
          </p>
        </div>
      </div>

      <div
        className="mt-12 p-8 rounded-xl border text-center glass glass-shadow-lg"
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
