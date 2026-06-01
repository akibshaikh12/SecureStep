export default function Alert({ variant = 'info', children, onDismiss }) {
  const styles = {
    info: 'bg-info-muted text-info border-info/20',
    success: 'bg-success-muted text-success border-success/20',
    error: 'bg-danger-muted text-danger border-danger/20',
    warning: 'bg-warning-muted text-warning border-warning/20',
  };
  return (
    <div className={`animate-slide-up rounded-xl border px-3.5 py-2.5 text-xs font-medium ${styles[variant]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">{children}</div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-[10px] font-semibold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
