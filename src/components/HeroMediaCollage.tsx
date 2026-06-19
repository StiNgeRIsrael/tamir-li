import { cn } from "@/lib/utils";

/** Decorative SVG collage — image, video, audio, document — no external assets. */
export function HeroMediaCollage({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[400px]", className)} aria-hidden>
      <div className="absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-tool-image/25 via-tool-video/20 to-tool-document/25 blur-3xl" />
      <svg viewBox="0 0 420 320" className="relative h-auto w-full animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hm-img" x1="48" y1="40" x2="220" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(187, 85%, 52%)" />
            <stop offset="1" stopColor="hsl(271, 82%, 55%)" />
          </linearGradient>
          <linearGradient id="hm-vid" x1="200" y1="120" x2="380" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(271, 82%, 62%)" />
            <stop offset="1" stopColor="hsl(330, 85%, 58%)" />
          </linearGradient>
          <linearGradient id="hm-doc" x1="20" y1="180" x2="200" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(32, 95%, 58%)" />
            <stop offset="1" stopColor="hsl(16, 90%, 52%)" />
          </linearGradient>
          <linearGradient id="hm-wave" x1="240" y1="60" x2="400" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(330, 85%, 62%)" />
            <stop offset="1" stopColor="hsl(199, 89%, 55%)" />
          </linearGradient>
          <filter id="hm-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Document card — back */}
        <g filter="url(#hm-shadow)">
          <rect x="24" y="168" width="168" height="128" rx="14" fill="url(#hm-doc)" opacity="0.95" />
          <rect x="44" y="192" width="88" height="10" rx="3" fill="white" fillOpacity="0.35" />
          <rect x="44" y="212" width="120" height="8" rx="3" fill="white" fillOpacity="0.22" />
          <rect x="44" y="230" width="72" height="8" rx="3" fill="white" fillOpacity="0.22" />
        </g>

        {/* Video card — middle */}
        <g filter="url(#hm-shadow)">
          <rect x="188" y="96" width="200" height="132" rx="16" fill="url(#hm-vid)" opacity="0.98" />
          <circle cx="288" cy="162" r="28" fill="white" fillOpacity="0.2" />
          <path d="M278 152 L278 176 L302 164 Z" fill="white" fillOpacity="0.9" />
        </g>

        {/* Image card — front */}
        <g filter="url(#hm-shadow)">
          <rect x="56" y="32" width="200" height="150" rx="18" fill="url(#hm-img)" />
          <path d="M56 130 L120 78 L168 112 L230 64 L256 90 L256 182 H56 Z" fill="black" fillOpacity="0.12" />
          <circle cx="108" cy="72" r="14" fill="white" fillOpacity="0.35" />
        </g>

        {/* Audio waveform accent */}
        <g opacity="0.9">
          <path
            d="M248 44 Q260 28 272 44 T296 44 T320 36 T344 48"
            stroke="url(#hm-wave)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M252 58 Q268 70 284 58 T316 62"
            stroke="url(#hm-wave)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </g>
      </svg>
    </div>
  );
}
