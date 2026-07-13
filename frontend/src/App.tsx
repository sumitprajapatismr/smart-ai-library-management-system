import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { SocketProvider } from './context/SocketContext';

// Component Layout
import { Layout } from './components/Layout';

// Auth Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Dashboard & General Pages
import { Dashboard } from './pages/Dashboard';
import { SearchBooks } from './pages/SearchBooks';
import { BookDetails } from './pages/BookDetails';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AISuite } from './pages/AISuite';
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';

// Student Pages
import { BorrowHistory } from './pages/BorrowHistory';
import { ResearchHub } from './pages/ResearchHub';
import { EventsManagement } from './pages/EventsManagement';
import { AIResearchAssistant } from './pages/AIResearchAssistant';

// Librarian / Admin Pages
import { BookManagement } from './pages/BookManagement';
import { StudentManagement } from './pages/StudentManagement';
import { Transactions } from './pages/Transactions';
import { ReportsAnalytics } from './pages/ReportsAnalytics';

// Private Route Guard
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Verifying session...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/server-error" element={<ServerError />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Console Views */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="search" element={<SearchBooks />} />
        <Route path="books/:id" element={<BookDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="ai-suite" element={<AISuite />} />
        
        {/* Student Specific */}
        <Route path="history" element={<BorrowHistory />} />
        <Route path="research" element={<ResearchHub />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="ai-research-assistant" element={<AIResearchAssistant />} />
        
        {/* Librarian & Admin Specific */}
        <Route path="books-mgmt" element={<BookManagement />} />
        <Route path="students-mgmt" element={<StudentManagement />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import { useEffect } from 'react';
import { initOfflineSyncListener } from './services/offlineSync';

export default function App() {
  useEffect(() => {
    initOfflineSyncListener((count) => {
      console.log(`[Offline Sync] Automatically synced ${count} transactions to database.`);
    });
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
