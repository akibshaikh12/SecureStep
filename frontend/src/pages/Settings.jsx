import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Moon,
  LogOut,
  MessageCircle,
  Camera,
  UsersRound,
  Shield,
  Route,
  MapPin,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import SettingsRow from '../components/layout/SettingsRow';
import SectionLabel from '../components/ui/SectionLabel';
import { Card } from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const [message, setMessage] = useState(null);

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <PageLayout title="Settings" subtitle="Account and app preferences" showBack={false}>
      <div className="animate-slide-up space-y-6">
        {message && (
          <Alert variant={message.type} onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Card className="!p-1.5">
          <SettingsRow to="/profile" icon={User} title="Profile" description="Name, email, phone" />
        </Card>

        <div>
          <SectionLabel>Features</SectionLabel>
          <Card className="!p-1.5">
            <SettingsRow
              to="/journey"
              icon={Route}
              title="Journey tracking"
              description="Trips and safe arrival alerts"
            />
            <SettingsRow
              to="/trusted-groups"
              icon={UsersRound}
              title="Trusted Network"
              description="Family and friend safety circles"
            />
            <SettingsRow
              to="/navigation"
              icon={MapPin}
              title="Navigation & tracking"
              description="Live location and maps"
            />
            <SettingsRow
              to="/chatbot"
              icon={MessageCircle}
              title="Emergency assistant"
              description="Guided help and chat"
            />
            <SettingsRow
              to="/evidence"
              icon={Camera}
              title="Evidence Vault"
              description="Encrypted recordings and images"
            />
            <SettingsRow
              to="/privacy"
              icon={Shield}
              title="Data & privacy"
              description="Deletion controls and preferences"
            />
          </Card>
        </div>

        <div>
          <SectionLabel>Preferences</SectionLabel>
          <Card className="!p-1.5">
            <SettingsRow
              icon={Bell}
              title="Notifications"
              description="SOS push, sounds, and alerts"
              trailing={
                <Toggle
                  label="Notifications"
                  checked={preferences.notifications}
                  onChange={(v) => updatePreferences({ notifications: v, sosSound: v })}
                />
              }
            />
            <SettingsRow
              icon={Moon}
              title="Appearance"
              description={preferences.theme === 'dark' ? 'Dark mode on' : 'Light mode on'}
              trailing={
                <Toggle
                  label="Dark mode"
                  checked={preferences.theme === 'dark'}
                  onChange={(v) => {
                    updatePreferences({ theme: v ? 'dark' : 'light' }).catch(() => {});
                  }}
                />
              }
            />
          </Card>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised py-3.5 text-sm font-medium text-text-secondary transition-all hover:border-border-light hover:bg-surface-overlay hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </PageLayout>
  );
};

export default Settings;
