import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CompanyList from './pages/Admin/CompanyList';
import UserList from './pages/Admin/UserList';
import Meetings from './pages/Meetings';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center bg-brand-dark">Loading...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Changed root route to /dashboard and made it a direct element */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Added new /admin route */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          } />

           <Route path="/admin/companies" element={
            <ProtectedRoute>
              <MainLayout>
                <CompanyList />
              </MainLayout>
            </ProtectedRoute>
          } />

           <Route path="/admin/users" element={
            <ProtectedRoute>
              <MainLayout>
                <UserList />
              </MainLayout>
            </ProtectedRoute>
          } />

           <Route path="/admin/meetings" element={
            <ProtectedRoute>
              <MainLayout>
                <Meetings />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Changed /academy to a direct element */}
          <Route path="/academy" element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-white p-4">Academy Module (Coming Soon)</div>
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Changed /profile to a direct element */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-white p-4">Profile Module (Coming Soon)</div>
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Redirect root path to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
