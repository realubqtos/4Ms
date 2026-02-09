import { ReactNode } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { AuthForm } from './AuthForm';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}
