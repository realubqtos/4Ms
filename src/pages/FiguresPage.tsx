import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Palette, Star } from '../components/ui/icons';
import { domainConfig } from '../lib/domainConfig';
import type { Database } from '../lib/database.types';

type Figure = Database['public']['Tables']['figures']['Row'];
type Domain = Database['public']['Enums']['domain'];

export function FiguresPage() {
  const { user } = useAuth();
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadFigures();
  }, [user]);

  const loadFigures = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('figures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFigures(data || []);
    } catch (error) {
      console.error('Error loading figures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFigures = selectedDomain === 'all'
    ? figures
    : figures.filter(f => f.domain === selectedDomain);

  const favoriteCount = figures.filter(f => f.is_favorite).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading figures...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Figure Library
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Browse and manage your scientific visualizations
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            className="flex items-center gap-2 p-1 rounded-lg"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'grid' ? '' : 'opacity-50'
              }`}
              style={{
                backgroundColor: viewMode === 'grid' ? 'var(--bg)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'list' ? '' : 'opacity-50'
              }`}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--bg)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              List
            </button>
          </div>
          <button
            className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: 'var(--bg)'
            }}
          >
            + Create Figure
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedDomain === 'all' ? 'font-medium' : 'opacity-60'
          }`}
          style={{
            backgroundColor: selectedDomain === 'all' ? 'var(--surface)' : 'transparent',
            color: 'var(--text-primary)'
          }}
        >
          All ({figures.length})
        </button>
        <button
          className="px-4 py-2 rounded-lg transition-all opacity-60 flex items-center gap-2"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-primary)'
          }}
        >
          <Star size={16} style={{ color: 'var(--accent-3)' }} />
          Favorites ({favoriteCount})
        </button>
        {(['mind', 'matter', 'motion', 'mathematics'] as Domain[]).map((domain) => {
          const config = domainConfig[domain];
          const Icon = config.icon;
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                selectedDomain === domain ? 'font-medium' : 'opacity-60'
              }`}
              style={{
                backgroundColor: selectedDomain === domain ? 'var(--surface)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <Icon size={16} style={{ color: config.color }} />
              <span className="capitalize">
                {domain} ({figures.filter(f => f.domain === domain).length})
              </span>
            </button>
          );
        })}
      </div>

      {filteredFigures.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex justify-center mb-4">
            <Palette size={48} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No figures yet
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Create your first figure to get started
          </p>
          <button
            className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: 'var(--bg)'
            }}
          >
            Create Figure
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredFigures.map((figure) => {
            const config = domainConfig[figure.domain];
            const DomainIcon = config.icon;
            return (
              <div
                key={figure.id}
                className="rounded-xl border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >
                <div
                  className="h-48 flex items-center justify-center"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${config.color} 8%, transparent)`
                  }}
                >
                  <DomainIcon size={48} style={{ color: config.color, opacity: 0.6 }} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-xs px-2 py-1 rounded capitalize"
                      style={{
                        backgroundColor: 'var(--bg)',
                        color: config.color
                      }}
                    >
                      {figure.type.replace('_', ' ')}
                    </span>
                    {figure.is_favorite && <Star size={16} style={{ color: 'var(--accent-3)' }} />}
                  </div>
                  <p
                    className="text-sm line-clamp-2 mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {figure.prompt}
                  </p>
                  <div
                    className="text-xs flex items-center gap-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span>{figure.iteration_count} iterations</span>
                    <span>•</span>
                    <span>{new Date(figure.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
