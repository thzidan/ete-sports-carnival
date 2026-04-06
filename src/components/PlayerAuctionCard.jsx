import { Coins, UserCircle2 } from 'lucide-react';
import { formatCurrency, getPositionTone } from '../utils/formatters';

function PlayerPhoto({ player, compact }) {
  if (player.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={`h-full w-full object-cover ${compact ? '' : 'max-h-72'}`}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#141414]">
      <UserCircle2 className={compact ? 'h-10 w-10 text-muted' : 'h-28 w-28 text-muted'} />
    </div>
  );
}

function formatSeriesLabel(series) {
  if (!series) {
    return 'Series TBD';
  }

  return /series/i.test(series) ? series : `${series} Series`;
}

export default function PlayerAuctionCard({ player, compact = false }) {
  if (compact) {
    return (
      <div className="card p-3.5">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3.5">
          <div className="h-24 w-[72px] overflow-hidden rounded-2xl border border-divider bg-[#141414]">
            <PlayerPhoto player={player} compact />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-none text-brand-teal">{formatSeriesLabel(player.series)}</p>
                <h3 className="mt-1 text-[2rem] font-bold leading-[0.92] text-copy break-words">{player.name}</h3>
              </div>
              <div className={`status-pill shrink-0 px-2.5 py-1 text-[10px] ${getPositionTone(player.position)}`}>
                {player.position}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <div className="min-w-[118px] rounded-2xl border border-brand-teal/30 bg-brand-teal/10 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-teal">Sold</p>
                <p className="mt-1 text-xl font-bold leading-none text-copy">{formatCurrency(player.sold_price)}</p>
              </div>

              {player.team?.name ? (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-brand-teal px-3 py-2 text-sm font-semibold text-black">
                  <Coins size={14} className="shrink-0" />
                  <span className="max-w-[220px] break-words leading-tight">{player.team.name}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${player.status === 'sold' ? '' : 'card-glow'}`}>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="flex min-h-[18rem] items-center justify-center overflow-hidden rounded-2xl border border-divider bg-[#141414]">
          <PlayerPhoto player={player} compact={false} />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted">{player.series}</p>
            <h3 className="text-3xl font-bold text-copy">{player.name}</h3>
          </div>

          <div className={`status-pill ${getPositionTone(player.position)}`}>{player.position}</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-canvas px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Base Price</p>
              <p className="mt-1 text-lg font-semibold text-copy">{formatCurrency(player.base_price)}</p>
            </div>
            {player.sold_price ? (
              <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-teal">Sold Price</p>
                <p className="mt-1 text-lg font-semibold text-copy">{formatCurrency(player.sold_price)}</p>
              </div>
            ) : null}
          </div>

          {player.team?.name ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-3 py-2 text-sm font-semibold text-black">
              <Coins size={15} />
              {player.team.name}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}