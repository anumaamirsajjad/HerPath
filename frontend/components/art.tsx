// Inline SVG illustrations. Drawn in code so pages stay light on slow connections.
// Visual language: phulkari embroidery — a stitched thread, star-flowers (bagh), hoops and spools.

type P = { className?: string };

/** Logo mark: a needle trailing a stitched loop. */
export function LogoMark({ className = "h-8 w-8" }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1f2a6b" />
      <path d="M9 27c4-9 11 3 16-6 2.5-4.5 0-9-3-8" fill="none" stroke="#f2a516" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="4 3.2" />
      <path d="M26 9l6-3-2.2 6.4z" fill="#fff" />
      <circle cx="9" cy="27" r="2.4" fill="#d6246e" />
    </svg>
  );
}

/** Phulkari star-flower (bagh): an eight-point star with a diamond heart. */
export function Bagh({ className = "h-10 w-10", petal = "#f2a516", heart = "#d6246e", core = "#fff" }: P & { petal?: string; heart?: string; core?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g transform="translate(24 24)">
        {[0, 45, 90, 135].map((a) => (
          <rect key={a} x="-7" y="-7" width="14" height="14" transform={`rotate(${a}) scale(1.55)`} fill={petal} opacity={a % 90 ? 0.75 : 1} rx="1" />
        ))}
        <rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" fill={heart} rx="1" />
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" fill={core} />
      </g>
    </svg>
  );
}

/** A band of small bagh diamonds, used once per page as a hem. */
export function Hem({ className = "h-3 w-full" }: P) {
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="hem" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 1l5 5-5 5-5-5z" fill="#f2a516" />
          <path d="M12 4l2 2-2 2-2-2z" fill="#d6246e" />
          <path d="M0 6h3M21 6h3" stroke="#1f2a6b" strokeWidth="1.5" strokeDasharray="2 2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hem)" />
    </svg>
  );
}

const HERO_PATH = "M24 176 C 110 190 118 64 214 72 S 350 196 430 124 S 520 28 578 42";
const KNOTS: [number, number, string][] = [[24, 176, "#d6246e"], [214, 72, "#f2a516"], [430, 124, "#1e8a5b"], [578, 42, "#1f2a6b"]];

/** Landing hero: a thread stitches itself from "where you are" to "your scholarship". Mirrored for Urdu. */
export function StitchedPath({ className = "w-full", rtl = false }: P & { rtl?: boolean }) {
  return (
    <svg viewBox="0 0 600 220" className={className} style={rtl ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <defs>
        <mask id="reveal">
          <path d={HERO_PATH} pathLength={1000} fill="none" stroke="#fff" strokeWidth="14" className="sew" style={{ ["--len" as string]: 1000 }} />
        </mask>
      </defs>
      <path d={HERO_PATH} fill="none" stroke="#e3e1ee" strokeWidth="3" className="stitch" />
      <path d={HERO_PATH} fill="none" stroke="#f2a516" strokeWidth="5" className="stitch" mask="url(#reveal)" />
      {KNOTS.map(([x, y, c], i) => (
        <g key={i} className="knot" style={{ animationDelay: `${0.25 + i * 0.68}s` }}>
          <circle cx={x} cy={y} r="13" fill="#fff" stroke={c} strokeWidth="4" />
          <circle cx={x} cy={y} r="5" fill={c} />
        </g>
      ))}
      <path d="M578 42 l18 -16 -5 14 z" fill="#1f2a6b" className="knot" style={{ animationDelay: "2.5s" }} />
    </svg>
  );
}

/** Empty states: an embroidery hoop waiting for its first stitch. */
export function Hoop({ className = "h-24 w-24" }: P) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="50" r="36" fill="#fff" stroke="#c9a46a" strokeWidth="7" />
      <circle cx="48" cy="50" r="30" fill="none" stroke="#e3e1ee" strokeWidth="1.5" />
      <rect x="40" y="6" width="16" height="10" rx="3" fill="#c9a46a" />
      <path d="M26 58c8-14 18 6 26-6s12 2 18-4" fill="none" stroke="#d6246e" strokeWidth="3" className="stitch" style={{ strokeDasharray: "5 4" }} />
      <path d="M70 48l8-9" stroke="#5b5f78" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Loading: a spool of saffron thread. */
export function Spool({ className = "h-10 w-10" }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="9" y="6" width="22" height="4" rx="2" fill="#1f2a6b" />
      <rect x="9" y="30" width="22" height="4" rx="2" fill="#1f2a6b" />
      <rect x="12" y="10" width="16" height="20" fill="#f2a516" />
      {[13, 17, 21, 25].map((y) => <path key={y} d={`M12 ${y}h16`} stroke="#c47f00" strokeWidth="1.2" />)}
      <path d="M28 22c6 2 7 8 2 10" fill="none" stroke="#f2a516" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  );
}

/** Auth and settings pages: a folded phulkari panel. */
export function Panel({ className = "h-full w-full" }: P) {
  const cells = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg viewBox="0 0 240 320" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="240" height="320" fill="#1f2a6b" />
      {cells.map((i) => {
        const x = (i % 3) * 80 + 40, y = Math.floor(i / 3) * 80 + 40;
        const petal = ["#f2a516", "#d6246e", "#1e8a5b"][(i + Math.floor(i / 3)) % 3];
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 45, 90, 135].map((a) => <rect key={a} x="-10" y="-10" width="20" height="20" transform={`rotate(${a}) scale(1.2)`} fill={petal} opacity={a % 90 ? 0.55 : 0.9} />)}
            <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" fill="#fff" opacity=".95" />
            <rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill={petal} />
          </g>
        );
      })}
      <path d="M0 300 C 60 280 120 320 240 290" fill="none" stroke="#f2a516" strokeWidth="4" strokeDasharray="10 8" />
    </svg>
  );
}
