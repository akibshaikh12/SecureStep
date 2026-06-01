import { useCallback, useEffect, useState } from 'react';
import { Shield, Trash2, Database } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { privacyApi } from '../services/api';
import Toggle from '../components/ui/Toggle';
import SectionLabel from '../components/ui/SectionLabel';

const Privacy = () => {
  const [privacy, setPrivacy] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [deleteOptions, setDeleteOptions] = useState({
    deleteLocationHistory: false,
    deleteEvidence: false,
    deleteChatHistory: false,
    deleteTripHistory: false,
    deleteIncidents: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        privacyApi.getSettings(),
        privacyApi.getDataSummary(),
      ]);
      setPrivacy(pRes.data.privacy);
      setSummary(sRes.data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePrivacy = async (patch) => {
    try {
      const { data } = await privacyApi.updateSettings(patch);
      setPrivacy(data.privacy);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDelete = (key) => {
    setDeleteOptions((o) => ({ ...o, [key]: !o[key] }));
  };

  const handleDelete = async () => {
    const selected = Object.entries(deleteOptions).filter(([, v]) => v);
    if (selected.length === 0) {
      setError('Select at least one type of data to delete');
      return;
    }
    if (
      !window.confirm(
        'Permanently delete the selected data? This cannot be undone.'
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await privacyApi.deleteData(deleteOptions);
      setMessage({ type: 'success', text: data.message });
      setDeleteOptions({
        deleteLocationHistory: false,
        deleteEvidence: false,
        deleteChatHistory: false,
        deleteTripHistory: false,
        deleteIncidents: false,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteRows = [
    { key: 'deleteLocationHistory', label: 'Location history', count: summary?.locationPoints },
    { key: 'deleteEvidence', label: 'Evidence vault', count: summary?.evidenceItems },
    { key: 'deleteChatHistory', label: 'Chat history', count: summary?.chatMessages },
    { key: 'deleteTripHistory', label: 'Trip history', count: summary?.trips },
    { key: 'deleteIncidents', label: 'SOS incidents', count: summary?.incidents },
  ];

  return (
    <PageLayout
      title="Data & privacy"
      subtitle="User-controlled privacy settings"
      backTo="/settings"
    >
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}
        {message && (
          <Alert variant={message.type} onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loading || !privacy ? (
          <p className="text-center text-sm text-text-tertiary">Loading privacy settings…</p>
        ) : (
          <>
            <Card className="flex gap-3 !py-3">
              <Database className="h-5 w-5 shrink-0 text-text-tertiary" />
              <div className="text-sm text-text-secondary">
                <p>
                  <span className="font-semibold text-text">{summary?.contacts ?? 0}</span>{' '}
                  contacts ·{' '}
                  <span className="font-semibold text-text">
                    {summary?.trustedGroups ?? 0}
                  </span>{' '}
                  circles ·{' '}
                  <span className="font-semibold text-text">
                    {summary?.evidenceItems ?? 0}
                  </span>{' '}
                  vault items
                </p>
              </div>
            </Card>

            <div>
              <SectionLabel>Privacy preferences</SectionLabel>
              <Card className="!p-2">
                <div className="flex items-center justify-between gap-3 px-1 py-2">
                  <span className="text-sm text-text">Share location with circles</span>
                  <Toggle
                    label="Share location"
                    checked={privacy.shareLocationWithGroups}
                    onChange={(v) => updatePrivacy({ shareLocationWithGroups: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-1 py-2">
                  <span className="text-sm text-text">Notify when trip starts</span>
                  <Toggle
                    label="Trip start notify"
                    checked={privacy.notifyOnTripStart}
                    onChange={(v) => updatePrivacy({ notifyOnTripStart: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-1 py-2">
                  <span className="text-sm text-text">Notify on safe arrival</span>
                  <Toggle
                    label="Safe arrival notify"
                    checked={privacy.notifyOnSafeArrival}
                    onChange={(v) => updatePrivacy({ notifyOnSafeArrival: v })}
                  />
                </div>
              </Card>
            </div>

            <div>
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                <Shield className="h-3.5 w-3.5" />
                Data deletion controls
              </h2>
              <Card className="space-y-1 !p-2">
                <p className="px-1 pb-2 text-xs text-text-tertiary">
                  Choose what to permanently remove from your account.
                </p>
                {deleteRows.map(({ key, label, count }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface-overlay/60"
                  >
                    <span className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={deleteOptions[key]}
                        onChange={() => toggleDelete(key)}
                        className="rounded border-border text-brand-600"
                      />
                      {label}
                    </span>
                    <span className="text-xs text-text-tertiary">{count ?? 0} items</span>
                  </label>
                ))}
              </Card>
              <Button
                variant="secondary"
                className="mt-3 w-full border-red-200 text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
                {busy ? 'Deleting…' : 'Delete selected data'}
              </Button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Privacy;
