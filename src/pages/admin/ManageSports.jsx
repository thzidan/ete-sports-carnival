import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { supabase } from '../../supabaseClient';
import { useStore } from '../../store/useStore';

const defaultForm = { name: '', icon: '' };

export default function ManageSports() {
  const loadLookups = useStore((state) => state.loadLookups);
  const [sports, setSports] = useState([]);
  const [form, setForm, clearForm] = usePersistentState('admin-manage-sports-form', defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSports = async () => {
    try {
      setLoading(true);
      const { data, error: sportsError } = await supabase.from('sports').select('*').order('created_at', { ascending: false });
      if (sportsError) throw sportsError;
      setSports(data ?? []);
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load sports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSports();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const { error: createError } = await supabase.from('sports').insert({
        name: form.name,
        icon: form.icon || null,
      });
      if (createError) throw createError;
      clearForm();
      await Promise.all([fetchSports(), loadLookups()]);
    } catch (createError) {
      setError(createError.message ?? 'Unable to create sport.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sportId) => {
    if (!window.confirm('Delete this sport? Related matches and standings may also be removed depending on schema constraints.')) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await supabase.from('sports').delete().eq('id', sportId);
      if (deleteError) throw deleteError;
      await Promise.all([fetchSports(), loadLookups()]);
    } catch (deleteErr) {
      setError(deleteErr.message ?? 'Unable to delete sport.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Manage Sports</h1>
        <p className="section-copy">Add or delete the sports that power public scoreboards and match scheduling.</p>
      </div>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <form className="card grid gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={handleCreate}>
        <input
          className="input-field"
          placeholder="Sport name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
        />
        <input
          className="input-field"
          placeholder="Icon or emoji"
          value={form.icon}
          onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
        />
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Add Sport'}
        </button>
      </form>

      <div className="table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Icon</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">Loading sports...</td>
                </tr>
              ) : sports.length ? (
                sports.map((sport) => (
                  <tr key={sport.id}>
                    <td className="font-semibold">{sport.name}</td>
                    <td>{sport.icon ?? '-'}</td>
                    <td>{new Date(sport.created_at).toLocaleDateString()}</td>
                    <td>
                      <button type="button" className="secondary-button gap-2" onClick={() => handleDelete(sport.id)}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">No sports added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}