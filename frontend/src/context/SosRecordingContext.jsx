import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { evidenceApi, incidentsApi } from '../services/api';
import { useAuth } from './AuthContext';

const SosRecordingContext = createContext(null);

export function SosRecordingProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const durationTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState(null);
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState(null);

  const cleanupStream = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async (incidentId) => {
    if (!incidentId || mediaRecorderRef.current?.state === 'recording') {
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setActiveIncidentId(incidentId);
      setIsRecording(true);
      setDurationSec(0);
      durationTimerRef.current = setInterval(() => {
        setDurationSec((s) => s + 1);
      }, 1000);
    } catch {
      setError('Microphone access is required for automatic SOS recording');
      cleanupStream();
    }
  }, [cleanupStream]);

  const stopAndSaveToVault = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    const incidentId = activeIncidentId;
    if (!recorder || recorder.state === 'inactive') {
      cleanupStream();
      setIsRecording(false);
      setActiveIncidentId(null);
      setDurationSec(0);
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStream();
        setIsRecording(false);
        setActiveIncidentId(null);
        setDurationSec(0);

        if (blob.size === 0) {
          resolve(null);
          return;
        }

        try {
          const dataUrl = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });

          const { data } = await evidenceApi.create({
            type: 'audio',
            note: `SOS automatic recording (${Math.round(blob.size / 1024)} KB)`,
            dataUrl,
            source: 'sos_auto',
            incidentId,
            mimeType,
          });
          resolve(data.evidence);
        } catch (err) {
          setError(err.message);
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, [activeIncidentId, cleanupStream]);

  const syncWithActiveIncident = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await incidentsApi.getActive();
      const incident = data.incident;
      if (incident && !isRecording) {
        await startRecording(incident.id);
      }
      if (!incident && isRecording) {
        await stopAndSaveToVault();
      }
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, isRecording, startRecording, stopAndSaveToVault]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithActiveIncident();
    }
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanupStream();
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      isRecording,
      durationSec,
      activeIncidentId,
      error,
      setError,
      startRecording,
      stopAndSaveToVault,
      syncWithActiveIncident,
    }),
    [
      isRecording,
      durationSec,
      activeIncidentId,
      error,
      startRecording,
      stopAndSaveToVault,
      syncWithActiveIncident,
    ]
  );

  return (
    <SosRecordingContext.Provider value={value}>{children}</SosRecordingContext.Provider>
  );
}

export function useSosRecording() {
  const ctx = useContext(SosRecordingContext);
  if (!ctx) throw new Error('useSosRecording must be used within SosRecordingProvider');
  return ctx;
}
