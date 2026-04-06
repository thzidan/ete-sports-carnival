import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useStore } from '../../store/useStore';

export default function ManageTeams() {
  const loadLookups = useStore((state) => state.loadLookups);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: '', logo_url: '', auction_credits: 10000 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error: teamError } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (teamError) throw teamError;
      setTeams(data ?? []);
      setDrafts(
        Object.fromEntries(
          (data ?? []).map((team) => [
            team.id,
            {
              name: team.name,
              logo_url: team.logo_url ?? '',
              auction_credits: team.auction_credits,
            },
          ]),
        ),
      );
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeams();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const { error: createError } = await supabase.from('teams').insert({
        name: form.name,
        logo_url: form.logo_url || null,
        auction_credits: Number(form.auction_credits || 0),
      });
      if (createError) throw createError;
      setForm({ name: '', logo_url: '', auction_credits: 10000 });
      await Promise.all([fetchTeams(), loadLookups()]);
    } catch (createError) {
      setError(createError.message ?? 'Unable to add team.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (teamId) => {
    try {
      setError('');
      const draft = drafts[teamId];
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          name: draft.name,
          logo_url: draft.logo_url || null,
          auction_credits: Number(draft.auction_credits || 0),
        })
        .eq('id', teamId);
      if (updateError) throw updateError;
      await Promise.all([fetchTeams(), loadLookups()]);
    } catch (saveError) {
      setError(saveError.message ?? 'Unable to update team.');
    }
  };

  const handleDelete = async (teamId) => {
    if (!window.confirm('Delete this team? This can affect standings, match history, and auction ownership.')) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId);
      if (deleteError) throw deleteError;
      await Promise.all([fetchTeams(), loadLookups()]);
    } catch (deleteErr) {
      setError(deleteErr.message ?? 'Unable to delete team.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Manage Teams</h1>
        <p className="section-copy">Register new series teams, assign logo URLs, and control remaining auction credits.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <form className="card grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]" onSubmit={handleCreate}>
        <input
          className="input-field"
          placeholder="Team name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
        />
        <input
          className="input-field"
          placeholder="Logo URL (optional)"
          value={form.logo_url}
          onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))}
        />
        <input
          className="input-field"
          type="number"
          min="0"
          value={form.auction_credits}
          onChange={(event) => setForm((current) => ({ ...current, auction_credits: event.target.value }))}
          required
        />
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Add Team'}
        </button>
      </form>

      <div className="table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Logo URL</th>
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">Loading teams...</td>
                </tr>
              ) : teams.length ? (
                teams.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <input
                        className="input-field"
                        value={drafts[team.id]?.name ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [team.id]: { ...current[team.id], name: event.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input-field"
                        value={drafts[team.id]?.logo_url ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [team.id]: { ...current[team.id], logo_url: event.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        value={drafts[team.id]?.auction_credits ?? 0}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [team.id]: { ...current[team.id], auction_credits: event.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button type="button" className="secondary-button gap-2" onClick={() => handleSave(team.id)}>
                          <Save size={16} />
                          Save
                        </button>
                        <button type="button" className="secondary-button gap-2" onClick={() => handleDelete(team.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">No teams created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
