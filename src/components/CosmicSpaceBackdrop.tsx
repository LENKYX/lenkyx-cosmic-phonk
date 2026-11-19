import React from 'react';

export const CosmicSpaceBackdrop: React.FC<{ intense?: boolean; paused?: boolean }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-[#100a28]"
      style={{
        backgroundImage: [
          'radial-gradient(ellipse 85% 55% at 18% 0%, rgba(236,72,153,0.24), transparent 65%)',
          'radial-gradient(ellipse 80% 55% at 85% 5%, rgba(56,189,248,0.24), transparent 65%)',
          'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(139,92,246,0.20), transparent 70%)',
          'radial-gradient(ellipse 65% 40% at 50% 100%, rgba(16,185,129,0.12), transparent 68%)',
        ].join(', '),
      }}
    />
  );
};
