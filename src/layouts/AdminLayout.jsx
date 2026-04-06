import { CalendarDays, LayoutDashboard, LogOut, Trophy, Users, Volleyball } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sports', label: 'Manage Sports', icon: Trophy },
  { to: '/admin/teams', label: 'Manage Teams', icon: Users },
  { to: '/admin/matches', label: 'Manage Matches', icon: CalendarDays },
  { to: '/admin/players', label: 'Manage Players', icon: Volleyball },
  { to: '/admin/auction', label: 'Auction Control', icon: Trophy },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const signOut = useStore((state) => state.signOut);
  const profile = useStore((state) => state.profile);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="card h-fit lg:sticky lg:top-6">
          <div className="border-b border-divider pb-4">
            <p className="text-sm uppercase tracking-[0.28em] text-muted">Admin Panel</p>
            <h1 className="mt-2 text-2xl font-bold text-copy">ETE Sports Carnival Control</h1>
            <p className="mt-2 text-sm text-muted">{profile?.email ?? 'Signed in administrator'}</p>
          </div>

          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  end={item.end}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'border-brand-blue/30 bg-[#141c29] text-copy'
                        : 'border-transparent text-muted hover:bg-[#141414] hover:text-copy'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button type="button" className="secondary-button mt-6 w-full gap-2" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <section className="space-y-6">
          <Outlet />
        </section>
      </div>
      <Footer />
    </div>
  );
}