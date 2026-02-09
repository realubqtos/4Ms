import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type Domain = Database['public']['Enums']['domain'];

const domainColors = {
  mind: 'var(--accent-1)',
  matter: 'var(--accent-2)',
  motion: 'var(--accent-3)',
  mathematics: 'var(--accent-1)',
};

const domainIcons = {
  mind: '🧠',
  matter: '⚗️',
  motion: '⚡',
  mathematics: '📐',
};

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = selectedDomain === 'all'
    ? projects
    : projects.filter(p => p.primary_domain === selectedDomain);

  const projectsByDomain = {
    mind: projects.filter(p => p.primary_domain === 'mind'),
    matter: projects.filter(p => p.primary_domain === 'matter'),
    motion: projects.filter(p => p.primary_domain === 'motion'),
    mathematics: projects.filter(p => p.primary_domain === 'mathematics'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Projects
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Organize your scientific visualizations by domain
          </p>
        </div>
        <button
          className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--accent-1)',
            color: 'var(--bg)'
          }}
        >
          + New Project
        </button>
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
          All ({projects.length})
        </button>
        {(['mind', 'matter', 'motion', 'mathematics'] as Domain[]).map((domain) => (
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
            <span>{domainIcons[domain]}</span>
            <span className="capitalize">{domain} ({projectsByDomain[domain].length})</span>
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No projects yet
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Create your first project to start organizing your figures
          </p>
          <button
            className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--accent-1)',
              color: 'var(--bg)'
            }}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-xl border hover:shadow-lg transition-shadow cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="text-3xl w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${domainColors[project.primary_domain]}20`
                  }}
                >
                  {domainIcons[project.primary_domain]}
                </div>
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--bg)',
                    color: domainColors[project.primary_domain]
                  }}
                >
                  {project.primary_domain}
                </span>
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {project.name}
              </h3>
              <p
                className="text-sm mb-4 line-clamp-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {project.description || 'No description'}
              </p>
              <div
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
