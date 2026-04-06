export default function StatBadge({ label, value, subtle = false }) {
  return (
    <div className={`rounded-2xl border border-divider px-4 py-3 ${subtle ? 'bg-[#141414]' : 'bg-surface'}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-copy">{value}</p>
    </div>
  );
}
