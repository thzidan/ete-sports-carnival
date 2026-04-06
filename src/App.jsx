import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useRealtimeRefresh } from './hooks/useRealtimeRefresh';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import TeamLayout from './layouts/TeamLayout';
import AuctionPublic from './pages/AuctionPublic';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MatchDetail from './pages/MatchDetail';
import MatchHistory from './pages/MatchHistory';
import Scoreboard from './pages/Scoreboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuctionControl from './pages/admin/AuctionControl';
import ManageMatches from './pages/admin/ManageMatches';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageSports from './pages/admin/ManageSports';
import ManageTeams from './pages/admin/ManageTeams';
import TeamDashboard from './pages/team/TeamDashboard';
import TeamSquad from './pages/team/TeamSquad';
import { useStore } from './store/useStore';

export default function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const loadLookups = useStore((state) => state.loadLookups);
  const fetchProfile = useStore((state) => state.fetchProfile);
  const user = useStore((state) => state.user);

  useRealtimeRefresh(
    'app-lookups-live',
    [{ table: 'teams' }, { table: 'sports' }],
    () => {
      void loadLookups(true);
    },
  );

  useRealtimeRefresh(
    'app-profile-live',
    [{ table: 'admin_users' }, { table: 'teams' }],
    () => {
      if (user?.id) {
        void fetchProfile(user.id);
      }
    },
    Boolean(user?.id),
  );

  useEffect(() => {
    let authSubscription;

    const bootstrap = async () => {
      try {
        authSubscription = await initializeAuth();
        await loadLookups();
      } catch (error) {
        console.error(error);
      }
    };

    void bootstrap();

    return () => {
      authSubscription?.unsubscribe?.();
    };
  }, [initializeAuth, loadLookups]);

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/match-history" element={<MatchHistory />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/auction" element={<AuctionPublic />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['team']} />}>
        <Route path="/team" element={<TeamLayout />}>
          <Route index element={<TeamDashboard />} />
          <Route path="squad" element={<TeamSquad />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="sports" element={<ManageSports />} />
          <Route path="teams" element={<ManageTeams />} />
          <Route path="matches" element={<ManageMatches />} />
          <Route path="players" element={<ManagePlayers />} />
          <Route path="auction" element={<AuctionControl />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}