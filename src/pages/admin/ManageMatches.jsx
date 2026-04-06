import { useEffect, useMemo, useState } from 'react';
import { PencilLine, RefreshCcw, Trash2 } from 'lucide-react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { useStore } from '../../store/useStore';
import { supabase } from '../../supabaseClient';
import { formatDateTime } from '../../utils/formatters';
import { MATCH_SELECT } from '../../utils/selects';
import { calculateStandings } from '../../utils/standings';

const defaultForm = {
  sport_id: '',
  team1_id: '',
  team2_id: '',
  team1_score: '',
  team2_score: '',
  winner_option: '',
  status: 'upcoming',
  scheduled_at: '',
  venue: '',
  notes: '',
};

const toLocalInputValue = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function ManageMatches() {
  const sports = useStore((state) => state.sports);
  const teams = useStore((state) => state.teams);
  const [matches, setMatches] = useState([]);
  const [form, setForm, clearForm] = usePersistentState('admin-manage-matches-form', defaultForm);
  const [editingId, setEditingId, clearEditingId] = usePersistentState('admin-manage-matches-editing-id', null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const matchTeamOptions = useMemo(
    () => teams.filter((team) => team.id !== form.team1_id || team.id === form.team2_id),
    [form.team1_id, form.team2_id, teams],
  );

  const fetchMatches = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      const { data, error: matchError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .order('scheduled_at', { ascending: false });

      if (matchError) throw matchError;
      setMatches(data ?? []);
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load matches.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  const syncStandings = async () => {
    const [matchesResponse, teamsResponse, sportsResponse] = await Promise.all([
      supabase.from('matches').select('sport_id, team1_id, team2_id, winner_id, status').eq('status', 'completed'),
      supabase.from('teams').select('id'),
      supabase.from('sports').select('id'),
    ]);

    if (matchesResponse.error) throw matchesResponse.error;
    if (teamsResponse.error) throw teamsResponse.error;
    if (sportsResponse.error) throw sportsResponse.error;

    const rows = calculateStandings(matchesResponse.data ?? [], teamsResponse.data ?? [], sportsResponse.data ?? []);
    const { error: upsertError } = await supabase.from('standings').upsert(rows, { onConflict: 'sport_id,team_id' });
    if (upsertError) throw upsertError;
  };

  useEffect(() => {
    void fetchMatches();
  }, []);

  useRealtimeRefresh(
    'admin-matches-live',
    [{ table: 'matches' }, { table: 'teams' }, { table: 'sports' }, { table: 'standings' }],
    () => {
      void fetchMatches(true);
    },
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.team1_id === form.team2_id) {
      setError('Team 1 and Team 2 must be different.');
      return;
    }

    if (form.status === 'completed' && !form.winner_option) {
      setError('Choose a winner or mark the completed match as a draw.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        sport_id: form.sport_id,
        team1_id: form.team1_id,
        team2_id: form.team2_id,
        team1_score: form.team1_score || null,
        team2_score: form.team2_score || null,
        winner_id: form.status === 'completed' ? (form.winner_option === 'draw' ? null : form.winner_option) : null,
        status: form.status,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        venue: form.venue || null,
        notes: form.notes || null,
      };

      const query = editingId
        ? supabase.from('matches').update(payload).eq('id', editingId)
        : supabase.from('matches').insert(payload);

      const { error: saveError } = await query;
      if (saveError) throw saveError;

      await syncStandings();
      clearForm();
      clearEditingId();
      await fetchMatches(true);
    } catch (saveErr) {
      setError(saveErr.message ?? 'Unable to save match.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (match) => {
    setEditingId(match.id);
    setForm({
      sport_id: match.sport_id,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1_score: match.team1_score ?? '',
      team2_score: match.team2_score ?? '',
      winner_option: match.status === 'completed' ? (match.winner_id ?? 'draw') : '',
      status: match.status,
      scheduled_at: toLocalInputValue(match.scheduled_at),
      venue: match.venue ?? '',
      notes: match.notes ?? '',
    });
  };

  const handleReset = () => {
    setError('');
    clearEditingId();
    clearForm();
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm('Delete this match? Standings will be recalculated.')) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await supabase.from('matches').delete().eq('id', matchId);
      if (deleteError) throw deleteError;
      if (editingId === matchId) {
        handleReset();
      }
      await syncStandings();
      await fetchMatches(true);
    } catch (deleteErr) {
      setError(deleteErr.message ?? 'Unable to delete match.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Manage Matches</h1>
        <p className="section-copy">Create fixtures, update live scores, and mark results completed while recalculating standings automatically.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            className="select-field"
            value={form.sport_id}
            onChange={(event) => setForm((current) => ({ ...current, sport_id: event.target.value }))}
            required
          >
            <option value="">Select sport</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            value={form.team1_id}
            onChange={(event) => setForm((current) => ({ ...current, team1_id: event.target.value }))}
            required
          >
            <option value="">Select team 1</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            value={form.team2_id}
            onChange={(event) => setForm((current) => ({ ...current, team2_id: event.target.value }))}
            required
          >
            <option value="">Select team 2</option>
            {matchTeamOptions
              .filter((team) => team.id !== form.team1_id)
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
          <input
            type="datetime-local"
            className="input-field"
            value={form.scheduled_at}
            onChange={(event) => setForm((current) => ({ ...current, scheduled_at: event.target.value }))}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            className="input-field"
            placeholder="Team 1 score"
            value={form.team1_score}
            onChange={(event) => setForm((current) => ({ ...current, team1_score: event.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Team 2 score"
            value={form.team2_score}
            onChange={(event) => setForm((current) => ({ ...current, team2_score: event.target.value }))}
          />
          <select
            className="select-field"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value, winner_option: event.target.value === 'completed' ? current.winner_option : '' }))}
          >
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
          {form.status === 'completed' ? (
            <select
              className="select-field"
              value={form.winner_option}
              onChange={(event) => setForm((current) => ({ ...current, winner_option: event.target.value }))}
              required
            >
              <option value="">Choose winner</option>
              <option value="draw">Draw</option>
              {form.team1_id ? (
                <option value={form.team1_id}>{teams.find((team) => team.id === form.team1_id)?.name}</option>
              ) : null}
              {form.team2_id ? (
                <option value={form.team2_id}>{teams.find((team) => team.id === form.team2_id)?.name}</option>
              ) : null}
            </select>
          ) : (
            <input
              className="input-field"
              placeholder="Winner selection appears for completed matches"
              disabled
            />
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <input
            className="input-field"
            placeholder="Venue"
            value={form.venue}
            onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Match' : 'Add Match'}
          </button>
          <button type="button" className="secondary-button gap-2" onClick={handleReset}>
            <RefreshCcw size={16} />
            Reset
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <div key={index} className="card h-32 animate-pulse bg-[#151515]" />)
        ) : matches.length ? (
          matches.map((match) => (
            <div key={match.id} className="card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-muted">
                    {match.sport?.icon ? `${match.sport.icon} ` : ''}
                    {match.sport?.name}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-copy">
                    {match.team1?.name} vs {match.team2?.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{formatDateTime(match.scheduled_at)} • {match.venue ?? 'Venue TBA'}</p>
                  <p className="mt-1 text-sm text-muted">Score: {match.team1_score ?? '-'} : {match.team2_score ?? '-'}</p>
                  <p className="mt-1 text-sm text-muted">Status: {match.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="secondary-button gap-2" onClick={() => handleEdit(match)}>
                    <PencilLine size={16} />
                    Edit
                  </button>
                  <button type="button" className="secondary-button gap-2" onClick={() => handleDelete(match.id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-sm text-muted">No matches created yet.</div>
        )}
      </div>
    </div>
  );
}