import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import ContactsPage from '@/pages/ContactsPage';
import ContactDetailPage from '@/pages/ContactDetailPage';
import { currentUser } from '@/lib/auth';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import { JSX } from 'react';
import AdminPage from '@/pages/admin/AdminPage';
import RequireRole from '@/auth/RequireRole';
import { UserRole } from '@/auth/user-role';

function RequireAuth({ children }: { children: JSX.Element }) {
  const me = currentUser();
  if (!me) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route index element={<Navigate to="contacts" replace />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="contacts/:id" element={<ContactDetailPage />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireRole allow={['manager', 'superadmin'] as UserRole[]} useAuthHook={() => ({ user: currentUser() })}>
                        <AdminPage />
                      </RequireRole>
                    }
                  />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </ToastProvider>
  );
}