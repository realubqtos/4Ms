import { useState, useEffect } from 'react';
import { Settings, LogOut } from '../ui/icons';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';

export function SidebarFooter() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const truncateEmail = (email: string) => {
    if (email.length > 20) {
      return email.slice(0, 17) + '...';
    }
    return email;
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  if (!user) return null;

  return (
    <div
      className="mt-auto border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      {showLogoutConfirm && (
        <div
          className="p-3 m-3 rounded-lg glass glass-shadow"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs mb-3" style={{ color: 'var(--text-primary)' }}>
            Are you sure you want to sign out?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSignOut}
              className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: 'var(--accent-3)',
                color: '#FFFFFF'
              }}
            >
              Yes, Sign Out
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all glass"
              style={{ color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: '#FFFFFF'
            }}
          >
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {profile?.full_name || 'User'}
            </div>
            <div
              className="text-xs truncate"
              style={{ color: 'var(--text-tertiary)' }}
              title={user.email || ''}
            >
              {truncateEmail(user.email || '')}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all glass glass-shadow glass-hover"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all glass glass-shadow glass-hover"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
