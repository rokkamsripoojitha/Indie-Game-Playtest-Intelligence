import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Public Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Consolidated Application Workspaces
import { DashboardPage } from './pages/DashboardPage';
import { FeedbackWorkspacePage } from './pages/FeedbackWorkspacePage';
import { IssuesWorkspacePage } from './pages/IssuesWorkspacePage';
import { AIWorkspacePage } from './pages/AIWorkspacePage';
import { StudioHubPage } from './pages/StudioHubPage';
import { AccountProfilePage } from './pages/AccountProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Route Guard
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-xs text-slate-400 font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 5 Core Protected Workspaces */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute>
              <IssuesWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-workspace"
          element={
            <ProtectedRoute>
              <AIWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <StudioHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Seamless Legacy Redirects */}
        <Route path="/duplicates" element={<Navigate to="/feedback" replace />} />
        <Route path="/agent" element={<Navigate to="/ai-workspace" replace />} />
        <Route path="/chat" element={<Navigate to="/ai-workspace" replace />} />
        <Route path="/documents" element={<Navigate to="/ai-workspace" replace />} />
        <Route path="/sessions" element={<Navigate to="/studio" replace />} />
        <Route path="/builds" element={<Navigate to="/studio" replace />} />
        <Route path="/memberships" element={<Navigate to="/studio" replace />} />
        <Route path="/studio-overview" element={<Navigate to="/studio" replace />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
