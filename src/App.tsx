import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import ContactsPage from '@/pages/ContactsPage';
import ContactDetailPage from '@/pages/ContactDetailPage';
import { currentUser } from '@/lib/auth';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import { JSX } from 'react';

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
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </ToastProvider>
  );
}