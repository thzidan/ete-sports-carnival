import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SportFilter from '../components/SportFilter';
import { useStore } from '../store/useStore';
import { supabase } from '../supabaseClient';
import { slugify } from '../utils/formatters';
import { STANDINGS_SELECT } from '../utils/selects';

export default function Scoreboard() {
  const sports = useStore((state) => state.sports);
  const [searchParams, setSearchParams] = useSearchParams();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeSport = searchParams.get('sport') ?? 'all';

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, error: standingsError } = await supabase
          .from('standings')
          .select(STANDINGS_SELECT)
          .order('points', { ascending: false });

        if (standingsError) throw standingsError;
        setStandings(data ?? []);
      } catch (fetchError) {
        setError(fetchError.message ?? 'Unable to load scoreboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchStandings();
  }, []);

  const filteredRows = useMemo(() => {
    const rows =
      activeSport === 'all'
        ? standings
        : standings.filter((row) => slugify(row.sport?.name ?? '') === activeSport);

    return [...rows].sort((left, right) => right.points - left.points || right.wins - left.wins);
  }, [activeSport, standings]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-heading">Full Scoreboard</h1>
          <p className="section-copy">Track every series across every sport, sorted by points descending.</p>
        </div>
        <SportFilter
          sports={sports}
          activeSport={activeSport}
          onChange={(sportKey) => setSearchParams(sportKey === 'all' ? {} : { sport: sportKey })}
        />
      </section>

      {error ? <div className="card border-danger/40 text-sm text-red-300">{error}</div> : null}

      <div className="table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Sport</th>
                <th>Played</th>
                <th>Won</th>
                <th>Lost</th>
                <th>Drawn</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan="8">
                      <div className="h-6 animate-pulse rounded bg-[#242424]" />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length ? (
                filteredRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td className="font-semibold">{row.team?.name}</td>
                    <td>{row.sport?.name}</td>
                    <td>{row.matches_played}</td>
                    <td>{row.wins}</td>
                    <td>{row.losses}</td>
                    <td>{row.draws}</td>
                    <td>{row.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No standings are available for this sport yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
