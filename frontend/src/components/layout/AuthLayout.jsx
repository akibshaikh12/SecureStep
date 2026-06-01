export default function AuthLayout({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="auth-page animate-slide-up">
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          {Icon && (
            <span className="auth-logo">
              <Icon className="h-7 w-7 text-brand-400" strokeWidth={1.75} />
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
