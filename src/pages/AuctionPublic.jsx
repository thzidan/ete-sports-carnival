import { useEffect, useState } from 'react';
import { RadioTower, Users } from 'lucide-react';
import PlayerAuctionCard from '../components/PlayerAuctionCard';
import { supabase } from '../supabaseClient';
import { PLAYER_SELECT } from '../utils/selects';

export default function AuctionPublic() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auctionState, setAuctionState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [soldPlayers, setSoldPlayers] = useState([]);

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setLoading(true);
        setError('');

        const [{ data: stateData, error: stateError }, { data: soldData, error: soldError }] = await Promise.all([
          supabase.from('auction_state').select('*').limit(1).maybeSingle(),
          supabase.from('players').select(PLAYER_SELECT).eq('status', 'sold').order('created_at', { ascending: false }),
        ]);

        if (stateError) throw stateError;
        if (soldError) throw soldError;

        let activePlayer = null;

        if (stateData?.current_player_id) {
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select(PLAYER_SELECT)
            .eq('id', stateData.current_player_id)
            .maybeSingle();

          if (playerError) throw playerError;
          activePlayer = playerData ?? null;
        }

        setAuctionState(stateData ?? null);
        setCurrentPlayer(activePlayer);
        setSoldPlayers(soldData ?? []);
      } catch (fetchError) {
        setError(fetchError.message ?? 'Unable to load auction state.');
      } finally {
        setLoading(false);
      }
    };

    void fetchAuctionData();

    const channel = supabase
      .channel('auction-public-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_state' }, () => {
        void fetchAuctionData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        void fetchAuctionData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="section-heading">Football Auction Live</h1>
            <p className="section-copy">Realtime updates stream from Supabase Realtime whenever the auction state or player sales change.</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${auctionState?.is_live ? 'bg-brand-teal text-black' : 'border border-divider bg-[#141414] text-copy'}`}>
            <RadioTower size={16} />
            {auctionState?.is_live ? 'LIVE AUCTION' : 'Auction Offline'}
          </div>
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-[#151515]" />
        ) : auctionState?.is_live && currentPlayer ? (
          <div className="mt-8 rounded-3xl border border-brand-teal/25 bg-[#141414] p-4">
            <div className="mb-4 inline-flex animate-pulse rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal">
              LIVE AUCTION
            </div>
            <PlayerAuctionCard player={currentPlayer} />
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-divider bg-[#141414] p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted" />
            <h2 className="mt-4 text-2xl font-semibold text-copy">Auction hasn't started yet</h2>
            <p className="mt-2 text-sm text-muted">
              As soon as the admin toggles the auction live and assigns a current player, this page updates instantly.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-heading">Sold Players</h2>
            <p className="section-copy">Latest completed football auction deals.</p>
          </div>
          <div className="rounded-full border border-divider bg-[#141414] px-4 py-2 text-sm text-copy">
            {soldPlayers.length} sold
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {soldPlayers.length ? (
            soldPlayers.map((player) => <PlayerAuctionCard key={player.id} player={player} compact />)
          ) : (
            <div className="card text-sm text-muted">No players have been sold yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}