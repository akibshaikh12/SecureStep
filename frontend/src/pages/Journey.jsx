import { useCallback, useEffect, useState } from 'react';
import { Route, MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { journeysApi, trustedGroupsApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Journey = () => {
  const { getPosition } = useGeolocation();
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [groups, setGroups] = useState([]);
  const [destination, setDestination] = useState('');
  const [trustedGroupId, setTrustedGroupId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, listRes, groupsRes] = await Promise.all([
        journeysApi.getActive(),
        journeysApi.list(),
        trustedGroupsApi.list(),
      ]);
      setActive(activeRes.data.journey);
      setHistory(listRes.data.journeys.filter((j) => j.status !== 'active'));
      setGroups(groupsRes.data.groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startTrip = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage(null);
    try {
      try {
        await getPosition();
      } catch {
        /* trip can start without GPS */
      }
      const { data } = await journeysApi.start({
        destination,
        trustedGroupId: trustedGroupId || undefined,
        note,
      });
      setMessage({ type: 'success', text: data.message });
      setDestination('');
      setNote('');
      setTrustedGroupId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const completeTrip = async () => {
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await journeysApi.complete(active.id);
      setMessage({ type: 'success', text: data.message });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelTrip = async () => {
    if (!active || !window.confirm('Cancel this trip?')) return;
    setBusy(true);
    try {
      await journeysApi.cancel(active.id);
      setMessage({ type: 'info', text: 'Trip cancelled' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageLayout
      title="Journey tracking"
      subtitle="Safe arrival notifications"
      showBack={false}
    >
      <div className="space-y-3">
        {error && <Alert variant="error">{error}</Alert>}
        {message && (
          <Alert variant={message.type} onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <p className="text-center text-xs text-text-tertiary">Loading…</p>
        ) : active ? (
          <Card className="!border-success/20 !bg-success-muted">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
                <Route className="h-4 w-4 text-success" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-success">Trip in progress</p>
                <p className="mt-0.5 text-sm text-text">{active.destination}</p>
                {active.trustedGroupName && (
                  <p className="text-[11px] text-text-tertiary">Circle: {active.trustedGroupName}</p>
                )}
                <p className="mt-0.5 text-[11px] text-text-tertiary">Started {formatTime(active.startedAt)}</p>
                <p className="mt-1 text-[11px] text-success/80">
                  {active.notifiedContacts?.length || 0} contact(s) notified on arrival
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" size="md" onClick={completeTrip} disabled={busy}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Arrived safely
              </Button>
              <Button variant="secondary" className="flex-1" size="md" onClick={cancelTrip} disabled={busy}>
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={startTrip} className="space-y-3">
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-400" />
                <p className="text-xs font-semibold text-text">Start a new trip</p>
              </div>
              <div className="space-y-2.5">
                <Input
                  label="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Home, Office, Airport"
                  required
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Notify circle (optional)
                  </label>
                  <select
                    value={trustedGroupId}
                    onChange={(e) => setTrustedGroupId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-sm text-text focus:border-brand-500/50 focus:outline-none"
                  >
                    <option value="">All emergency contacts</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Flight lands at 6pm"
                />
              </div>
            </Card>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Starting…' : 'Start trip'}
            </Button>
          </form>
        )}

        {history.length > 0 && (
          <div>
            <h2 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
              Recent trips
            </h2>
            <ul className="space-y-1.5">
              {history.slice(0, 5).map((trip) => (
                <li key={trip.id}>
                  <Card className="flex items-center gap-3 !p-3">
                    <Clock className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">
                        {trip.destination}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        {trip.status === 'completed' ? 'Arrived safely' : 'Cancelled'} ·{' '}
                        {formatTime(trip.completedAt || trip.startedAt)}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Journey;
