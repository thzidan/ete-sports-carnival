import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const role = useStore((state) => state.role);
  const authLoading = useStore((state) => state.authLoading);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="card w-full max-w-md text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-divider border-t-brand-teal" />
          <p className="mt-4 text-sm text-muted">Checking your access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/team'} replace />;
  }

  return <Outlet />;
}
