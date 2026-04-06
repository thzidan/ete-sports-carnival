import { Clock3, MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime, getStatusTone } from '../utils/formatters';

export default function MatchCard({ match }) {
  const isLive = match.status === 'live';

  return (
    <Link
      to={`/match/${match.id}`}
      className={`card block ${isLive ? 'accent-border card-glow' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted">
            {match.sport?.icon ? `${match.sport.icon} ` : ''}
            {match.sport?.name ?? 'Sport'}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-copy">
            {match.team1?.name ?? 'TBD'} vs {match.team2?.name ?? 'TBD'}
          </h3>
        </div>

        <span className={`status-pill ${getStatusTone(match.status)}`}>
          {isLive ? <Radio size={12} className="animate-pulse" /> : null}
          {match.status}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Clock3 size={16} />
          <span>{formatDateTime(match.scheduled_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{match.venue ?? 'Venue to be announced'}</span>
        </div>
      </div>
    </Link>
  );
}
