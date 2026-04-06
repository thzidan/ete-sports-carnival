import { useEffect, useState } from 'react';
import PlayerAuctionCard from '../../components/PlayerAuctionCard';
import { useStore } from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { PLAYER_SELECT } from '../../utils/selects';

export default function TeamSquad() {
  const teamId = useStore((state) => state.teamId);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSquad = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        setError('');
        const { data, error: squadError } = await supabase
          .from('players')
          .select(PLAYER_SELECT)
          .eq('sold_to_team_id', teamId)
          .order('position')
          .order('name');

        if (squadError) throw squadError;
        setPlayers(data ?? []);
      } catch (fetchError) {
        setError(fetchError.message ?? 'Unable to load your squad.');
      } finally {
        setLoading(false);
      }
    };

    void fetchSquad();
  }, [teamId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">My Squad</h1>
        <p className="section-copy">All players bought by your series team, grouped in a responsive card grid.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="card h-40 animate-pulse bg-[#151515]" />)
        ) : players.length ? (
          players.map((player) => <PlayerAuctionCard key={player.id} player={player} compact />)
        ) : (
          <div className="card text-sm text-muted lg:col-span-2">No players purchased yet.</div>
        )}
      </div>
    </div>
  );
}
