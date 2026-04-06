import { LogIn, ShieldCheck } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/scoreboard', label: 'Scoreboard' },
  { to: '/match-history', label: 'Match History' },
  { to: '/auction', label: 'Auction' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const role = useStore((state) => state.role);
  const signOut = useStore((state) => state.signOut);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-divider/80 bg-canvas/95 backdrop-blur">
      <div className="page-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <NavLink to="/" className="text-lg font-extrabold tracking-tight text-brand-blue sm:text-2xl">
            ETE Sports Carnival
          </NavLink>
          <div className="flex flex-wrap items-center gap-1 sm:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full border px-3 py-1.5 text-sm ${
                    isActive ? 'border-brand-blue/35 bg-[#141c29] text-copy' : 'border-transparent text-muted'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative px-3 py-2 text-sm font-medium ${isActive ? 'text-copy' : 'text-muted hover:text-copy'}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={`absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-brand-teal transition ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {role ? (
            <>
              <NavLink to={role === 'admin' ? '/admin' : '/team'} className="secondary-button gap-2 border-brand-blue/35">
                <ShieldCheck size={16} />
                {role === 'admin' ? 'Admin Panel' : 'Team Panel'}
              </NavLink>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="secondary-button gap-2 border-brand-blue/40 hover:border-brand-blue">
              <LogIn size={16} />
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}