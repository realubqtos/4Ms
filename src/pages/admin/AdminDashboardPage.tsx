import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalFigures: number;
  totalCollections: number;
  adminUsers: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    totalFigures: 0,
    totalCollections: 0,
    adminUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersResult, projectsResult, figuresResult, collectionsResult, adminsResult] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('figures').select('id', { count: 'exact', head: true }),
          supabase.from('collections').select('id', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('is_admin', true),
        ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalFigures: figuresResult.count || 0,
        totalCollections: collectionsResult.count || 0,
        adminUsers: adminsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: number;
    icon: string;
  }) => (
    <div
      className="p-6 rounded-xl border"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loading ? '...' : value.toLocaleString()}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickLink = ({ to, title, description }: { to: string; title: string; description: string }) => (
    <Link
      to={to}
      className="p-4 rounded-lg border hover:opacity-80 transition-opacity block"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </Link>
  );

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
            Dashboard
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Platform overview and administration tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard title="Projects" value={stats.totalProjects} icon="📁" />
        <StatCard title="Figures" value={stats.totalFigures} icon="📊" />
        <StatCard title="Collections" value={stats.totalCollections} icon="📚" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Admin Users</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {stats.adminUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Database</span>
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(108, 191, 161, 0.2)',
                  color: 'var(--accent-2)',
                }}
              >
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Storage</span>
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(108, 191, 161, 0.2)',
                  color: 'var(--accent-2)',
                }}
              >
                Active
              </span>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickLink
              to="/admin/users"
              title="User Management"
              description="View and manage user accounts"
            />
            <QuickLink
              to="/admin/audit"
              title="Audit Log"
              description="View administrative actions"
            />
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Platform Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Average Projects per User
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalUsers > 0
                ? (stats.totalProjects / stats.totalUsers).toFixed(1)
                : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Average Figures per Project
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalProjects > 0
                ? (stats.totalFigures / stats.totalProjects).toFixed(1)
                : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total Figures per User
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalUsers > 0
                ? (stats.totalFigures / stats.totalUsers).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
