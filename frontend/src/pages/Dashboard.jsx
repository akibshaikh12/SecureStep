import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Shield,
  MapPin,
  Users,
  Camera,
  MessageCircle,
  AlertTriangle,
  Mic,
  Route,
  UsersRound,
  Bell,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import QuickLink from '../components/layout/QuickLink';
import Alert from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { contactsApi, incidentsApi } from '../services/api';
import { captureSosPhoto } from '../services/sosPhotoCapture';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePreferences } from '../context/PreferencesContext';
import { useSosRecording } from '../context/SosRecordingContext';

const HOLD_MS = 1500;

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const Dashboard = () => {
  const { getPosition } = useGeolocation();
  const { preferences } = usePreferences();
  const {
    isRecording,
    durationSec,
    startRecording,
    stopAndSaveToVault,
    error: recordingError,
    setError: setRecordingError,
  } = useSosRecording();
  const [contactCount, setContactCount] = useState(0);
  const [activeIncident, setActiveIncident] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sosLoading, setSosLoading] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const [message, setMessage] = useState(null);
  const holdTimer = useRef(null);
  const progressInterval = useRef(null);
  const holdStart = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      const [contactsRes, incidentRes, incomingRes] = await Promise.all([
        contactsApi.list(),
        incidentsApi.getActive(),
        incidentsApi.listIncoming().catch(() => ({ data: { alerts: [] } })),
      ]);
      setContactCount(contactsRes.data.contacts.length);
      setActiveIncident(incidentRes.data.incident);
      setIncomingAlerts(incomingRes.data.alerts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    holdTimer.current = null;
    progressInterval.current = null;
    setHoldProgress(0);
  };

  const triggerSOS = async () => {
    setSosLoading(true);
    setMessage(null);
    setRecordingError(null);
    try {
      let coords = {};
      try {
        coords = await getPosition();
      } catch {
        /* SOS still works without location */
      }
      const { data } = await incidentsApi.create({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setActiveIncident(data.incident);

      let alertMessage = data.message;
      setCapturingPhoto(true);
      try {
        const photo = await captureSosPhoto();
        const photoRes = await incidentsApi.uploadSosPhoto(data.incident.id, photo);
        setActiveIncident(photoRes.data.incident);
        alertMessage = photoRes.data.message;
      } catch (photoErr) {
        try {
          const pushRes = await incidentsApi.dispatchPush(data.incident.id);
          alertMessage = pushRes.data.message;
        } catch {
          alertMessage =
            photoErr.message?.includes('Camera')
              ? `${photoErr.message} SOS recorded; enable camera for automatic photos.`
              : 'SOS recorded. Photo capture failed — push sent without photo.';
        }
      } finally {
        setCapturingPhoto(false);
      }

      await startRecording(data.incident.id);
      setMessage({
        type: 'success',
        text: `${alertMessage} Audio recording started.`,
      });
      if (preferences.sosSound) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.1;
          osc.start();
          setTimeout(() => osc.stop(), 400);
        } catch {
          /* optional */
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSosLoading(false);
      clearHold();
    }
  };

  const resolveSOS = async () => {
    if (!activeIncident) return;
    setSosLoading(true);
    try {
      if (isRecording) {
        const saved = await stopAndSaveToVault();
        await incidentsApi.resolve(activeIncident.id);
        setActiveIncident(null);
        setMessage({
          type: 'success',
          text: saved
            ? 'SOS resolved. Recording saved to Evidence Vault.'
            : 'SOS alert resolved.',
        });
      } else {
        await incidentsApi.resolve(activeIncident.id);
        setActiveIncident(null);
        setMessage({ type: 'success', text: 'SOS alert resolved.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSosLoading(false);
    }
  };

  const startHold = () => {
    if (sosLoading || activeIncident) return;
    holdStart.current = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      setHoldProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
    }, 50);
    holdTimer.current = setTimeout(() => {
      triggerSOS();
    }, HOLD_MS);
  };

  return (
    <div className="flex flex-col animate-slide-up">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">SecureStep</p>
          <h1 className="text-xl font-bold tracking-tight text-text">Safety dashboard</h1>
          <p className="mt-0.5 text-xs text-text-tertiary">Your protection hub</p>
        </div>
        <Link
          to="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-overlay text-text-tertiary transition-all hover:border-border-light hover:text-text"
          aria-label="Settings"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Alerts */}
        {incomingAlerts.length > 0 && (
          <div className="mb-3 space-y-2">
            {incomingAlerts.map((a) => (
              <Link
                key={a.id}
                to={`/alerts/${a.id}`}
                className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-muted p-3 transition-colors hover:border-danger/50"
              >
                <Bell className="h-5 w-5 shrink-0 text-danger" />
                <span className="min-w-0 flex-1 text-sm font-medium text-text">
                  SOS from {a.fromUserName}
                  {a.hasSharedPhoto ? ' · photo attached' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}

        {message && (
          <div className="mb-3">
            <Alert variant={message.type} onDismiss={() => setMessage(null)}>
              {message.text}
            </Alert>
          </div>
        )}

        {capturingPhoto && (
          <Card className="mb-3 flex items-center gap-3 !border-brand-500/25 !bg-brand-500/10">
            <Camera className="h-5 w-5 animate-pulse text-brand-400" />
            <p className="text-xs font-medium text-text">Capturing emergency photo…</p>
          </Card>
        )}
        {recordingError && (
          <div className="mb-3">
            <Alert variant="warning" onDismiss={() => setRecordingError(null)}>
              {recordingError}
            </Alert>
          </div>
        )}

        {/* Status Card */}
        <Card
          className={`mb-3 flex items-center gap-3 ${
            activeIncident
              ? '!border-danger/30 !bg-danger-muted'
              : '!border-success/20 !bg-success-muted'
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              activeIncident ? 'bg-danger/20' : 'bg-success/15'
            }`}
          >
            {activeIncident ? (
              <AlertTriangle className="h-4 w-4 text-danger" />
            ) : (
              <Shield className="h-4 w-4 text-success" />
            )}
          </span>
          <div className="flex-1">
            <p className={`text-xs font-semibold ${activeIncident ? 'text-danger' : 'text-success'}`}>
              {activeIncident ? 'SOS alert active' : 'Protection active'}
            </p>
            <p className="text-[11px] text-text-tertiary">
              {activeIncident
                ? `${activeIncident.notifiedContacts?.length || 0} contact(s) notified`
                : `${contactCount} emergency contact(s) on file`}
            </p>
          </div>
        </Card>

        {/* Recording indicator */}
        {isRecording && (
          <Card className="mb-3 flex items-center gap-3 !border-danger/30 !bg-danger-muted">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-danger/20">
              <Mic className="h-4 w-4 text-danger" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
              </span>
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-danger">Recording audio</p>
              <p className="text-[11px] text-text-tertiary">
                {formatDuration(durationSec)} · auto-capture
              </p>
            </div>
          </Card>
        )}

        {activeIncident && (
          <Button variant="secondary" className="mb-3 w-full" onClick={resolveSOS} disabled={sosLoading}>
            {isRecording ? 'Stop & resolve SOS' : 'Resolve SOS'}
          </Button>
        )}

        {/* SOS Button */}
        <section className="mb-6 flex flex-col items-center">
          <p className="mb-3 text-center text-[11px] text-text-tertiary">
            {activeIncident
              ? 'Emergency alert is live'
              : 'Hold for 1.5s to trigger emergency alert'}
          </p>
          <button
            type="button"
            disabled={sosLoading || Boolean(activeIncident)}
            onPointerDown={startHold}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
            onPointerCancel={clearHold}
            className="group relative flex h-[7.5rem] w-[7.5rem] touch-none items-center justify-center rounded-full bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 text-white shadow-xl shadow-brand-600/30 transition-all duration-200 active:scale-95 hover:shadow-brand-500/45 disabled:opacity-50 animate-pulse-glow"
            aria-label="Emergency SOS"
          >
            <span
              className="absolute inset-0 rounded-full border-[3px] border-brand-400/20"
              style={{
                background: `conic-gradient(rgba(255,255,255,0.3) ${holdProgress}%, transparent 0)`,
              }}
            />
            <span className="absolute inset-2 rounded-full border border-white/10 bg-gradient-to-br from-brand-600 to-brand-700" />
            <span className="relative text-xl font-bold tracking-wider">
              {sosLoading ? '...' : 'SOS'}
            </span>
          </button>
        </section>

        {/* Quick Access */}
        <section>
          <h2 className="section-label">Quick access</h2>
          <div className="space-y-1.5">
            <QuickLink
              to="/journey"
              icon={Route}
              title="Journey tracking"
              description="Trip alerts · safe arrival"
              iconColor="text-success"
            />
            <QuickLink
              to="/trusted-groups"
              icon={UsersRound}
              title="Trusted Network"
              description="Safety circles"
              iconColor="text-info"
            />
            <QuickLink
              to="/navigation"
              icon={MapPin}
              title="Navigation"
              description="Live location sharing"
              iconColor="text-warning"
            />
            <QuickLink
              to="/contacts"
              icon={Users}
              title="Emergency contacts"
              description="Manage who gets notified"
              iconColor="text-brand-400"
            />
            <QuickLink
              to="/evidence"
              icon={Camera}
              title="Evidence Vault"
              description="Encrypted media"
              iconColor="text-info"
            />
            <QuickLink
              to="/chatbot"
              icon={MessageCircle}
              title="Emergency assistant"
              description="Guided help"
              iconColor="text-success"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
