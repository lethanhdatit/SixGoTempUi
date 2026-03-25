import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppHeader from './components/AppHeader';
import LoginPage from './pages/LoginPage';
import ChatHistory from './pages/ChatHistory';
import UpdateBanner from './components/UpdateBanner';

const AppLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f2f5' }}>
    <AppHeader />
    <div className="flex-1">{children}</div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UpdateBanner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ChatHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);