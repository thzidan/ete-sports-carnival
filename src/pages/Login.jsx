import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Login() {
  const navigate = useNavigate();
  const signIn = useStore((state) => state.signIn);
  const signOut = useStore((state) => state.signOut);
  const role = useStore((state) => state.role);
  const authLoading = useStore((state) => state.authLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      navigate('/admin');
    }

    if (!authLoading && role === 'team') {
      navigate('/team');
    }
  }, [authLoading, navigate, role]);

  if (!authLoading && role) {
    return <Navigate to={role === 'admin' ? '/admin' : '/team'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      const nextRole = await signIn(email, password);

      if (!nextRole) {
        await signOut();
        setError('Your account is authenticated, but no role is assigned in admin_users yet.');
        return;
      }

      navigate(nextRole === 'admin' ? '/admin' : '/team');
    } catch (loginError) {
      setError(loginError.message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-[28px] border border-brand-blue/30 bg-surface p-8">
        <p className="text-center text-sm uppercase tracking-[0.36em] text-muted">ETE Sports Carnival</p>
        <h1 className="mt-4 text-center text-3xl font-bold text-copy">Sign In</h1>
        <p className="mt-3 text-center text-sm text-muted">Use your Supabase Auth email and password to access the admin or team panel.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-copy" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="admin@ete.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-copy" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

          <button type="submit" className="primary-button w-full gap-2" disabled={loading}>
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}