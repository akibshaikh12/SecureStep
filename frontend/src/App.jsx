import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile';
import Contacts from './pages/Contacts';
import Navigation from './pages/Navigation';
import Evidence from './pages/Evidence';
import Settings from './pages/Settings';
import ChatbotPage from './pages/ChatbotPage';
import TrustedGroups from './pages/TrustedGroups';
import Journey from './pages/Journey';
import Privacy from './pages/Privacy';
import IncomingAlert from './pages/IncomingAlert';

function App() {
  return (
    <div className="app-container">
      <div className="flex min-h-0 flex-1 flex-col">
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/navigation" element={<Navigation />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/trusted-groups" element={<TrustedGroups />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/alerts/:id" element={<IncomingAlert />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
