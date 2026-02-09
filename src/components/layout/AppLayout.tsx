import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { AIChatPanel } from '../chat/AIChatPanel';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProjectsPage } from '../../pages/ProjectsPage';
import { FiguresPage } from '../../pages/FiguresPage';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../../pages/admin/UserManagementPage';
import { useDiagram } from '../../providers/DiagramProvider';

type Page = 'canvas' | 'dashboard' | 'projects' | 'figures' | 'admin' | 'admin-users';

interface AppLayoutProps {
  adminPage?: 'admin' | 'admin-users';
}

export function AppLayout({ adminPage }: AppLayoutProps = {}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(adminPage || 'canvas');
  const navigate = useNavigate();
  const { state: diagramState } = useDiagram();

  useEffect(() => {
    if (adminPage) {
      setCurrentPage(adminPage);
    }
  }, [adminPage]);

  const handleNavigate = (page: string) => {
    if (page === 'admin') {
      navigate('/admin');
    } else if (page === 'admin-users') {
      navigate('/admin/users');
    } else {
      setCurrentPage(page as Page);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'figures':
        return <FiguresPage />;
      case 'admin':
        return <AdminDashboardPage />;
      case 'admin-users':
        return <UserManagementPage />;
      default:
        return (
          <DiagramCanvas
            imageData={diagramState.imageData || undefined}
            isGenerating={diagramState.isGenerating}
            iteration={diagramState.iteration}
            stage={diagramState.currentStage}
            message={diagramState.message}
          />
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex relative">
        <Sidebar
          isOpen={isSidebarOpen}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
        <main
          className="flex-1 p-8 transition-all duration-300"
          style={{
            color: 'var(--text-primary)',
            marginRight: isAIPanelOpen ? '440px' : '0'
          }}
        >
          {renderPage()}
        </main>
        <AIChatPanel
          isOpen={isAIPanelOpen}
          onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
        />
      </div>
    </div>
  );
}
