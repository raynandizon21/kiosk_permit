import React from 'react';

/**
 * Replaces the campus-photo background on the admin login brand panel with
 * a system-themed illustration: a statement of account, an exam permit
 * (checkmark = cleared), and a promissory note, fanned like a stack of
 * printed slips. Pure SVG so it stays on-brand without a stock photo.
 */
export const AdminLoginBrandArt: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 900 1000"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden
  >
    <defs>
      <radialGradient id="aba-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#39ff14" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="aba-sheet" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f3a1c" />
        <stop offset="100%" stopColor="#082711" />
      </linearGradient>
    </defs>

    {/* ambient grid, matches kiosk-dotgrid texture */}
    <pattern id="aba-dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1.3" fill="rgba(167,243,208,0.16)" />
    </pattern>
    <rect width="900" height="1000" fill="url(#aba-dots)" />

    <circle cx="600" cy="420" r="340" fill="url(#aba-glow)" />

    {/* fanned document stack */}
    <g className="aba-float aba-float--slow" transform="translate(430,300) rotate(-11)">
      {/* promissory note (back) */}
      <rect x="0" y="0" width="300" height="380" rx="16" fill="url(#aba-sheet)" stroke="rgba(57,255,20,0.3)" strokeWidth="2" />
      <rect x="32" y="40" width="160" height="14" rx="7" fill="rgba(240,253,244,0.5)" />
      <rect x="32" y="70" width="110" height="10" rx="5" fill="rgba(167,243,208,0.3)" />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} x="32" y={120 + i * 26} width="236" height="8" rx="4" fill="rgba(167,243,208,0.18)" />
      ))}
      <path
        d="M32 300 C 60 280, 80 320, 110 300 S 160 280, 190 300 S 230 316, 250 298"
        fill="none"
        stroke="rgba(57,255,20,0.65)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="32" y="316" width="130" height="8" rx="4" fill="rgba(167,243,208,0.22)" />
    </g>

    <g className="aba-float" transform="translate(300,260) rotate(6)">
      {/* statement of account (front, largest) */}
      <rect x="0" y="0" width="330" height="420" rx="18" fill="url(#aba-sheet)" stroke="rgba(57,255,20,0.45)" strokeWidth="2.5" />
      <rect x="0" y="0" width="330" height="64" rx="18" fill="#0a2e0a" />
      <rect x="28" y="24" width="140" height="16" rx="8" fill="#39ff14" />
      <rect x="28" y="96" width="130" height="12" rx="6" fill="rgba(240,253,244,0.55)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect x="28" y={130 + i * 34} width="160" height="9" rx="4.5" fill="rgba(167,243,208,0.28)" />
          <rect x="250" y={128 + i * 34} width="52" height="12" rx="6" fill="rgba(167,243,208,0.4)" />
        </g>
      ))}
      <line x1="28" y1="352" x2="302" y2="352" stroke="rgba(57,255,20,0.3)" strokeWidth="1.5" />
      <rect x="28" y="368" width="90" height="14" rx="7" fill="rgba(240,253,244,0.6)" />
      <rect x="220" y="366" width="82" height="20" rx="8" fill="#39ff14" />
    </g>

    <g className="aba-float aba-float--fast" transform="translate(520,470) rotate(16)">
      {/* exam permit, cleared */}
      <rect x="0" y="0" width="230" height="150" rx="16" fill="url(#aba-sheet)" stroke="rgba(57,255,20,0.5)" strokeWidth="2.5" />
      <circle cx="46" cy="46" r="22" fill="rgba(57,255,20,0.14)" stroke="rgba(57,255,20,0.5)" strokeWidth="2" />
      <rect x="84" y="30" width="110" height="11" rx="5.5" fill="rgba(240,253,244,0.55)" />
      <rect x="84" y="50" width="80" height="9" rx="4.5" fill="rgba(167,243,208,0.3)" />
      <rect x="28" y="96" width="174" height="8" rx="4" fill="rgba(167,243,208,0.22)" />
      <rect x="28" y="114" width="120" height="8" rx="4" fill="rgba(167,243,208,0.22)" />
      {/* cleared badge */}
      <circle cx="198" cy="118" r="26" fill="#39ff14" />
      <path d="M186 118 l8 8 l16 -18" fill="none" stroke="#06220c" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
