// Core Application Layout - Build v1.0.1
import { Suspense, lazy } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import Home from './pages/Home';
import LoadingOverlay from './components/LoadingOverlay';

// Lazy loaded pages to radically speed up initial load
const SafetyGuide = lazy(() => import('./pages/SafetyGuide'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Search = lazy(() => import('./pages/Search'));
const Chat = lazy(() => import('./pages/Chat'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Calls = lazy(() => import('./pages/Calls'));
const Settings = lazy(() => import('./pages/Settings'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const PrivacyStatus = lazy(() => import('./pages/PrivacyStatus'));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'));
const NotificationsSettings = lazy(() => import('./pages/NotificationsSettings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const ThemeAppearance = lazy(() => import('./pages/ThemeAppearance'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const About = lazy(() => import('./pages/About'));
const Support = lazy(() => import('./pages/Support'));
const MediaView = lazy(() => import('./pages/MediaView'));
const CameraView = lazy(() => import('./pages/CameraView'));
const CallView = lazy(() => import('./pages/CallView'));
import ProtectedRoute from './components/ProtectedRoute';
import PermissionManager from './components/PermissionManager';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <DataProvider>
        <ThemeProvider>
          <ToastProvider>
            <PermissionManager />
            <Suspense fallback={<LoadingOverlay transparent={false} />}>
              <Routes>
                {/* Full-width Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/safeguide" element={<SafetyGuide />} />
                <Route path="/login" element={<Login />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/register" element={<Navigate to="/create-account" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/support" element={<Support />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                {/* Wrapped Chat App Pages */}
                <Route path="*" element={
                  <div className="app-wrapper">
                    <Routes>
                      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                      <Route path="/chat/:username" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                      <Route path="/profile/me" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
                      <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                      <Route path="/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                      <Route path="/privacy-status" element={<ProtectedRoute><PrivacyStatus /></ProtectedRoute>} />
                      <Route path="/blocked-users" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
                      <Route path="/notifications-settings" element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
                      <Route path="/theme-appearance" element={<ProtectedRoute><ThemeAppearance /></ProtectedRoute>} />
                      <Route path="/help-center" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
                      <Route path="/media/:username" element={<ProtectedRoute><MediaView /></ProtectedRoute>} />
                      <Route path="/camera" element={<ProtectedRoute><CameraView /></ProtectedRoute>} />
                      <Route path="/call/:username" element={<ProtectedRoute><CallView /></ProtectedRoute>} />
                    </Routes>
                  </div>
                } />
              </Routes>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </DataProvider>
    </Router>
  );
}

export default App;
