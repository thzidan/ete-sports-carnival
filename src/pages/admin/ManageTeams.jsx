import { useEffect, useState } from 'react';
import { Save, Trash2, Upload } from 'lucide-react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { supabase } from '../../supabaseClient';
import { useStore } from '../../store/useStore';

const BUCKET_NAME = 'team-logos';
const defaultForm = { name: '', logo_url: '', auction_credits: 10000 };

export default function ManageTeams() {
  const loadLookups = useStore((state) => state.loadLookups);
  const [teams, setTeams] = useState([]);
  const [form, setForm, clearForm] = usePersistentState('admin-manage-teams-form', defaultForm);
  const [logoFile, setLogoFile] = useState(null);
  const [teamLogoFiles, setTeamLogoFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = usePersistentState('admin-manage-teams-drafts', {});
  const [error, setError] = useState('');

  const fetchTeams = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      const { data, error: teamError } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (teamError) throw teamError;
      setTeams(data ?? []);
      setDrafts((currentDrafts) =>
        Object.fromEntries(
          (data ?? []).map((team) => [
            team.id,
            {
              name: currentDrafts[team.id]?.name ?? team.name,
              logo_url: currentDrafts[team.id]?.logo_url ?? (team.logo_url ?? ''),
              auction_credits: currentDrafts[team.id]?.auction_credits ?? team.auction_credits,
            },
          ]),
        ),
      );
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load teams.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchTeams();
  }, []);

  useRealtimeRefresh(
    'admin-teams-live',
    [{ table: 'teams' }],
    () => {
      void fetchTeams(true);
      void loadLookups(true);
    },
  );

  const uploadLogoIfNeeded = async (file, teamName) => {
    if (!file) {
      return null;
    }

    const extension = file.name.split('.').pop();
    const filePath = `${Date.now()}-${teamName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const clearTeamDraft = (teamId) => {
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[teamId];
      return nextDrafts;
    });

    setTeamLogoFiles((currentFiles) => {
      const nextFiles = { ...currentFiles };
      delete nextFiles[teamId];
      return nextFiles;
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const logoUrl = await uploadLogoIfNeeded(logoFile, form.name);
      const { error: createError } = await supabase.from('teams').insert({
        name: form.name,
        logo_url: logoUrl ?? (form.logo_url || null),
        auction_credits: Number(form.auction_credits || 0),
      });
      if (createError) throw createError;
      clearForm();
      setLogoFile(null);
      await Promise.all([fetchTeams(true), loadLookups(true)]);
    } catch (createError) {
      setError(createError.message ?? 'Unable to add team. Make sure the storage bucket exists.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (teamId) => {
    try {
      setError('');
      const draft = drafts[teamId];
      const replacementLogoUrl = await uploadLogoIfNeeded(teamLogoFiles[teamId], draft.name);
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          name: draft.name,
          logo_url: replacementLogoUrl ?? (draft.logo_url || null),
          auction_credits: Number(draft.auction_credits || 0),
        })
        .eq('id', teamId);
      if (updateError) throw updateError;

      clearTeamDraft(teamId);
      await Promise.all([fetchTeams(true), loadLookups(true)]);
    } catch (saveError) {
      setError(saveError.message ?? 'Unable to update team. Make sure the storage bucket exists.');
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

      clearTeamDraft(teamId);
      await Promise.all([fetchTeams(true), loadLookups(true)]);
    } catch (deleteErr) {
      setError(deleteErr.message ?? 'Unable to delete team.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Manage Teams</h1>
        <p className="section-copy">Register new series teams, upload team logos to Supabase Storage, and control remaining auction credits.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <form className="card space-y-4" onSubmit={handleCreate}>
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_auto]">
          <input
            className="input-field"
            placeholder="Team name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
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
        </div>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-divider bg-[#141414] px-4 py-3 text-sm text-copy">
            <Upload size={16} className="text-brand-teal" />
            <span>{logoFile ? logoFile.name : 'Upload team logo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-muted">Logo files upload to the `team-logos` bucket. After a full refresh, the file needs to be selected again.</p>
        </div>
      </form>

      <div className="table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Logo</th>
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
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-divider bg-[#141414]">
                          {drafts[team.id]?.logo_url ? (
                            <img src={drafts[team.id].logo_url} alt={`${drafts[team.id]?.name ?? team.name} logo`} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">No logo</span>
                          )}
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-divider bg-[#141414] px-3 py-2 text-xs text-copy transition hover:border-brand-teal">
                          <Upload size={14} className="text-brand-teal" />
                          <span>{teamLogoFiles[team.id]?.name ?? 'Replace logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              setTeamLogoFiles((current) => ({
                                ...current,
                                [team.id]: event.target.files?.[0] ?? null,
                              }))
                            }
                          />
                        </label>
                      </div>
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