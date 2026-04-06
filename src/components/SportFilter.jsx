import { slugify } from '../utils/formatters';

export default function SportFilter({ sports = [], activeSport = 'all', onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          activeSport === 'all'
            ? 'border border-brand-blue bg-brand-blue text-copy'
            : 'border border-divider bg-[#141414] text-copy hover:border-brand-blue'
        }`}
      >
        All
      </button>
      {sports.map((sport) => {
        const sportKey = slugify(sport.name);

        return (
          <button
            key={sport.id}
            type="button"
            onClick={() => onChange(sportKey)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeSport === sportKey
                ? 'border border-brand-blue bg-brand-blue text-copy'
                : 'border border-divider bg-[#141414] text-copy hover:border-brand-blue'
            }`}
          >
            {sport.name}
          </button>
        );
      })}
    </div>
  );
}