import { NavLink } from 'react-router-dom';
import { Home, Route, Users, Settings } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/journey', label: 'Journey', icon: Route },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <ul className="flex items-stretch justify-around px-1 py-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition-all duration-200 ${
                  isActive ? 'text-brand-500' : 'text-text-tertiary hover:text-text-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-500/15 ring-1 ring-brand-500/25'
                        : ''
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
