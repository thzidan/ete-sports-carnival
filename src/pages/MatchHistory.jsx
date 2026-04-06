import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SportFilter from '../components/SportFilter';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import { useStore } from '../store/useStore';
import { supabase } from '../supabaseClient';
import { formatDate, slugify } from '../utils/formatters';
import { MATCH_SELECT } from '../utils/selects';

export default function MatchHistory() {
  const sports = useStore((state) => state.sports);
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeSport = searchParams.get('sport') ?? 'all';

  const fetchHistory = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      setError('');
      const { data, error: historyError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false });

      if (historyError) throw historyError;
      setMatches(data ?? []);
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load match history.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  useRealtimeRefresh(
    'match-history-live',
    [{ table: 'matches' }, { table: 'teams' }, { table: 'sports' }],
    () => {
      void fetchHistory(true);
    },
  );

  const filteredMatches = useMemo(
    () =>
      activeSport === 'all'
        ? matches
        : matches.filter((match) => slugify(match.sport?.name ?? '') === activeSport),
    [activeSport, matches],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-heading">Match History</h1>
          <p className="section-copy">Every completed match, sorted newest first with sport filters.</p>
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
                <th>Date</th>
                <th>Sport</th>
                <th>Fixture</th>
                <th>Score</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan="5">
                      <div className="h-6 animate-pulse rounded bg-[#242424]" />
                    </td>
                  </tr>
                ))
              ) : filteredMatches.length ? (
                filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <Link to={`/match/${match.id}`} className="hover:text-brand-teal">
                        {formatDate(match.scheduled_at)}
                      </Link>
                    </td>
                    <td>{match.sport?.name}</td>
                    <td>
                      <Link to={`/match/${match.id}`} className="font-semibold hover:text-brand-teal">
                        {match.team1?.name} vs {match.team2?.name}
                      </Link>
                    </td>
                    <td>
                      {match.team1_score ?? '-'} : {match.team2_score ?? '-'}
                    </td>
                    <td>{match.winner?.name ?? 'Draw'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No completed matches found for this filter.
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