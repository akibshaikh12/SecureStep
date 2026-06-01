import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Navigation2, Share2, Clock, Check } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { locationApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

const Navigation = () => {
  const { coords, error: geoError, loading: geoLoading, getPosition } = useGeolocation();
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const watchRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [{ data: latest }, { data: tracking }] = await Promise.all([
        locationApi.getLatest(),
        locationApi.getTracking(),
      ]);
      setHistory(latest.history || []);
      setTrackingEnabled(tracking.trackingEnabled);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [load]);

  const pushLocation = async (position) => {
    await locationApi.update({
      latitude: position.latitude,
      longitude: position.longitude,
      trackingEnabled,
    });
    await load();
  };

  const refreshLocation = async () => {
    setMessage(null);
    try {
      const position = await getPosition();
      await pushLocation(position);
      setMessage({ type: 'success', text: 'Location updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const toggleTracking = async () => {
    const next = !trackingEnabled;
    try {
      await locationApi.setTracking(next);
      setTrackingEnabled(next);
      if (next) {
        await refreshLocation();
        watchRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            await locationApi.update({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              trackingEnabled: true,
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 30000 }
        );
        setMessage({ type: 'success', text: 'Live tracking enabled' });
      } else {
        if (watchRef.current) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
        setMessage({ type: 'info', text: 'Live tracking disabled' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const latest = coords || history[0];
  const mapsUrl = latest
    ? `https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`
    : null;

  const copyLink = async () => {
    if (!mapsUrl) return;
    await navigator.clipboard.writeText(mapsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageLayout title="Navigation" subtitle="Live location & tracking" showBack={false}>
      <div className="space-y-3">
        {message && (
          <Alert variant={message.type} onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
        {geoError && <Alert variant="warning">{geoError}</Alert>}

        <Card className="flex flex-col items-center py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-overlay">
            <MapPin className="h-6 w-6 text-warning" />
          </div>
          {latest ? (
            <>
              <p className="text-xs font-medium text-text">Current location</p>
              <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}
              </p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-xs font-medium text-brand-400 hover:text-brand-500 transition-colors"
                >
                  Open in Maps ↗
                </a>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-text-tertiary">
              Tap below to capture location.
            </p>
          )}
        </Card>

        <Card>
          <button
            type="button"
            className="flex w-full items-center gap-3 text-left"
            onClick={toggleTracking}
          >
            <Navigation2 className="h-4 w-4 text-brand-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-text">Live tracking</p>
              <p className="text-[11px] text-text-tertiary">
                {trackingEnabled ? 'Sharing periodically' : 'Off — tap to enable'}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                trackingEnabled ? 'bg-success-muted text-success' : 'bg-surface-overlay text-text-tertiary'
              }`}
            >
              {trackingEnabled ? 'On' : 'Off'}
            </span>
          </button>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={copyLink} disabled={!mapsUrl} className="text-left">
            <Card className="!p-3 transition-colors hover:!bg-surface-overlay disabled:opacity-50">
              {copied ? (
                <Check className="mb-1.5 h-4 w-4 text-success" />
              ) : (
                <Share2 className="mb-1.5 h-4 w-4 text-text-secondary" />
              )}
              <p className="text-[11px] font-semibold text-text">Share location</p>
              <p className="mt-0.5 text-[10px] text-text-tertiary">Copy maps link</p>
            </Card>
          </button>
          <Card className="!p-3">
            <Clock className="mb-1.5 h-4 w-4 text-text-secondary" />
            <p className="text-[11px] font-semibold text-text">History</p>
            <p className="mt-0.5 text-[10px] text-text-tertiary">{history.length} point(s)</p>
          </Card>
        </div>

        <Button className="w-full" size="lg" onClick={refreshLocation} disabled={geoLoading}>
          {geoLoading ? 'Getting location…' : 'Update location'}
        </Button>
      </div>
    </PageLayout>
  );
};

export default Navigation;
