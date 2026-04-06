import { useEffect, useMemo, useState } from 'react';
import { Coins, Shield, Users } from 'lucide-react';
import PlayerAuctionCard from '../../components/PlayerAuctionCard';
import StatBadge from '../../components/StatBadge';
import { useStore } from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { PLAYER_SELECT } from '../../utils/selects';
import { formatCurrency } from '../../utils/formatters';

export default function TeamDashboard() {
  const teamId = useStore((state) => state.teamId);
  const profile = useStore((state) => state.profile);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamDashboard = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError('');

        const [{ data: teamData, error: teamError }, { data: playerData, error: playerError }] = await Promise.all([
          supabase.from('teams').select('id, name, logo_url, auction_credits').eq('id', teamId).maybeSingle(),
          supabase.from('players').select(PLAYER_SELECT).eq('sold_to_team_id', teamId).order('created_at', { ascending: false }),
        ]);

        if (teamError) throw teamError;
        if (playerError) throw playerError;

        setTeam(teamData ?? null);
        setPlayers(playerData ?? []);
      } catch (fetchError) {
        setError(fetchError.message ?? 'Unable to load your team dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchTeamDashboard();
  }, [teamId]);

  const totalSpent = useMemo(
    () => players.reduce((sum, player) => sum + Number(player.sold_price ?? 0), 0),
    [players],
  );

  if (loading) {
    return <div className="card h-72 animate-pulse bg-[#151515]" />;
  }

  return (
    <div className="space-y-6">
      <section className="card p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-muted">Team Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold accent-text">{team?.name ?? profile?.team?.name ?? 'My Team'}</h1>
            <p className="mt-3 text-sm text-muted">Track your remaining budget, total spend, and current football auction squad.</p>
          </div>
          <div className="rounded-full border border-divider bg-[#141414] px-4 py-2 text-sm text-copy">
            Team role authenticated
          </div>
        </div>
      </section>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatBadge label="Remaining Credits" value={formatCurrency(team?.auction_credits ?? 0)} />
        <StatBadge label="Total Spent" value={formatCurrency(totalSpent)} subtle />
        <StatBadge label="Player Count" value={players.length} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <Coins className="text-brand-lime" />
            <div>
              <p className="text-sm text-muted">Budget Snapshot</p>
              <p className="font-semibold text-copy">{formatCurrency((team?.auction_credits ?? 0) + totalSpent)} initial pool</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Shield className="text-brand-teal" />
            <div>
              <p className="text-sm text-muted">Team Identity</p>
              <p className="font-semibold text-copy">{team?.name ?? 'Series team'}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="text-brand-blue" />
            <div>
              <p className="text-sm text-muted">Squad Depth</p>
              <p className="font-semibold text-copy">{players.length} players acquired</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-heading">Latest Squad Additions</h2>
            <p className="section-copy">Your three most recent football auction wins.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {players.length ? (
            players.slice(0, 3).map((player) => <PlayerAuctionCard key={player.id} player={player} compact />)
          ) : (
            <div className="card text-sm text-muted lg:col-span-3">No players have been added to your squad yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
