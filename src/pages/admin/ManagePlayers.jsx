import { useEffect, useState } from 'react';
import { Save, Trash2, Upload } from 'lucide-react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { supabase } from '../../supabaseClient';
import { positionOptions } from '../../utils/formatters';
import { PLAYER_SELECT } from '../../utils/selects';

const BUCKET_NAME = 'player-photos';
const defaultForm = {
  name: '',
  series: '',
  position: positionOptions[0],
  base_price: 0,
  status: 'available',
};

export default function ManagePlayers() {
  const [players, setPlayers] = useState([]);
  const [drafts, setDrafts] = usePersistentState('admin-manage-players-drafts', {});
  const [form, setForm, clearForm] = usePersistentState('admin-manage-players-form', defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error: playerError } = await supabase
        .from('players')
        .select(PLAYER_SELECT)
        .order('created_at', { ascending: false });

      if (playerError) throw playerError;
      setPlayers(data ?? []);
      setDrafts((currentDrafts) =>
        Object.fromEntries(
          (data ?? []).map((player) => [
            player.id,
            {
              base_price: currentDrafts[player.id]?.base_price ?? player.base_price,
              status: currentDrafts[player.id]?.status ?? player.status,
            },
          ]),
        ),
      );
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load players.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlayers();
  }, []);

  const uploadPhotoIfNeeded = async () => {
    if (!photoFile) {
      return null;
    }

    const extension = photoFile.name.split('.').pop();
    const filePath = `${Date.now()}-${form.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, photoFile, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      const photoUrl = await uploadPhotoIfNeeded();
      const { error: createError } = await supabase.from('players').insert({
        name: form.name,
        series: form.series,
        position: form.position,
        photo_url: photoUrl,
        base_price: Number(form.base_price || 0),
        status: form.status,
      });
      if (createError) throw createError;

      clearForm();
      setPhotoFile(null);
      await fetchPlayers();
    } catch (createErr) {
      setError(createErr.message ?? 'Unable to create player. Make sure the storage bucket exists.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (playerId) => {
    try {
      setError('');
      const draft = drafts[playerId];
      const { error: updateError } = await supabase
        .from('players')
        .update({
          base_price: Number(draft.base_price || 0),
          status: draft.status,
        })
        .eq('id', playerId);
      if (updateError) throw updateError;

      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[playerId];
        return nextDrafts;
      });

      await fetchPlayers();
    } catch (saveError) {
      setError(saveError.message ?? 'Unable to update player.');
    }
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Delete this player record?')) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await supabase.from('players').delete().eq('id', playerId);
      if (deleteError) throw deleteError;

      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[playerId];
        return nextDrafts;
      });

      await fetchPlayers();
    } catch (deleteErr) {
      setError(deleteErr.message ?? 'Unable to delete player.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Manage Players</h1>
        <p className="section-copy">Register football auction players, upload photos to Supabase Storage, and edit their base price or availability.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <form className="card space-y-4" onSubmit={handleCreate}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="input-field"
            placeholder="Player name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            className="input-field"
            placeholder="Series"
            value={form.series}
            onChange={(event) => setForm((current) => ({ ...current, series: event.target.value }))}
            required
          />
          <select
            className="select-field"
            value={form.position}
            onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
          >
            {positionOptions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            type="number"
            min="0"
            placeholder="Base price"
            value={form.base_price}
            onChange={(event) => setForm((current) => ({ ...current, base_price: event.target.value }))}
            required
          />
          <select
            className="select-field"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="available">Available</option>
            <option value="unsold">Unsold</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-divider bg-[#141414] px-4 py-3 text-sm text-copy">
            <Upload size={16} className="text-brand-teal" />
            <span>{photoFile ? photoFile.name : 'Upload player photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-muted">Text inputs now stay saved locally, but the photo file needs to be selected again after a full refresh.</p>
        </div>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Add Player'}
        </button>
      </form>

      <div className="table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Series</th>
                <th>Position</th>
                <th>Base Price</th>
                <th>Status</th>
                <th>Sold To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">Loading players...</td>
                </tr>
              ) : players.length ? (
                players.map((player) => (
                  <tr key={player.id}>
                    <td className="font-semibold">{player.name}</td>
                    <td>{player.series}</td>
                    <td>{player.position}</td>
                    <td>
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        value={drafts[player.id]?.base_price ?? 0}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [player.id]: { ...current[player.id], base_price: event.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      {player.status === 'sold' ? (
                        <span className="status-pill border-brand-teal/40 bg-brand-teal/10 text-brand-teal">sold</span>
                      ) : (
                        <select
                          className="select-field"
                          value={drafts[player.id]?.status ?? player.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [player.id]: { ...current[player.id], status: event.target.value },
                            }))
                          }
                        >
                          <option value="available">available</option>
                          <option value="unsold">unsold</option>
                        </select>
                      )}
                    </td>
                    <td>{player.team?.name ?? '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button type="button" className="secondary-button gap-2" onClick={() => handleSave(player.id)}>
                          <Save size={16} />
                          Save
                        </button>
                        <button type="button" className="secondary-button gap-2" onClick={() => handleDelete(player.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">No players registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}