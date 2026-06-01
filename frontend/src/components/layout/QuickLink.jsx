import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function QuickLink({ to, icon: Icon, title, description, iconColor = 'text-brand-400' }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-raised/80 p-3.5 transition-all duration-200 hover:border-border-light hover:bg-surface-overlay active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-overlay">
        <Icon className={`h-[18px] w-[18px] ${iconColor}`} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text">{title}</span>
        {description && (
          <span className="block text-[11px] text-text-tertiary">{description}</span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-text-secondary" />
    </Link>
  );
}
