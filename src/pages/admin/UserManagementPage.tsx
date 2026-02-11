import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user: currentUser, sendPasswordResetEmail } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean) => {
    if (userId === currentUser?.id) {
      alert('You cannot change your own admin status');
      return;
    }

    if (!confirm(`Are you sure you want to ${currentIsAdmin ? 'remove' : 'grant'} admin privileges?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error: updateError } = await (supabase.rpc as any)('admin_update_user_role', {
        target_user_id: userId,
        new_role: currentIsAdmin ? 'user' : 'admin',
        new_is_admin: !currentIsAdmin,
      });

      if (updateError) throw updateError;

      await loadUsers();
      alert(`Admin status ${currentIsAdmin ? 'removed' : 'granted'} successfully`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    } finally {
      setActionLoading(false);
    }
  };

  const sendPasswordReset = async (email: string, userId: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await sendPasswordResetEmail(email);
      if (error) throw error;

      if (currentUser) {
        const { error: auditError } = await (supabase.from('admin_audit_log') as any).insert({
          admin_id: currentUser.id,
          action: 'send_password_reset',
          target_user_id: userId,
          details: { email },
        });

        if (auditError) console.error('Audit log error:', auditError);
      }

      alert('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset email');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="px-3 py-1 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'rgba(224, 90, 50, 0.2)',
              color: 'var(--accent-3)',
            }}
          >
            Admin
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            User Management
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage user accounts and permissions
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {loading ? (
        <div
          className="p-12 rounded-xl border text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    User
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Role
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Joined
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Last Login
                  </th>
                  <th
                    className="text-left px-6 py-4 font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {user.full_name || 'No name'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: user.is_admin
                            ? 'rgba(224, 90, 50, 0.2)'
                            : 'rgba(108, 191, 161, 0.2)',
                          color: user.is_admin ? 'var(--accent-3)' : 'var(--accent-2)',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          disabled={actionLoading || user.id === currentUser?.id}
                          className="px-3 py-1 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                          style={{
                            backgroundColor: user.is_admin
                              ? 'rgba(224, 90, 50, 0.2)'
                              : 'rgba(108, 191, 161, 0.2)',
                            color: user.is_admin ? 'var(--accent-3)' : 'var(--accent-2)',
                          }}
                        >
                          {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => sendPasswordReset(user.email, user.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p style={{ color: 'var(--text-secondary)' }}>
                No users found matching your search
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="mt-6 p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Total Users:</strong>{' '}
          {users.length} | <strong style={{ color: 'var(--text-primary)' }}>Admins:</strong>{' '}
          {users.filter((u) => u.is_admin).length}
        </p>
      </div>
    </div>
  );
}
