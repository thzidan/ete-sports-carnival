import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Trophy, Users } from 'lucide-react';
import StatBadge from '../../components/StatBadge';
import { supabase } from '../../supabaseClient';
import { formatDateTime } from '../../utils/formatters';
import { MATCH_SELECT } from '../../utils/selects';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMatches: 0,
    liveMatches: 0,
    teamCount: 0,
    playerCount: 0,
  });
  const [nextMatch, setNextMatch] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        setError('');

        const [totalMatches, liveMatches, teams, players, nextMatchResponse] = await Promise.all([
          supabase.from('matches').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'live'),
          supabase.from('teams').select('*', { count: 'exact', head: true }),
          supabase.from('players').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select(MATCH_SELECT).eq('status', 'upcoming').order('scheduled_at', { ascending: true }).limit(1).maybeSingle(),
        ]);

        if (totalMatches.error) throw totalMatches.error;
        if (liveMatches.error) throw liveMatches.error;
        if (teams.error) throw teams.error;
        if (players.error) throw players.error;
        if (nextMatchResponse.error) throw nextMatchResponse.error;

        setStats({
          totalMatches: totalMatches.count ?? 0,
          liveMatches: liveMatches.count ?? 0,
          teamCount: teams.count ?? 0,
          playerCount: players.count ?? 0,
        });
        setNextMatch(nextMatchResponse.data ?? null);
      } catch (fetchError) {
        setError(fetchError.message ?? 'Unable to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      <section className="card p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-muted">Admin Overview</p>
        <h1 className="mt-3 text-4xl font-bold text-copy">Tournament Control Center</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          Monitor the entire ETE Sports Carnival operation from one place: match volume, live fixtures, registered teams, and football auction player depth.
        </p>
      </section>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatBadge label="Total Matches" value={loading ? '...' : stats.totalMatches} />
        <StatBadge label="Live Matches" value={loading ? '...' : stats.liveMatches} subtle />
        <StatBadge label="Teams Count" value={loading ? '...' : stats.teamCount} />
        <StatBadge label="Players Registered" value={loading ? '...' : stats.playerCount} subtle />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-brand-teal" />
            <div>
              <p className="text-sm text-muted">Next Upcoming Match</p>
              <p className="font-semibold text-copy">
                {nextMatch ? `${nextMatch.team1?.name} vs ${nextMatch.team2?.name}` : 'No upcoming match scheduled'}
              </p>
              {nextMatch ? <p className="text-xs text-muted">{formatDateTime(nextMatch.scheduled_at)}</p> : null}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Activity className="text-brand-lime" />
            <div>
              <p className="text-sm text-muted">Live Operations</p>
              <p className="font-semibold text-copy">{stats.liveMatches} fixtures need close monitoring</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="text-brand-blue" />
            <div>
              <p className="text-sm text-muted">Coverage</p>
              <p className="font-semibold text-copy">{stats.teamCount} teams across all active sports</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}