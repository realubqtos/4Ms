import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { DiagramProvider } from './providers/DiagramProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PasswordResetPage } from './pages/PasswordResetPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DiagramProvider>
            <Routes>
              <Route path="/reset-password" element={<PasswordResetPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AppLayout adminPage="admin" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AppLayout adminPage="admin-users" />
                  </AdminRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DiagramProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
