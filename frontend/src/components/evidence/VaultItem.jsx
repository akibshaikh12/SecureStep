import { Lock, Mic, Camera, FileText, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';

function TypeIcon({ type }) {
  if (type === 'audio') return <Mic className="h-4 w-4 text-brand-400" />;
  if (type === 'photo') return <Camera className="h-4 w-4 text-info" />;
  return <FileText className="h-4 w-4 text-warning" />;
}

export default function VaultItem({ item, onDelete }) {
  const isSos = item.source === 'sos_auto';

  return (
    <Card className="flex gap-3 !p-3">
      {item.type === 'photo' && item.dataUrl && !item.decryptError ? (
        <img src={item.dataUrl} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-border" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-overlay">
          <TypeIcon type={item.type} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-semibold capitalize text-text">{item.type}</p>
          {item.encrypted && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-success-muted px-1.5 py-0.5 text-[9px] font-semibold text-success">
              <Lock className="h-2.5 w-2.5" />
              AES
            </span>
          )}
          {isSos && (
            <span className="rounded-md bg-danger-muted px-1.5 py-0.5 text-[9px] font-semibold text-danger">
              SOS
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-text-tertiary">
          {item.decryptError ? 'Could not decrypt' : item.note || 'Vault item'}
        </p>
        <p className="text-[10px] text-text-tertiary/60">{new Date(item.createdAt).toLocaleString()}</p>

        {item.type === 'audio' && item.dataUrl && !item.decryptError && (
          <audio controls className="mt-1.5 h-7 w-full max-w-full" src={item.dataUrl}>
            <track kind="captions" />
          </audio>
        )}
        {item.type === 'note' && item.dataUrl && !item.decryptError && (
          <p className="mt-1.5 rounded-lg bg-surface-overlay p-2 text-[11px] text-text-secondary">{item.dataUrl}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="shrink-0 self-start text-text-tertiary hover:text-danger transition-colors"
        aria-label="Delete from vault"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
