import { useEffect, useState } from 'react';
import { Coins, RadioTower } from 'lucide-react';
import PlayerAuctionCard from '../../components/PlayerAuctionCard';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { supabase } from '../../supabaseClient';
import { formatCurrency } from '../../utils/formatters';
import { PLAYER_SELECT } from '../../utils/selects';

export default function AuctionControl() {
  const [auctionState, setAuctionState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = usePersistentState('admin-auction-selected-player', '');
  const [soldPrice, setSoldPrice, clearSoldPrice] = usePersistentState('admin-auction-sold-price', '');
  const [selectedTeamId, setSelectedTeamId, clearSelectedTeamId] = usePersistentState('admin-auction-selected-team', '');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ensureAuctionState = async () => {
    const { data, error: fetchError } = await supabase.from('auction_state').select('*').limit(1).maybeSingle();
    if (fetchError) throw fetchError;
    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
      .from('auction_state')
      .insert({ is_live: false })
      .select('*')
      .maybeSingle();

    if (insertError) throw insertError;
    return inserted;
  };

  const fetchAuctionData = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      setError('');

      const state = await ensureAuctionState();
      const [{ data: playersData, error: playersError }, { data: teamsData, error: teamsError }] = await Promise.all([
        supabase.from('players').select(PLAYER_SELECT).in('status', ['available', 'sold']).order('created_at'),
        supabase.from('teams').select('*').order('auction_credits', { ascending: false }),
      ]);

      if (playersError) throw playersError;
      if (teamsError) throw teamsError;

      const current = (playersData ?? []).find((player) => player.id === state.current_player_id) ?? null;
      const available = (playersData ?? []).filter((player) => player.status === 'available');
      const availablePlayerIds = new Set(available.map((player) => player.id));
      const teamIds = new Set((teamsData ?? []).map((team) => team.id));

      setAuctionState(state);
      setCurrentPlayer(current);
      setAvailablePlayers(available);
      setTeams(teamsData ?? []);
      setSelectedPlayerId((currentValue) => {
        if (currentValue && (currentValue === state.current_player_id || availablePlayerIds.has(currentValue))) {
          return currentValue;
        }
        return state.current_player_id ?? '';
      });
      setSoldPrice((currentValue) => currentValue || (current?.base_price ? String(current.base_price) : ''));
      setSelectedTeamId((currentValue) => (currentValue && teamIds.has(currentValue) ? currentValue : ''));
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load auction control data.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchAuctionData();
  }, []);

  useRealtimeRefresh(
    'auction-control-live',
    [{ table: 'auction_state' }, { table: 'players' }, { table: 'teams' }],
    () => {
      void fetchAuctionData(true);
    },
  );

  const handleToggleLive = async (isLive) => {
    try {
      setSaving(true);
      setError('');
      const { error: updateError } = await supabase
        .from('auction_state')
        .update({ is_live: isLive, updated_at: new Date().toISOString() })
        .eq('id', auctionState.id);
      if (updateError) throw updateError;
      await fetchAuctionData(true);
    } catch (toggleError) {
      setError(toggleError.message ?? 'Unable to update auction status.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrentPlayer = async () => {
    try {
      setSaving(true);
      setError('');
      const { error: updateError } = await supabase
        .from('auction_state')
        .update({ current_player_id: selectedPlayerId || null, updated_at: new Date().toISOString() })
        .eq('id', auctionState.id);
      if (updateError) throw updateError;
      clearSelectedTeamId();
      clearSoldPrice();
      await fetchAuctionData(true);
    } catch (assignError) {
      setError(assignError.message ?? 'Unable to set the current player.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSold = async () => {
    const team = teams.find((entry) => entry.id === selectedTeamId);
    const price = Number(soldPrice || 0);

    if (!team || !currentPlayer) {
      setError('Select a buying team and current player first.');
      return;
    }

    if (price <= 0) {
      setError('Enter a valid sold price.');
      return;
    }

    if (price > Number(team.auction_credits ?? 0)) {
      setError('That team does not have enough credits.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: playerError } = await supabase
        .from('players')
        .update({
          status: 'sold',
          sold_price: price,
          sold_to_team_id: team.id,
        })
        .eq('id', currentPlayer.id);
      if (playerError) throw playerError;

      const { error: teamError } = await supabase
        .from('teams')
        .update({ auction_credits: Number(team.auction_credits) - price })
        .eq('id', team.id);
      if (teamError) throw teamError;

      const nextPlayer = availablePlayers.find((player) => player.id !== currentPlayer.id) ?? null;
      const { error: stateError } = await supabase
        .from('auction_state')
        .update({
          current_player_id: nextPlayer?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auctionState.id);
      if (stateError) throw stateError;

      setModalOpen(false);
      clearSelectedTeamId();
      clearSoldPrice();
      await fetchAuctionData(true);
    } catch (sellError) {
      setError(sellError.message ?? 'Unable to mark player as sold.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Auction Control Panel</h1>
        <p className="section-copy">Run the football auction live, assign the current player, and finalize sales against team balances.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted">Auction live switch</p>
                <h2 className="text-2xl font-semibold text-copy">{auctionState?.is_live ? 'Auction is live' : 'Auction is offline'}</h2>
              </div>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${auctionState?.is_live ? 'bg-brand-teal text-black' : 'border border-divider bg-[#141414] text-copy'}`}
                onClick={() => handleToggleLive(!auctionState?.is_live)}
                disabled={loading || saving || !auctionState}
              >
                <span className="inline-flex items-center gap-2">
                  <RadioTower size={16} />
                  {auctionState?.is_live ? 'Turn Off' : 'Go Live'}
                </span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <select
                className="select-field"
                value={selectedPlayerId}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                disabled={loading}
              >
                <option value="">Select current player</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} • {player.position} • {player.series}
                  </option>
                ))}
              </select>
              <button type="button" className="primary-button" onClick={handleSetCurrentPlayer} disabled={saving || loading || !auctionState}>
                Save Current Player
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <input
                className="input-field"
                type="number"
                min="0"
                placeholder="Final sold price"
                value={soldPrice}
                onChange={(event) => setSoldPrice(event.target.value)}
                disabled={!currentPlayer}
              />
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (!currentPlayer) {
                    setError('Select and save a current player first.');
                    return;
                  }
                  setModalOpen(true);
                }}
                disabled={saving || !currentPlayer}
              >
                Mark as Sold
              </button>
            </div>
          </div>

          {loading ? (
            <div className="card h-72 animate-pulse bg-[#151515]" />
          ) : currentPlayer ? (
            <PlayerAuctionCard player={currentPlayer} />
          ) : (
            <div className="card text-sm text-muted">No current player selected for the auction yet.</div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="panel-title">Team Balances</h2>
                <p className="panel-subtitle">Credits remaining during the live auction.</p>
              </div>
              <Coins className="text-brand-lime" />
            </div>
          </div>

          {teams.map((team) => (
            <div key={team.id} className="card flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-copy">{team.name}</p>
                <p className="text-sm text-muted">Remaining credits</p>
              </div>
              <div className="rounded-full bg-[#141414] px-3 py-2 text-sm font-semibold text-copy">
                {formatCurrency(team.auction_credits)}
              </div>
            </div>
          ))}
        </aside>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-divider bg-surface p-6">
            <h2 className="text-2xl font-bold accent-text">Confirm Sale</h2>
            <p className="mt-2 text-sm text-muted">Choose the team that bought {currentPlayer?.name} for the final price.</p>

            <div className="mt-6 space-y-4">
              <select
                className="select-field"
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value)}
              >
                <option value="">Select buying team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} • {formatCurrency(team.auction_credits)} available
                  </option>
                ))}
              </select>

              <input className="input-field" value={soldPrice} onChange={(event) => setSoldPrice(event.target.value)} type="number" min="0" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="primary-button" onClick={handleConfirmSold} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm Sale'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setModalOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}