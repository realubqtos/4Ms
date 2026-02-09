import { ReactNode } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { AuthForm } from './AuthForm';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold mb-4 animate-pulse"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: 'var(--bg)'
            }}
          >
            4Ms
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <AuthForm />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div
          className="max-w-md w-full p-8 rounded-xl border text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold mb-4"
            style={{
              backgroundColor: 'rgba(224, 90, 50, 0.2)',
              color: 'var(--accent-3)'
            }}
          >
            🔒
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            You do not have administrator privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: 'var(--bg)'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
