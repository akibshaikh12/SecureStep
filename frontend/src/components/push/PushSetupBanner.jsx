import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Alert from '../ui/Alert';
import { pushApi } from '../../services/api';
import {
  disablePushNotifications,
  enablePushNotifications,
  isFirebaseConfigured,
  syncPushTokenIfGranted,
} from '../../services/pushNotifications';

export default function PushSetupBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('securestep_push_banner_dismissed') === '1'
  );
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(Notification.permission === 'granted');

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await pushApi.getStatus();
      setStatus(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadStatus();
    if (Notification.permission === 'granted' && isFirebaseConfigured()) {
      syncPushTokenIfGranted().then(() => loadStatus());
    }
  }, [loadStatus]);

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      await enablePushNotifications();
      setEnabled(true);
      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await disablePushNotifications();
      setEnabled(false);
      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem('securestep_push_banner_dismissed', '1');
    setDismissed(true);
  };

  if (dismissed || !isFirebaseConfigured()) return null;

  return (
    <div className="px-4 pt-3">
      <Card className="relative !border-brand-500/20 !bg-gradient-to-br from-brand-600/10 to-surface-raised !py-3">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 text-text-tertiary transition-colors hover:text-text"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-3 pr-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-600/15">
            <Bell className="h-5 w-5 text-brand-400" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">SOS push alerts</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {enabled
                ? `Enabled on this device${status?.tokenCount ? ` · ${status.tokenCount} token(s)` : ''}`
                : 'Get notified when someone in your circle triggers SOS'}
            </p>
            {error && (
              <div className="mt-2">
                <Alert variant="error">{error}</Alert>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {enabled ? (
                <Button variant="secondary" size="sm" onClick={handleDisable} disabled={loading}>
                  <BellOff className="h-3.5 w-3.5" />
                  Turn off
                </Button>
              ) : (
                <Button size="sm" onClick={handleEnable} disabled={loading}>
                  {loading ? 'Enabling…' : 'Enable notifications'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
