import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, backTo = '/', showBack = true }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 px-4 py-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            to={backTo}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-overlay text-text-tertiary transition-all hover:border-border-light hover:text-text"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="w-9 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="truncate text-xs text-text-tertiary">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
