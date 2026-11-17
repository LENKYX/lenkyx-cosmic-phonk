import React from 'react';

export type JblLightTheme = 'partybox' | 'aurora' | 'cosmic';

interface Props {
  enabled: boolean;
  isPlaying: boolean;
  dimForVideo: boolean;
  theme: JblLightTheme;
}

export const JblLightShowOverlay: React.FC<Props> = ({ enabled, isPlaying, dimForVideo, theme }) => {
  if (!enabled || !isPlaying || dimForVideo) return null;

  const palette =
    theme === 'aurora'
      ? { c1: '#22d3ee', c2: '#34d399', c3: '#818cf8' }
      : theme === 'cosmic'
      ? { c1: '#a855f7', c2: '#ec4899', c3: '#38bdf8' }
      : { c1: '#ff2ea6', c2: '#00f5d4', c3: '#ffbe0b' };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* JBL PartyBox Reactive Edge Glow Frame */}
      <div
        className="absolute inset-0 opacity-70 animate-pulse"
        style={{
          boxShadow: `inset 0 0 65px ${palette.c1}55, inset 0 0 120px ${palette.c2}35`,
        }}
      />

      {/* Left & Right Vertical JBL LED Light Strips */}
      <div
        className="absolute left-0 top-12 bottom-20 w-1.5 rounded-r-full blur-[1px] opacity-85 animate-pulse"
        style={{
          background: `linear-gradient(180deg, ${palette.c1}, ${palette.c2}, ${palette.c3}, ${palette.c1})`,
          boxShadow: `0 0 24px ${palette.c1}`,
        }}
      />
      <div
        className="absolute right-0 top-12 bottom-20 w-1.5 rounded-l-full blur-[1px] opacity-85 animate-pulse"
        style={{
          background: `linear-gradient(180deg, ${palette.c2}, ${palette.c3}, ${palette.c1}, ${palette.c2})`,
          boxShadow: `0 0 24px ${palette.c2}`,
        }}
      />

      {/* Floating JBL Pulse 5 Speaker LED Rings (Corner Auras) */}
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-48 rounded-full blur-[70px] opacity-40 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${palette.c1} 0%, ${palette.c2} 50%, transparent 75%)`,
        }}
      />
      <div
        className="hidden sm:block absolute top-16 right-8 w-44 h-44 rounded-full border-2 opacity-30 animate-spin-slow"
        style={{
          borderColor: `${palette.c2}88`,
          boxShadow: `0 0 35px ${palette.c1}55, inset 0 0 35px ${palette.c2}44`,
        }}
      />
      <div
        className="hidden sm:block absolute bottom-28 left-64 w-36 h-36 rounded-full border-2 opacity-25 animate-spin-slow"
        style={{
          borderColor: `${palette.c1}88`,
          boxShadow: `0 0 30px ${palette.c3}55`,
        }}
      />
    </div>
  );
};
