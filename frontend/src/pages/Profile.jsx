import { useEffect, useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const initials = form.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await userApi.updateProfile({ name: form.name, phone: form.phone });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Profile" subtitle="Your account details" backTo="/settings">
      <div className="space-y-5">
        {message && <Alert variant={message.type}>{message.text}</Alert>}

        <Card className="flex flex-col items-center py-8">
          <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-600/20 to-surface-overlay text-2xl font-bold text-brand-400">
            {initials || 'SS'}
          </span>
          <p className="text-sm font-semibold text-text">{form.name || 'User'}</p>
          <p className="text-xs text-text-tertiary">
            Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
          </p>
        </Card>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input label="Email" type="email" value={form.email} disabled className="opacity-70" />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 (555) 000-0000"
          />
          <Button className="w-full" size="lg" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>
    </PageLayout>
  );
};

export default Profile;
