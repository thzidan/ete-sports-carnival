import { Coins, LogOut, Shield, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';

const navItems = [
  { to: '/team', label: 'Credits', icon: Coins, end: true },
  { to: '/team/squad', label: 'My Squad', icon: Users },
];

export default function TeamLayout() {
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
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-brand-blue/30 bg-[#141c29] p-3 text-brand-blue">
                <Shield size={22} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted">Team Panel</p>
                <h1 className="text-xl font-bold text-copy">{profile?.team?.name ?? 'Series Team'}</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{profile?.email ?? 'Team operator'}</p>
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