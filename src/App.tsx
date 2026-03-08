// Core Application Layout
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Search from './pages/Search';
import Chat from './pages/Chat';
import MyProfile from './pages/MyProfile';
import UserProfile from './pages/UserProfile';
import Calls from './pages/Calls';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import PrivacyStatus from './pages/PrivacyStatus';
import BlockedUsers from './pages/BlockedUsers';
import NotificationsSettings from './pages/NotificationsSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ThemeAppearance from './pages/ThemeAppearance';
import HelpCenter from './pages/HelpCenter';
import About from './pages/About';
import MediaView from './pages/MediaView';
import CameraView from './pages/CameraView';
import CallView from './pages/CallView';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import './App.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <DataProvider>
        <ThemeProvider>
          <ToastProvider>
            <div className="app-wrapper">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
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
                <Route path="/privacy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
                <Route path="/terms" element={<ProtectedRoute><TermsConditions /></ProtectedRoute>} />
                <Route path="/media/:username" element={<ProtectedRoute><MediaView /></ProtectedRoute>} />
                <Route path="/camera" element={<ProtectedRoute><CameraView /></ProtectedRoute>} />
                <Route path="/call/:username" element={<ProtectedRoute><CallView /></ProtectedRoute>} />
              </Routes>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </DataProvider>
    </Router>
  );
}

export default App;
