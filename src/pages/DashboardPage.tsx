import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Folder, Palette, Star, Flame } from '../components/ui/icons';
import { domainConfig, domainKeys } from '../lib/domainConfig';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projectCount: 0,
    figureCount: 0,
    favoriteCount: 0,
    recentFigures: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [projectsResult, figuresResult] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('figures').select('*').eq('user_id', user.id),
      ]);

      const figures = (figuresResult.data || []) as any[];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      setStats({
        projectCount: projectsResult.count || 0,
        figureCount: figures.length,
        favoriteCount: figures.filter((f: any) => f.is_favorite).length,
        recentFigures: figures.filter(
          (f: any) => new Date(f.created_at) > sevenDaysAgo
        ).length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { label: 'Projects', value: stats.projectCount, icon: Folder, color: 'var(--accent-1)' },
    { label: 'Figures', value: stats.figureCount, icon: Palette, color: 'var(--accent-2)' },
    { label: 'Favorites', value: stats.favoriteCount, icon: Star, color: 'var(--accent-3)' },
    { label: 'Last 7 days', value: stats.recentFigures, icon: Flame, color: 'var(--accent-1)' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Overview of your scientific visualization workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <Icon size={24} style={{ color: card.color }} />
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {card.value}
                  </div>
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              className="w-full text-left p-4 rounded-lg hover:opacity-90 transition-all"
              style={{
                backgroundColor: 'var(--accent-1)',
                color: 'var(--bg)'
              }}
            >
              <div className="font-medium">Create New Figure</div>
              <div className="text-sm opacity-80">Start a new visualization project</div>
            </button>
            <button
              className="w-full text-left p-4 rounded-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Browse Gallery
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                View your existing figures
              </div>
            </button>
            <button
              className="w-full text-left p-4 rounded-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Manage Projects
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Organize by scientific domain
              </div>
            </button>
          </div>
        </div>

        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            4Ms Domains
          </h2>
          <div className="space-y-3">
            {domainKeys.map((key: string) => {
              const domain = domainConfig[key];
              const Icon = domain.icon;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `color-mix(in srgb, ${domain.color} 15%, transparent)` }}
                  >
                    <Icon size={20} style={{ color: domain.color }} />
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {domain.label}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {domain.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
