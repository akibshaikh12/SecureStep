import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import PushSetupBanner from '../push/PushSetupBanner';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <div className="shrink-0">
        <PushSetupBanner />
      </div>
      <main className="page-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
