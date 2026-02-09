import { useAuth } from '../../providers/AuthProvider';
import { LayoutDashboard, Folder, Image, Settings, Users } from '../ui/icons';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ isOpen, currentPage, onNavigate }: SidebarProps) {
  const { isAdmin } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: Folder },
    { id: 'figures', label: 'Gallery', icon: Image },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Dashboard', icon: Settings },
    { id: 'admin-users', label: 'User Management', icon: Users },
  ];

  return (
    <aside
      className="w-56 border-r min-h-[calc(100vh-57px)] transition-all duration-300 glass flex flex-col"
      style={{
        borderColor: 'var(--border)'
      }}
    >
      <nav className="p-4 space-y-6 flex-1">
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Navigation
          </h2>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-opacity-80 transition-all text-sm flex items-center gap-2 ${
                      currentPage === item.id ? 'font-medium glass-shadow' : ''
                    }`}
                    style={{
                      backgroundColor: currentPage === item.id ? 'var(--accent-1)' : 'transparent',
                      color: currentPage === item.id ? '#FFFFFF' : 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== item.id) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== item.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {isAdmin && (
          <div>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-2 px-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Administration
            </h2>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-opacity-80 transition-all text-sm flex items-center gap-2 ${
                        currentPage === item.id ? 'font-medium glass-shadow' : ''
                      }`}
                      style={{
                        backgroundColor: currentPage === item.id ? 'var(--accent-3)' : 'transparent',
                        color: currentPage === item.id ? '#FFFFFF' : 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== item.id) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== item.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
      <SidebarFooter />
    </aside>
  );
}
