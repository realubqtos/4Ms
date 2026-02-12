import { useState, useEffect } from 'react';
import { supabase } from '../providers/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Folder } from '../components/ui/icons';
import { visualizationConfig, visualizationTypes, type VisualizationType } from '../config/visualizations';
import type { Database } from '../types/database';

type Project = Database['public']['Tables']['projects']['Row'];

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<VisualizationType | 'all'>('all');

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
    processes: projects.filter(p => p.primary_domain === 'processes'),
    structural: projects.filter(p => p.primary_domain === 'structural'),
    statistical: projects.filter(p => p.primary_domain === 'statistical'),
    educational: projects.filter(p => p.primary_domain === 'educational'),
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
        {visualizationTypes.map((vizType) => {
          const config = visualizationConfig[vizType];
          const Icon = config.icon;
          return (
            <button
              key={vizType}
              onClick={() => setSelectedDomain(vizType)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                selectedDomain === vizType ? 'font-medium' : 'opacity-60'
              }`}
              style={{
                backgroundColor: selectedDomain === vizType ? 'var(--surface)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <Icon size={16} style={{ color: config.color }} />
              <span className="capitalize">{vizType} ({(projectsByDomain as Record<VisualizationType, Project[]>)[vizType].length})</span>
            </button>
          );
        })}
      </div>

      {filteredProjects.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex justify-center mb-4">
            <Folder size={48} style={{ color: 'var(--text-tertiary)' }} />
          </div>
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
          {filteredProjects.map((project) => {
            const config = visualizationConfig[project.primary_domain as VisualizationType] || visualizationConfig.processes;
            const DomainIcon = config.icon;
            return (
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
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`
                    }}
                  >
                    <DomainIcon size={24} style={{ color: config.color }} />
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--bg)',
                      color: config.color
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
            );
          })}
        </div>
      )}
    </div>
  );
}
