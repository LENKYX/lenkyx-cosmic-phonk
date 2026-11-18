import React from 'react';
import { getCosmicMascotById } from '../utils/alienCollection';

interface CosmicMascotBadgeProps {
  id: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CosmicMascotBadge: React.FC<CosmicMascotBadgeProps> = ({
  id,
  size = 'md',
  showLabel = false,
}) => {
  const m = getCosmicMascotById(id);
  const px =
    size === 'xs'
      ? 'w-7 h-7'
      : size === 'sm'
        ? 'w-10 h-10'
        : size === 'lg'
          ? 'w-24 h-24'
          : 'w-14 h-14';

  const rarityStyle =
    m.rarity === 'Mítico'
      ? 'text-amber-300 border-amber-400/60 bg-amber-500/15'
      : m.rarity === 'Épico'
        ? 'text-fuchsia-300 border-fuchsia-400/60 bg-fuchsia-500/15'
        : m.rarity === 'Raro'
          ? 'text-cyan-300 border-cyan-400/60 bg-cyan-500/15'
          : 'text-emerald-300 border-emerald-400/50 bg-emerald-500/15';

  return (
    <div className="inline-flex flex-col items-center gap-1" title={`${m.name} (${m.code}) · ${m.rarity} · ${m.accessoryLabel}`}>
      <div
        className={`${px} relative rounded-2xl flex items-center justify-center bg-[#090418] border border-white/20 shadow-lg overflow-hidden shrink-0`}
        style={{ boxShadow: `0 0 18px ${m.auraColor}55` }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          <defs>
            <radialGradient id={`bg-${m.id}-${size}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={m.auraColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor="#070312" stopOpacity="0.95" />
            </radialGradient>
            <linearGradient id={`skin-${m.id}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={m.skinPrimary} />
              <stop offset="100%" stopColor={m.skinSecondary} />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="46" fill={`url(#bg-${m.id}-${size})`} />

          {/* Antenna */}
          <line x1="50" y1="22" x2="50" y2="9" stroke={m.visorColor} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="8" r="4.5" fill={m.visorColor} />

          {/* Headphones / Cosmic Gear */}
          {m.accessory === 'headphones' && (
            <>
              <path d="M23 48 C23 23, 77 23, 77 48" fill="none" stroke={m.visorColor} strokeWidth="5" strokeLinecap="round" />
              <rect x="17" y="42" width="10" height="19" rx="4" fill={m.visorColor} />
              <rect x="73" y="42" width="10" height="19" rx="4" fill={m.visorColor} />
            </>
          )}

          {/* Alien Head */}
          <path
            d="M50 20 C72 20 79 38 74 56 C70 70 59 78 50 78 C41 78 30 70 26 56 C21 38 28 20 50 20 Z"
            fill={`url(#skin-${m.id}-${size})`}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
          />

          {/* Futuristic Visor Eyes */}
          <ellipse cx="38" cy="48" rx="9" ry="6.5" transform="rotate(-14 38 48)" fill="#070414" stroke={m.visorColor} strokeWidth="2" />
          <ellipse cx="62" cy="48" rx="9" ry="6.5" transform="rotate(14 62 48)" fill="#070414" stroke={m.visorColor} strokeWidth="2" />
          <circle cx="36" cy="46" r="2.2" fill={m.visorColor} />
          <circle cx="60" cy="46" r="2.2" fill={m.visorColor} />

          {/* Smile */}
          <path d="M43 62 Q50 67 57 62" fill="none" stroke="#070414" strokeWidth="2.8" strokeLinecap="round" />

          {/* Body / Cosmic Suit */}
          <path
            d="M32 76 Q50 82 68 76 L73 94 L27 94 Z"
            fill="#140b2e"
            stroke={m.visorColor}
            strokeWidth="2"
          />

          {/* Musical Accessory Icon */}
          {m.accessory === 'subwoofer' && (
            <g>
              <circle cx="50" cy="86" r="6.5" fill="#070414" stroke={m.visorColor} strokeWidth="2" />
              <circle cx="50" cy="86" r="2.5" fill={m.skinPrimary} />
            </g>
          )}
          {m.accessory === 'mic' && (
            <g>
              <circle cx="76" cy="74" r="5" fill={m.visorColor} />
              <line x1="76" y1="79" x2="72" y2="91" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}
          {m.accessory === 'keytar' && (
            <rect x="35" y="81" width="30" height="8" rx="2" fill={m.visorColor} />
          )}
          {m.accessory === 'turntable' && (
            <g>
              <circle cx="50" cy="86" r="6" fill={m.visorColor} />
              <circle cx="50" cy="86" r="2" fill="#070414" />
            </g>
          )}
        </svg>
      </div>

      {showLabel && (
        <div className="text-center space-y-0.5">
          <div className="text-[11px] font-black text-white leading-tight">{m.name}</div>
          <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${rarityStyle}`}>
            {m.code} · {m.rarity}
          </div>
        </div>
      )}
    </div>
  );
};
