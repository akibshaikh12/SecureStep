export function Input({ label, id, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-border bg-surface-overlay/80 px-3.5 py-2.5 text-sm text-text shadow-inner shadow-black/10 placeholder:text-text-tertiary focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
}
