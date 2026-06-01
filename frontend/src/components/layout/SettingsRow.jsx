import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SettingsRow({ to, icon: Icon, title, description, onClick, trailing }) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-overlay">
        <Icon className="h-[18px] w-[18px] text-text-secondary" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        {description && <span className="text-xs text-text-tertiary">{description}</span>}
      </span>
      {trailing || (to && <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary" />)}
    </>
  );

  const rowClass =
    'flex w-full items-center gap-3 rounded-xl px-1.5 py-2.5 text-left transition-colors hover:bg-surface-overlay/60';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {inner}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={`flex items-center gap-3 rounded-xl px-1.5 py-2.5`}>{inner}</div>;
}
