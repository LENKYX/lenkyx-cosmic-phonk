import React from 'react';

interface LenkyxEdgeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LenkyxEdgeLogoProps['size']>, string> = {
  xs: 'w-8 h-8',
  sm: 'w-11 h-11',
  md: 'w-14 h-14',
  lg: 'w-[72px] h-[72px]',
  hero: 'w-52 h-52 sm:w-64 sm:h-64',
};

export const LenkyxEdgeLogo: React.FC<LenkyxEdgeLogoProps> = ({ size = 'sm', className = '' }) => {
  const frameClass = SIZE_MAP[size];
  const isHero = size === 'hero';
  return (
    <span className={`edge-3d-wrap ${frameClass} ${isHero ? 'edge-3d-hero-stage' : ''} ${className}`}>
      {isHero && (
        <>
          <span className="edge-vip-halo-diamond" aria-hidden="true" />
          <span className="edge-vip-halo-gold" aria-hidden="true" />
          <span className="edge-3d-floor-glow" aria-hidden="true" />
        </>
      )}
      <span className={`edge-3d-emblem-3d ${isHero ? 'edge-3d-spin-hero' : 'edge-3d-spin-mini'}`}>
        <img
          src="/covers/morro-gold-emblema-grosso.png"
          alt="MORRO GOLD"
          className="w-full h-full object-contain edge-3d-img-hue select-none"
          draggable={false}
        />
      </span>
    </span>
  );
};
