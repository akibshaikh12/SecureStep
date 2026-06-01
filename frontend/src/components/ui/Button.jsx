const variants = {
  primary:
    'bg-gradient-to-r from-brand-600 to-brand-500 font-semibold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-400 hover:shadow-brand-500/35 active:scale-[0.98]',
  secondary:
    'bg-surface-raised text-text border border-border hover:border-border-light hover:bg-surface-overlay active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:text-text hover:bg-surface-overlay',
  danger:
    'bg-danger/90 text-white shadow-lg shadow-danger/20 hover:bg-danger active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm font-medium rounded-xl',
  lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
