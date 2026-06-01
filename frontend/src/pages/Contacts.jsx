import { useCallback, useEffect, useState } from 'react';
import { Plus, Phone, User, Trash2, Bell, Star } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { contactsApi } from '../services/api';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    relation: 'Contact',
    pushPriority: false,
  });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await contactsApi.list();
      setContacts(data.contacts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contactsApi.create(form);
      setModalOpen(false);
      setForm({ name: '', phone: '', email: '', relation: 'Contact', pushPriority: false });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    try {
      await contactsApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePriority = async (contact, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (togglingId) return;

    const next = !contact.pushPriority;
    setError('');
    setTogglingId(contact.id);
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, pushPriority: next } : c))
    );

    try {
      const { data } = await contactsApi.setPushPriority(contact.id, next);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? data.contact : c))
      );
    } catch (err) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, pushPriority: !next } : c))
      );
      setError(err.message || 'Could not update priority. Restart the backend and try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const priorityCount = contacts.filter((c) => c.pushPriority).length;

  return (
    <PageLayout
      title="Emergency contacts"
      subtitle="Priority contacts get SOS push + photo first"
      showBack={false}
    >
      <div className="space-y-3">
        {error && <Alert variant="error">{error}</Alert>}

        <Card className="!py-3 text-xs leading-relaxed text-text-secondary">
          Mark contacts as <strong className="text-text">Priority push</strong> (star). When any
          priority contact is linked to SecureStep, only they receive SOS push and automatic
          photos. If none are priority, all linked contacts are notified.
        </Card>

        <Button variant="secondary" className="w-full" size="md" onClick={() => setModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add contact
        </Button>

        {loading ? (
          <p className="text-center text-xs text-text-tertiary">Loading contacts…</p>
        ) : contacts.length === 0 ? (
          <Card className="text-center text-xs text-text-tertiary">No contacts yet. Add someone you trust.</Card>
        ) : (
          <ul className="space-y-1.5">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Card className="flex items-center gap-2 !p-3">
                  <button
                    type="button"
                    onClick={(e) => togglePriority(contact, e)}
                    disabled={togglingId === contact.id}
                    className={`relative z-10 flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg border transition-colors active:scale-95 ${
                      contact.pushPriority
                        ? 'border-brand-500/50 bg-brand-500/20 text-brand-400'
                        : 'border-border bg-surface-overlay text-text-tertiary hover:border-brand-500/30 hover:text-brand-400'
                    } ${togglingId === contact.id ? 'opacity-60' : ''}`}
                    aria-label={
                      contact.pushPriority ? 'Remove push priority' : 'Set as priority push contact'
                    }
                    title="Priority SOS push"
                  >
                    <Star
                      className={`h-4 w-4 ${contact.pushPriority ? 'fill-current' : ''}`}
                      strokeWidth={1.75}
                    />
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-overlay">
                    <User className="h-4 w-4 text-text-secondary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text">{contact.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {contact.relation} · {contact.phone}
                    </p>
                    {contact.linkedUserId ? (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
                        <Bell className="h-3 w-3" />
                        {contact.pushPriority ? 'Priority push' : 'Push eligible'}
                      </span>
                    ) : (
                      <span className="mt-1 text-[10px] text-text-tertiary">
                        Add email for push
                      </span>
                    )}
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, '')}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-muted text-success transition-colors hover:bg-success/20"
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-danger-muted hover:text-danger"
                    aria-label={`Delete ${contact.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {priorityCount > 0 && (
          <p className="text-center text-[10px] text-brand-400">
            {priorityCount} priority push contact{priorityCount !== 1 ? 's' : ''} active
          </p>
        )}
      </div>

      {modalOpen && (
        <Modal title="Add emergency contact" onClose={() => setModalOpen(false)}>
          <form className="space-y-3" onSubmit={handleAdd}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <Input
              label="SecureStep email (for push)"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="contact@example.com"
            />
            <Input
              label="Relation"
              value={form.relation}
              onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
              placeholder="Primary, Family, etc."
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface-overlay px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.pushPriority}
                onChange={(e) => setForm((f) => ({ ...f, pushPriority: e.target.checked }))}
                className="rounded border-border accent-brand-600"
              />
              <span className="text-sm text-text">
                <Star className="mr-1 inline h-3.5 w-3.5 text-brand-400" />
                Priority SOS push (photo + alert)
              </span>
            </label>
            <Button className="w-full" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save contact'}
            </Button>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Contacts;
