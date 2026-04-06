import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, Flame, Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeaderboardCard from '../components/LeaderboardCard';
import MatchCard from '../components/MatchCard';
import logo from '../assets/ete-sports-carnival-logo.svg';
import { useStore } from '../store/useStore';
import { supabase } from '../supabaseClient';
import { MATCH_SELECT, STANDINGS_SELECT } from '../utils/selects';
import { buildOverallLeaderboard, buildSportLeaders } from '../utils/standings';
import { formatDateTime } from '../utils/formatters';

export default function Dashboard() {
  const sports = useStore((state) => state.sports);
  const [state, setState] = useState({
    loading: true,
    error: '',
    leaderboard: [],
    liveMatches: [],
    upcomingMatches: [],
    lastResult: null,
    sportLeaders: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }));

        const [standingsResponse, matchesResponse, lastResultResponse] = await Promise.all([
          supabase.from('standings').select(STANDINGS_SELECT).order('points', { ascending: false }),
          supabase.from('matches').select(MATCH_SELECT).in('status', ['live', 'upcoming']).order('scheduled_at', { ascending: true }),
          supabase.from('matches').select(MATCH_SELECT).eq('status', 'completed').order('scheduled_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (standingsResponse.error) throw standingsResponse.error;
        if (matchesResponse.error) throw matchesResponse.error;
        if (lastResultResponse.error) throw lastResultResponse.error;

        const allMatches = matchesResponse.data ?? [];
        const leaderboard = buildOverallLeaderboard(standingsResponse.data ?? []);
        const sportLeaders = buildSportLeaders(sports, standingsResponse.data ?? []);

        setState({
          loading: false,
          error: '',
          leaderboard,
          liveMatches: allMatches.filter((match) => match.status === 'live'),
          upcomingMatches: allMatches.filter((match) => match.status === 'upcoming').slice(0, 3),
          lastResult: lastResultResponse.data ?? null,
          sportLeaders,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message ?? 'Failed to load dashboard data.',
        }));
      }
    };

    void fetchDashboardData();

    const channel = supabase
      .channel('dashboard-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        void fetchDashboardData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sports]);

  const heroLeader = state.leaderboard[0];

  return (
    <div className="space-y-10 pb-8">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="card border-brand-blue/20 p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[210px_1fr]">
            <div className="mx-auto w-full max-w-[190px] lg:max-w-[210px]">
              <img src={logo} alt="ETE Sports Carnival logo" className="w-full object-contain" />
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-muted">Inter-Series Championship</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-copy sm:text-5xl">ETE Sports Carnival</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                Let the spirit of sports flow through us, uniting the entire ETE family in passion and pride. Together we celebrate strength, teamwork, and unity, organized by ETE '21.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/scoreboard" className="primary-button gap-2">
                  See Full Scoreboard
                  <ArrowRight size={16} />
                </Link>
                <Link to="/auction" className="secondary-button">
                  Watch Auction Live
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-brand-blue/20 bg-[#121821] p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-muted">Current leader</p>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-copy">{heroLeader?.team?.name ?? 'Awaiting standings'}</h2>
              <p className="mt-2 text-sm text-muted">
                {heroLeader ? `${heroLeader.points} pts across all sports` : 'Complete a match to crown the early pace-setter.'}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-blue/30 bg-[#162033] p-3 text-brand-blue">
              <Trophy size={24} />
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-canvas/70 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Points</p>
              <p className="mt-2 text-2xl font-bold text-copy">{heroLeader?.points ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-canvas/70 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Wins</p>
              <p className="mt-2 text-2xl font-bold text-copy">{heroLeader?.wins ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-canvas/70 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Played</p>
              <p className="mt-2 text-2xl font-bold text-copy">{heroLeader?.matches_played ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      {state.error ? <div className="card border-danger/40 text-sm text-red-300">{state.error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-heading">Overall Leaderboard</h2>
              <p className="section-copy">Total points aggregated across every sport.</p>
            </div>
            <Link to="/scoreboard" className="secondary-button hidden sm:inline-flex">
              See Full Scoreboard
            </Link>
          </div>

          <div className="space-y-3">
            {(state.leaderboard.length ? state.leaderboard : [1, 2, 3]).map((entry, index) =>
              typeof entry === 'number' ? (
                <div key={entry} className="card h-20 animate-pulse bg-[#151515]" />
              ) : (
                <LeaderboardCard key={entry.team?.id ?? index} entry={entry} rank={index + 1} />
              ),
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="section-heading">Live / Upcoming Matches</h2>
                <p className="section-copy">Live games stay pinned on top, followed by the next three fixtures.</p>
              </div>
              <Flame className="text-brand-teal" />
            </div>

            <div className="mt-4 grid gap-4">
              {state.liveMatches.length ? (
                state.liveMatches.map((match) => <MatchCard key={match.id} match={match} />)
              ) : (
                <div className="card text-sm text-muted">No live matches right now.</div>
              )}

              {state.upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="section-heading">Last Result</h2>
                <p className="section-copy">The most recently completed fixture.</p>
              </div>
              <Medal className="text-brand-teal" />
            </div>

            {state.lastResult ? (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-muted">
                    {state.lastResult.sport?.icon ? `${state.lastResult.sport.icon} ` : ''}
                    {state.lastResult.sport?.name}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-copy">
                    {state.lastResult.team1?.name} {state.lastResult.team1_score ? `(${state.lastResult.team1_score})` : ''} vs{' '}
                    {state.lastResult.team2?.name} {state.lastResult.team2_score ? `(${state.lastResult.team2_score})` : ''}
                  </h3>
                </div>
                <div className="inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal">
                  {state.lastResult.winner?.name ? `${state.lastResult.winner.name} won` : 'Match drawn'}
                </div>
                <p className="text-sm text-muted">{formatDateTime(state.lastResult.scheduled_at)}</p>
                <Link to="/match-history" className="secondary-button inline-flex">
                  View All Results
                </Link>
              </div>
            ) : (
              <div className="mt-5 text-sm text-muted">No results have been recorded yet.</div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-heading">Sport-wise Points Summary</h2>
            <p className="section-copy">Each card highlights the current top team in that sport.</p>
          </div>
          <CalendarClock className="hidden text-brand-teal sm:block" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.sportLeaders.map(({ sport, leader }) => (
            <Link key={sport.id} to={`/scoreboard?sport=${sport.name.toLowerCase()}`} className="card group">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">
                {sport.icon ? `${sport.icon} ` : ''}
                {sport.name}
              </p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-copy">{leader?.team?.name ?? 'No leader yet'}</h3>
                  <p className="mt-2 text-sm text-muted">{leader?.points ?? 0} points</p>
                </div>
                <div className="rounded-full border border-brand-blue/30 bg-[#141c29] px-3 py-2 text-sm font-semibold text-[#b9d6ff]">
                  Top Team
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}