import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Mic, FileText, Upload, Lock, Shield } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import VaultItem from '../components/evidence/VaultItem';
import { evidenceApi } from '../services/api';
import { useSosRecording } from '../context/SosRecordingContext';

const Evidence = () => {
  const { isRecording, durationSec } = useSosRecording();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [manualRecording, setManualRecording] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await evidenceApi.list();
      setItems(data.evidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveEvidence = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await evidenceApi.create(payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = () => fileInputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await saveEvidence({
        type: 'photo',
        note: file.name,
        dataUrl: reader.result,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await saveEvidence({ type: 'note', note: noteText.trim() });
    setNoteText('');
    setNoteModal(false);
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (ev) => chunks.push(ev.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          await saveEvidence({
            type: 'audio',
            note: 'Manual voice recording',
            dataUrl: reader.result,
            mimeType: blob.type,
          });
        };
        reader.readAsDataURL(blob);
        setManualRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setManualRecording(true);
    } catch {
      setError('Microphone permission is required for audio evidence');
    }
  };

  const stopAudio = () => mediaRecorderRef.current?.stop();

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this item from the vault?')) return;
    try {
      await evidenceApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const types = [
    { icon: Camera, label: 'Photo', desc: 'Encrypted image', action: handlePhoto, color: 'text-info' },
    {
      icon: Mic,
      label: manualRecording ? 'Stop' : 'Audio',
      desc: manualRecording ? 'Save to vault' : 'Ambient recording',
      action: manualRecording ? stopAudio : startAudio,
      disabled: isRecording,
      color: 'text-brand-400',
    },
    { icon: FileText, label: 'Note', desc: 'Text log', action: () => setNoteModal(true), color: 'text-warning' },
  ];

  return (
    <PageLayout title="Evidence Vault" subtitle="AES-encrypted storage" backTo="/">
      <div className="space-y-3">
        <Card className="flex gap-3 !border-success/20 !bg-success-muted !p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
            <Shield className="h-4 w-4 text-success" />
          </span>
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold text-success">
              <Lock className="h-3 w-3" />
              Encrypted at rest
            </p>
            <p className="text-[11px] text-text-tertiary">
              Photos, audio, and notes encrypted before storage.
            </p>
          </div>
        </Card>

        {isRecording && (
          <Alert variant="warning">
            SOS recording in progress ({Math.floor(durationSec / 60)}:
            {String(durationSec % 60).padStart(2, '0')}).
          </Alert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />

        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <p className="text-center text-xs text-text-tertiary">Unlocking vault…</p>
        ) : items.length === 0 ? (
          <Card className="!border-dashed">
            <div className="flex flex-col items-center py-4 text-center">
              <Upload className="mb-2 h-6 w-6 text-text-tertiary" />
              <p className="text-xs font-medium text-text">Vault is empty</p>
              <p className="mt-0.5 max-w-[240px] text-[11px] text-text-tertiary">
                Trigger SOS to auto-record, or add encrypted items below.
              </p>
            </div>
          </Card>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <VaultItem item={item} onDelete={handleDelete} />
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-3 gap-2">
          {types.map(({ icon: Icon, label, desc, action, disabled, color }) => (
            <button
              key={label}
              type="button"
              disabled={saving || disabled}
              onClick={action}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-raised p-3 text-center transition-all hover:border-border-light hover:bg-surface-overlay disabled:opacity-40 active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay">
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
              <span className="text-[11px] font-semibold text-text">{label}</span>
              <span className="text-[9px] text-text-tertiary leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {noteModal && (
        <Modal title="Add encrypted note" onClose={() => setNoteModal(false)}>
          <form onSubmit={handleNote} className="space-y-3">
            <Input
              label="Note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Describe what happened…"
              required
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Encrypting…' : 'Save to vault'}
            </Button>
          </form>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Evidence;
