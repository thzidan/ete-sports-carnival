import { Trophy } from 'lucide-react';
import { getRankTone } from '../utils/formatters';

export default function LeaderboardCard({ entry, rank }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-divider bg-[#141414] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getRankTone(rank)}`}>
          {rank}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-copy">{entry.team?.name ?? 'Unknown Team'}</p>
          <p className="text-sm text-muted">
            {entry.wins}W / {entry.losses}L / {entry.draws}D
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
        <Trophy size={16} className="text-brand-lime" />
        <span className="text-lg font-bold text-copy">{entry.points}</span>
      </div>
    </div>
  );
}
