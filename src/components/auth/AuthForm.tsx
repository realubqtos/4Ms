import { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(false);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onSuccess?.();
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        onSuccess?.();
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setResetSuccess(true);
        setEmail('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md p-8 rounded-xl border glass glass-shadow-lg"
      style={{
        borderColor: 'var(--border)'
      }}
    >
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold mb-4"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: 'var(--bg)'
          }}
        >
          4Ms
        </div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'signin'
            ? 'Welcome back to 4Ms'
            : mode === 'signup'
            ? 'Join 4Ms to create scientific visualizations'
            : 'Enter your email to receive a password reset link'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            placeholder="your@email.com"
          />
        </div>

        {mode !== 'reset' && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your password"
            />
          </div>
        )}

        {mode === 'signin' && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setError(null);
                setResetSuccess(false);
              }}
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--accent-1)' }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {resetSuccess && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(108, 191, 161, 0.1)',
              color: 'var(--accent-2)'
            }}
          >
            Password reset link sent! Check your email for instructions.
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(224, 90, 50, 0.1)',
              color: 'var(--accent-3)'
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: 'var(--bg)'
          }}
        >
          {loading
            ? 'Loading...'
            : mode === 'signin'
            ? 'Sign In'
            : mode === 'signup'
            ? 'Sign Up'
            : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            if (mode === 'reset') {
              setMode('signin');
            } else {
              setMode(mode === 'signin' ? 'signup' : 'signin');
            }
            setError(null);
            setResetSuccess(false);
          }}
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent-1)' }}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : mode === 'signup'
            ? 'Already have an account? Sign in'
            : 'Back to sign in'}
        </button>
      </div>
    </div>
  );
}
