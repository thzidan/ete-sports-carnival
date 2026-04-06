import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, MapPin, StickyNote } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import { supabase } from '../supabaseClient';
import { formatDateTime } from '../utils/formatters';
import { MATCH_SELECT } from '../utils/selects';

export default function MatchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatch = async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      setError('');
      const { data, error: matchError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (matchError) throw matchError;
      setMatch(data ?? null);
    } catch (fetchError) {
      setError(fetchError.message ?? 'Unable to load match details.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (id) {
      void fetchMatch();
    }
  }, [id]);

  useRealtimeRefresh(
    `match-detail-${id}`,
    [{ table: 'matches' }, { table: 'teams' }, { table: 'sports' }],
    () => {
      if (id) {
        void fetchMatch(true);
      }
    },
    Boolean(id),
  );

  if (loading) {
    return <div className="card h-72 animate-pulse bg-[#151515]" />;
  }

  if (error) {
    return <div className="card border-danger/40 text-sm text-red-300">{error}</div>;
  }

  if (!match) {
    return <div className="card text-sm text-muted">Match not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="secondary-button gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <Link to="/match-history" className="secondary-button">
          All Results
        </Link>
      </div>

      <section className="card card-glow p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-muted">
          {match.sport?.icon ? `${match.sport.icon} ` : ''}
          {match.sport?.name}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-copy">
          {match.team1?.name} vs {match.team2?.name}
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#141414] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">{match.team1?.name}</p>
            <p className="mt-2 text-4xl font-bold text-copy">{match.team1_score ?? '-'}</p>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-divider bg-canvas px-4 py-5 text-sm font-semibold uppercase tracking-[0.28em] text-muted">
            {match.status}
          </div>
          <div className="rounded-2xl bg-[#141414] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">{match.team2?.name}</p>
            <p className="mt-2 text-4xl font-bold text-copy">{match.team2_score ?? '-'}</p>
          </div>
        </div>

        <div className="mt-8 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal">
          {match.winner?.name ? `${match.winner.name} won the match` : 'Match finished as a draw'}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <CalendarClock className="text-brand-teal" />
            <div>
              <p className="text-sm text-muted">Date & Time</p>
              <p className="font-semibold text-copy">{formatDateTime(match.scheduled_at)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <MapPin className="text-brand-teal" />
            <div>
              <p className="text-sm text-muted">Venue</p>
              <p className="font-semibold text-copy">{match.venue ?? 'Venue not provided'}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <StickyNote className="text-brand-teal" />
            <div>
              <p className="text-sm text-muted">Notes</p>
              <p className="font-semibold text-copy">{match.notes ?? 'No additional notes'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}