import sponsorLogo from '../assets/payaura-placeholder.svg';

export default function Footer() {
  return (
    <footer className="border-t border-divider">
      <div className="page-shell flex flex-col gap-4 py-6 text-sm text-muted lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p>ETE Sports Carnival.</p>
          <a
            href="https://www.facebook.com/PayAura"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl border border-divider bg-[#131313] px-3 py-2 text-copy hover:border-brand-blue"
          >
            <img src={sponsorLogo} alt="PayAura placeholder logo" className="h-8 w-auto rounded-lg border border-divider bg-[#0f0f0f]" />
            <span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-muted">Title Sponsor</span>
              <span className="font-semibold">PayAura</span>
            </span>
          </a>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-[#141c29] px-4 py-2 text-sm font-semibold text-copy">
          <span aria-hidden="true">❤️</span>
          <span>Made with love: T.H. Zidan - 2104010</span>
        </div>
      </div>
    </footer>
  );
}