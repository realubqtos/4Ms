import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Header } from './Header';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { AIChatPanel } from '../chat/AIChatPanel';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProjectsPage } from '../../pages/ProjectsPage';
import { FiguresPage } from '../../pages/FiguresPage';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../../pages/admin/UserManagementPage';
import { useDiagram } from '../../providers/DiagramProvider';
import { useIsMobile } from '../../hooks/useMediaQuery';

type Page = 'canvas' | 'dashboard' | 'projects' | 'figures' | 'admin' | 'admin-users';

interface AppLayoutProps {
  adminPage?: 'admin' | 'admin-users';
}

export function AppLayout({ adminPage }: AppLayoutProps = {}) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(!isMobile);
  const [currentPage, setCurrentPage] = useState<Page>(adminPage || 'canvas');
  const navigate = useNavigate();
  const { state: diagramState } = useDiagram();

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsAIPanelOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (adminPage) {
      setCurrentPage(adminPage);
    }
  }, [adminPage]);

  const handleMenuClick = () => {
    if (isMobile && !isSidebarOpen && isAIPanelOpen) {
      setIsAIPanelOpen(false);
    }
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAIPanelToggle = () => {
    if (isMobile && !isAIPanelOpen && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    setIsAIPanelOpen(!isAIPanelOpen);
  };

  const handleNavigate = (page: string) => {
    // Toggle behavior: clicking active item returns to canvas
    if (currentPage === page && page !== 'canvas') {
      // For admin pages, navigate back to main route
      if (page === 'admin' || page === 'admin-users') {
        navigate('/');
      } else {
        setCurrentPage('canvas');
      }
      if (isMobile) setIsSidebarOpen(false);
      return;
    }

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

  const mainPaddingBottom = isAIPanelOpen ? (isMobile ? '256px' : '316px') : '0';

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <StatusBar />
      <Header
        onMenuClick={handleMenuClick}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex relative">
        <Sidebar
          isOpen={isSidebarOpen}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main
          className="flex-1 p-4 md:p-8 transition-all duration-300"
          style={{
            color: 'var(--text-primary)',
            paddingBottom: mainPaddingBottom
          }}
        >
          {renderPage()}
        </main>
        <AIChatPanel
          isOpen={isAIPanelOpen}
          onToggle={handleAIPanelToggle}
        />
      </div>
    </div>
  );
}
