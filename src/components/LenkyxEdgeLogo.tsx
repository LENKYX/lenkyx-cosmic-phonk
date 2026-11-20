import React from 'react';

interface LenkyxEdgeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LenkyxEdgeLogoProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-11 h-11 rounded-2xl',
  lg: 'w-16 h-16 rounded-2xl',
  hero: 'w-40 h-40 sm:w-48 sm:h-48 rounded-[36px]',
};

export const LenkyxEdgeLogo: React.FC<LenkyxEdgeLogoProps> = ({ size = 'sm', className = '' }) => {
  const frameClass = SIZE_MAP[size];
  return (
    <span className={`edge-3d-wrap ${frameClass} ${className}`}>
      <span className="edge-3d-aurora" aria-hidden="true" />
      <span className="edge-3d-badge w-full h-full rounded-[inherit] flex items-center justify-center">
        <img
          src="/covers/morro-gold-logo.png"
          alt="MORRO GOLD"
          className="w-full h-full object-cover edge-3d-img-hue select-none"
          draggable={false}
        />
        <span className="edge-3d-sheen" aria-hidden="true" />
      </span>
    </span>
  );
};
