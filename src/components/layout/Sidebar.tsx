import { useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { LayoutDashboard, Folder, Image, Settings, Users, Newspaper, Info, X } from '../ui/icons';
import { SidebarFooter } from './SidebarFooter';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, currentPage, onNavigate, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: Folder },
    { id: 'figures', label: 'Gallery', icon: Image },
    { id: 'blog', label: 'Blog', icon: Newspaper },
    { id: 'about', label: 'About', icon: Info },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Dashboard', icon: Settings },
    { id: 'admin-users', label: 'User Management', icon: Users },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    if (isMobile) onClose();
  };

  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ top: '65px' }}
          onClick={onClose}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-full flex flex-col glass transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ top: '65px', borderRight: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-md transition-all"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
          <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
            <SidebarNavSection
              title="Navigation"
              items={navItems}
              currentPage={currentPage}
              onNavigate={handleNavClick}
            />
            {isAdmin && (
              <SidebarNavSection
                title="Administration"
                items={adminItems}
                currentPage={currentPage}
                onNavigate={handleNavClick}
                accentVar="var(--accent-3)"
              />
            )}
          </nav>
          <SidebarFooter />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`fixed left-0 w-56 border-r min-h-[calc(100vh-65px)] flex flex-col glass transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-56'
      }`}
      style={{ top: '65px', borderColor: 'var(--border)' }}
    >
      <nav className="p-4 space-y-6 flex-1">
        <SidebarNavSection
          title="Navigation"
          items={navItems}
          currentPage={currentPage}
          onNavigate={handleNavClick}
        />
        {isAdmin && (
          <SidebarNavSection
            title="Administration"
            items={adminItems}
            currentPage={currentPage}
            onNavigate={handleNavClick}
            accentVar="var(--accent-3)"
          />
        )}
      </nav>
      <SidebarFooter />
    </aside>
  );
}

interface SidebarNavSectionProps {
  title: string;
  items: { id: string; label: string; icon: React.ComponentType<any> }[];
  currentPage: string;
  onNavigate: (page: string) => void;
  accentVar?: string;
}

function SidebarNavSection({ title, items, currentPage, onNavigate, accentVar = 'var(--accent-1)' }: SidebarNavSectionProps) {
  return (
    <div>
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-2 px-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-opacity-80 transition-all text-sm flex items-center gap-2 ${
                  isActive ? 'font-medium glass-shadow' : ''
                }`}
                style={{
                  backgroundColor: isActive ? accentVar : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-primary)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
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
  );
}
