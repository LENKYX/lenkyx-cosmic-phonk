import React from 'react';

const SNOWFLAKES = [
  { left: '6%', dur: '11s', delay: '0s', size: 5, op: 0.45 },
  { left: '16%', dur: '14s', delay: '-3s', size: 4, op: 0.35 },
  { left: '28%', dur: '9.5s', delay: '-6s', size: 6, op: 0.4 },
  { left: '41%', dur: '13s', delay: '-2s', size: 4, op: 0.32 },
  { left: '54%', dur: '10.5s', delay: '-7s', size: 5, op: 0.42 },
  { left: '67%', dur: '15s', delay: '-4s', size: 4, op: 0.3 },
  { left: '79%', dur: '12s', delay: '-1s', size: 6, op: 0.42 },
  { left: '91%', dur: '10s', delay: '-5s', size: 5, op: 0.38 },
];

export const CosmicSpaceBackdrop: React.FC<{ intense?: boolean; paused?: boolean }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a060d]"
      style={{
        backgroundImage: [
          'radial-gradient(ellipse 80% 50% at 15% 0%, rgba(220, 38, 38, 0.22), transparent 65%)',
          'radial-gradient(ellipse 80% 50% at 88% 4%, rgba(22, 163, 74, 0.22), transparent 65%)',
          'radial-gradient(ellipse 65% 45% at 50% 35%, rgba(234, 179, 8, 0.10), transparent 70%)',
          'radial-gradient(ellipse 75% 40% at 50% 100%, rgba(185, 28, 28, 0.14), transparent 70%)',
        ].join(', '),
      }}
    >
      {/* Subtle Festive Top Garland Glow */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 opacity-75" />

      {/* Gentle Snowfall */}
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
