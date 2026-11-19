import React from 'react';

interface LenkyxEdgeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LenkyxEdgeLogoProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg p-0.5',
  sm: 'w-9 h-9 rounded-xl p-1',
  md: 'w-11 h-11 rounded-2xl p-1',
  lg: 'w-14 h-14 rounded-2xl p-1.5',
  hero: 'w-28 h-28 sm:w-32 sm:h-32 rounded-[30px] p-2.5',
};

export const LenkyxEdgeLogo: React.FC<LenkyxEdgeLogoProps> = ({ size = 'sm', className = '' }) => {
  const frameClass = SIZE_MAP[size];
  return (
    <span className={`edge-3d-wrap ${frameClass} ${className}`}>
      <span className="edge-3d-aurora" aria-hidden="true" />
      <span className="edge-3d-badge w-full h-full rounded-[inherit] flex items-center justify-center">
        <img
          src="/covers/icon-edge-3d.png"
          alt="LENKYX 3D"
          className="w-full h-full object-contain edge-3d-img-hue select-none"
          draggable={false}
        />
        <span className="edge-3d-sheen" aria-hidden="true" />
      </span>
    </span>
  );
};
