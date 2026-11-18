import React from 'react';

export const CosmicSpaceBackdrop: React.FC<{ intense?: boolean; paused?: boolean }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-[#05020d]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 45% at 20% 0%, rgba(236,72,153,0.11), transparent 65%), radial-gradient(ellipse 70% 45% at 85% 5%, rgba(56,189,248,0.10), transparent 65%)',
      }}
    />
  );
};
