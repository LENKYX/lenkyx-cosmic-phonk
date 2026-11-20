import React from 'react';

const SNOWFLAKES = [
  { left: '8%', dur: '12s', delay: '0s', size: 4, op: 0.3 },
  { left: '24%', dur: '15s', delay: '-4s', size: 3, op: 0.25 },
  { left: '42%', dur: '10.5s', delay: '-2s', size: 4, op: 0.3 },
  { left: '61%', dur: '13.5s', delay: '-6s', size: 3, op: 0.28 },
  { left: '78%', dur: '11s', delay: '-1s', size: 4, op: 0.3 },
  { left: '92%', dur: '14s', delay: '-5s', size: 3, op: 0.24 },
];

export const CosmicSpaceBackdrop: React.FC<{ intense?: boolean; paused?: boolean }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#04050a]"
      style={{
        backgroundImage: [
          'radial-gradient(ellipse 75% 48% at 15% 4%, rgba(245, 200, 76, 0.14), transparent 62%)',
          'radial-gradient(ellipse 70% 45% at 88% 8%, rgba(34, 211, 238, 0.13), transparent 62%)',
          'radial-gradient(ellipse 60% 40% at 50% 48%, rgba(212, 175, 55, 0.08), transparent 68%)',
          'radial-gradient(ellipse 70% 40% at 20% 95%, rgba(16, 185, 129, 0.09), transparent 65%)',
        ].join(', '),
      }}
    >
      {/* Atmospheric Favela Night Skyline & Luxury Cars/Bikes Backdrop */}
      <img
        src="/covers/favela-night-skyline.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.14] mix-blend-screen scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#04050a]/80 via-[#04050a]/75 to-[#04050a]/95" />

      {/* Futuristic Cyber-Robot Circuit Grid */}
      <div
        className="absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(212,175,55,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.16) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 92% 85% at 50% 35%, black 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 92% 85% at 50% 35%, black 35%, transparent 100%)',
        }}
      />

      {/* Favela Street-Art Graffiti Layer (Spray Tags + Neon Murals) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.11] select-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="grafCyanPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
          <linearGradient id="grafBr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Spray Paint Splashes */}
        <circle cx="190" cy="180" r="110" fill="#ec4899" opacity="0.22" />
        <circle cx="1240" cy="240" r="140" fill="#00f5ff" opacity="0.2" />
        <circle cx="960" cy="760" r="160" fill="#facc15" opacity="0.16" />

        {/* Stylized Street Graffiti Typography */}
        <text
          x="90"
          y="230"
          transform="rotate(-11 90 230)"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="118"
          letterSpacing="6"
          fill="none"
          stroke="url(#grafCyanPink)"
          strokeWidth="5"
        >
          FAVELA
        </text>
        <text
          x="940"
          y="780"
          transform="rotate(-7 940 780)"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="110"
          letterSpacing="8"
          fill="none"
          stroke="url(#grafBr)"
          strokeWidth="5"
        >
          OS CRIA
        </text>
        <text
          x="1050"
          y="175"
          transform="rotate(9 1050 175)"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="74"
          fill="url(#grafBr)"
          opacity="0.45"
        >
          BRASIL 100%
        </text>

        {/* Graffiti Drip Lines */}
        <path
          d="M110 245 v38 M180 235 v52 M295 215 v44 M1010 795 v42 M1150 785 v55"
          stroke="url(#grafCyanPink)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Robotic Top Laser Telemetry Bar */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-400 via-pink-500 to-emerald-400 opacity-90 shadow-[0_0_16px_rgba(34,211,238,0.85)]" />

      {/* Moving HUD Scanline */}
      <div className="robot-hud-scanline" aria-hidden="true" />

      {/* Light Festive Snow Particles */}
      {SNOWFLAKES.map((sf, i) => (
        <span
          key={i}
          className="christmas-snowflake"
          style={{
            left: sf.left,
            width: `${sf.size}px`,
            height: `${sf.size}px`,
            opacity: sf.op,
            animationDuration: sf.dur,
            animationDelay: sf.delay,
          }}
        />
      ))}
    </div>
  );
};
