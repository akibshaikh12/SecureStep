import { useCallback, useEffect, useState } from 'react';
import { UsersRound, Plus, Trash2, Home, Heart } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { trustedGroupsApi, contactsApi } from '../services/api';

const typeIcons = { family: Home, friends: Heart, custom: UsersRound };

const TrustedGroups = () => {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'family',
    description: '',
    contactIds: [],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([trustedGroupsApi.list(), contactsApi.list()]);
      setGroups(gRes.data.groups);
      setContacts(cRes.data.contacts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleContact = (contactId) => {
    setForm((f) => ({
      ...f,
      contactIds: f.contactIds.includes(contactId)
        ? f.contactIds.filter((id) => id !== contactId)
        : [...f.contactIds, contactId],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await trustedGroupsApi.create(form);
      setModalOpen(false);
      setForm({ name: '', type: 'family', description: '', contactIds: [] });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this safety circle?')) return;
    try {
      await trustedGroupsApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageLayout
      title="Trusted Network"
      subtitle="Family and friend safety circles"
      backTo="/settings"
    >
      <div className="space-y-4">
        <Card className="!border-brand-500/15 !bg-gradient-to-br from-brand-600/8 to-surface-raised !py-3">
          <p className="text-sm leading-relaxed text-text-secondary">
            Circles group your emergency contacts. Use them for journey alerts and faster SOS
            notifications.
          </p>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}

        <Button variant="secondary" className="w-full" size="lg" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create safety circle
        </Button>

        {loading ? (
          <p className="text-center text-sm text-text-tertiary">Loading circles…</p>
        ) : groups.length === 0 ? (
          <Card className="text-center text-sm text-text-tertiary">
            No circles yet. Create one to organize family or friends.
          </Card>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const Icon = typeIcons[group.type] || UsersRound;
              return (
                <li key={group.id}>
                  <Card className="!py-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-overlay">
                        <Icon className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text">{group.name}</p>
                        <p className="text-xs capitalize text-text-tertiary">{group.type}</p>
                        {group.description && (
                          <p className="mt-1 text-xs text-text-tertiary">{group.description}</p>
                        )}
                        <p className="mt-2 text-xs font-medium text-brand-400">
                          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                        </p>
                        {group.members?.length > 0 && (
                          <p className="mt-1 truncate text-xs text-text-tertiary">
                            {group.members.map((m) => m.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(group.id)}
                        className="text-text-tertiary transition-colors hover:text-danger"
                        aria-label="Delete group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalOpen && (
        <Modal title="New safety circle" onClose={() => setModalOpen(false)}>
          <form className="space-y-4" onSubmit={handleCreate}>
            <Input
              label="Circle name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Family circle"
              required
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-xl border border-border bg-surface-overlay px-4 py-2.5 text-sm text-text focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">Members</p>
              {contacts.length === 0 ? (
                <p className="text-xs text-text-tertiary">Add emergency contacts first.</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-overlay/60">
                        <input
                          type="checkbox"
                          checked={form.contactIds.includes(c.id)}
                          onChange={() => toggleContact(c.id)}
                          className="rounded border-border text-brand-500 accent-brand-600"
                        />
                        <span className="text-sm text-text">{c.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Creating…' : 'Create circle'}
            </Button>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
};

export default TrustedGroups;
