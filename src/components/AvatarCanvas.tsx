import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarCanvasProps {
  avatar: AvatarConfig;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AURA_BACKGROUNDS: Record<AvatarConfig['auraStyle'], string> = {
  sky: 'from-sky-300 via-blue-200 to-indigo-200',
  lavender: 'from-purple-300 via-fuchsia-200 to-sky-200',
  sunset: 'from-amber-200 via-rose-200 to-purple-200',
  mint: 'from-emerald-200 via-teal-200 to-sky-200',
  galaxy: 'from-indigo-400 via-violet-300 to-fuchsia-300',
};

const SIZE_MAP = {
  sm: 'w-11 h-11',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  avatar,
  level = 1,
  size = 'md',
  className = '',
}) => {
  const auraClass = AURA_BACKGROUNDS[avatar.auraStyle] || AURA_BACKGROUNDS.sky;
  const outfit = avatar.outfitColor || '#59B4FF';

  const headFill =
    avatar.character === 'fox'
      ? '#FB923C'
      : avatar.character === 'bunny'
      ? '#FFF5F8'
      : avatar.character === 'bear'
      ? '#C0855D'
      : avatar.character === 'cat'
      ? '#CBD5E1'
      : avatar.character === 'dino'
      ? '#4ADE80'
      : avatar.character === 'panda'
      ? '#FFFFFF'
      : avatar.character === 'unicorn'
      ? '#FDF4FF'
      : '#FDE6D8';

  return (
    <div
      className={`relative rounded-full bg-gradient-to-br ${auraClass} p-1 shadow-md flex items-center justify-center shrink-0 ${SIZE_MAP[size]} ${className}`}
    >
      {level >= 3 && (
        <div
          className="absolute inset-0 rounded-full ring-2 ring-white/80 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <svg
        viewBox="0 0 120 120"
        className="w-full h-full rounded-full overflow-visible"
        aria-label={`อวตาร ${avatar.character}`}
      >
        <defs>
          <radialGradient id={`face-${avatar.character}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fairy Wings behind body */}
        {avatar.accessory === 'wings' && (
          <g opacity="0.92">
            <path
              d="M34 75 C10 50 8 85 28 92 C16 98 18 112 36 102 Z"
              fill="#E9D5FF"
              stroke="#C084FC"
              strokeWidth="2"
            />
            <path
              d="M86 75 C110 50 112 85 92 92 C104 98 102 112 84 102 Z"
              fill="#E9D5FF"
              stroke="#C084FC"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Superhero Cape behind body */}
        {avatar.accessory === 'cape' && (
          <path
            d="M25 84 Q60 72 95 84 L104 114 Q60 120 16 114 Z"
            fill="#EF4444"
            opacity="0.92"
          />
        )}

        {/* Ears / Character Top Silhouettes */}
        {avatar.character === 'bunny' && (
          <g>
            <ellipse cx="42" cy="24" rx="9" ry="20" transform="rotate(-10 42 24)" fill="#FFF5F8" stroke="#E2E8F0" strokeWidth="1.5" />
            <ellipse cx="42" cy="25" rx="4.5" ry="13" transform="rotate(-10 42 25)" fill="#FDA4AF" />
            <ellipse cx="78" cy="24" rx="9" ry="20" transform="rotate(10 78 24)" fill="#FFF5F8" stroke="#E2E8F0" strokeWidth="1.5" />
            <ellipse cx="78" cy="25" rx="4.5" ry="13" transform="rotate(10 78 25)" fill="#FDA4AF" />
          </g>
        )}

        {avatar.character === 'fox' && (
          <g>
            <polygon points="28,50 34,20 53,37" fill="#FB923C" />
            <polygon points="33,44 36,26 48,37" fill="#FEF3C7" />
            <polygon points="92,50 86,20 67,37" fill="#FB923C" />
            <polygon points="87,44 84,26 72,37" fill="#FEF3C7" />
          </g>
        )}

        {avatar.character === 'bear' && (
          <g>
            <circle cx="34" cy="36" r="12" fill="#B47B56" />
            <circle cx="34" cy="36" r="6.5" fill="#FDE68A" opacity="0.7" />
            <circle cx="86" cy="36" r="12" fill="#B47B56" />
            <circle cx="86" cy="36" r="6.5" fill="#FDE68A" opacity="0.7" />
          </g>
        )}

        {avatar.character === 'panda' && (
          <g>
            <circle cx="35" cy="35" r="11.5" fill="#1E293B" />
            <circle cx="85" cy="35" r="11.5" fill="#1E293B" />
          </g>
        )}

        {avatar.character === 'cat' && (
          <g>
            <polygon points="30,48 33,22 52,36" fill="#94A3B8" />
            <polygon points="34,43 36,27 47,36" fill="#FBCFE8" />
            <polygon points="90,48 87,22 68,36" fill="#94A3B8" />
            <polygon points="86,43 84,27 73,36" fill="#FBCFE8" />
          </g>
        )}

        {avatar.character === 'dino' && (
          <g>
            <path d="M52 24 L60 12 L68 24 Z" fill="#F59E0B" />
            <path d="M36 31 L40 19 L49 27 Z" fill="#F59E0B" />
            <path d="M84 31 L80 19 L71 27 Z" fill="#F59E0B" />
          </g>
        )}

        {avatar.character === 'unicorn' && (
          <g>
            <polygon points="32,46 37,24 51,36" fill="#F5D0FE" />
            <polygon points="88,46 83,24 69,36" fill="#F5D0FE" />
            {/* Unicorn Horn */}
            <path d="M55 31 L60 10 L65 31 Z" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.2" />
            <path d="M57 25 L63 23 M58 19 L62 17" stroke="#F59E0B" strokeWidth="1.3" />
          </g>
        )}

        {avatar.character === 'astronaut' && (
          <circle
            cx="60"
            cy="58"
            r="35"
            fill="#E0F2FE"
            fillOpacity="0.45"
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        )}

        {/* Outfit / Shoulders */}
        <path
          d="M28 112 C28 90 42 82 60 82 C78 82 92 90 92 112 Z"
          fill={outfit}
        />
        <path
          d="M48 83 Q60 92 72 83"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Scarf on neck */}
        {avatar.accessory === 'scarf' && (
          <g>
            <path
              d="M36 80 Q60 93 84 80 Q86 88 80 91 Q60 100 40 91 Q34 88 36 80 Z"
              fill="#F43F5E"
            />
            <path d="M68 89 L76 108 L63 109 L60 92 Z" fill="#E11D48" />
          </g>
        )}

        {/* Gold Medal on chest */}
        {avatar.accessory === 'medal' && (
          <g>
            <path d="M46 83 L60 96 L74 83" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="99" r="7.5" fill="#FACC15" stroke="#F59E0B" strokeWidth="1.5" />
            <polygon points="60,94 61.5,97.5 65,97.5 62,99.8 63,103 60,101 57,103 58,99.8 55,97.5 58.5,97.5" fill="#FFFBEB" />
          </g>
        )}

        {/* Head Base */}
        <circle cx="60" cy="58" r="28" fill={headFill} stroke={avatar.character === 'panda' ? '#E2E8F0' : 'none'} strokeWidth="1.2" />

        {/* Character Face Markings */}
        {avatar.character === 'fox' && (
          <path
            d="M34 62 Q46 56 60 66 Q74 56 86 62 Q82 84 60 86 Q38 84 34 62 Z"
            fill="#FFFBEB"
          />
        )}
        {avatar.character === 'bear' && (
          <ellipse cx="60" cy="67" rx="12" ry="9" fill="#FDE68A" opacity="0.85" />
        )}
        {avatar.character === 'panda' && (
          <g>
            <ellipse cx="48" cy="56" rx="7.5" ry="6.5" transform="rotate(-18 48 56)" fill="#1E293B" />
            <ellipse cx="72" cy="56" rx="7.5" ry="6.5" transform="rotate(18 72 56)" fill="#1E293B" />
          </g>
        )}
        {avatar.character === 'astronaut' && (
          <path
            d="M35 48 C35 30 85 30 85 48 C78 40 42 40 35 48 Z"
            fill="#475569"
          />
        )}

        {/* Subtle 3D highlight */}
        <circle cx="60" cy="58" r="28" fill={`url(#face-${avatar.character})`} />

        {/* Rosy Cheeks */}
        <circle cx="43" cy="64" r="4.2" fill="#FDA4AF" opacity="0.65" />
        <circle cx="77" cy="64" r="4.2" fill="#FDA4AF" opacity="0.65" />

        {/* Eyes */}
        <g>
          <circle cx="49" cy="56" r="3.8" fill={avatar.character === 'panda' ? '#FFFFFF' : '#1E293B'} />
          <circle cx="48.4" cy="55.2" r="1.4" fill={avatar.character === 'panda' ? '#1E293B' : '#FFFFFF'} />
          <circle cx="71" cy="56" r="3.8" fill={avatar.character === 'panda' ? '#FFFFFF' : '#1E293B'} />
          <circle cx="70.4" cy="55.2" r="1.4" fill={avatar.character === 'panda' ? '#1E293B' : '#FFFFFF'} />
        </g>

        {/* Nose & Cheerful Smile */}
        {avatar.character !== 'astronaut' && (
          <ellipse cx="60" cy="62" rx="3.2" ry="2.2" fill="#334155" />
        )}
        <path
          d="M54 67 Q60 72 66 67"
          fill="none"
          stroke="#334155"
          strokeWidth="2.3"
          strokeLinecap="round"
        />

        {/* Cat whiskers */}
        {avatar.character === 'cat' && (
          <g stroke="#64748B" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
            <line x1="33" y1="60" x2="41" y2="62" />
            <line x1="33" y1="66" x2="41" y2="66" />
            <line x1="87" y1="60" x2="79" y2="62" />
            <line x1="87" y1="66" x2="79" y2="66" />
          </g>
        )}

        {/* Eyewear Accessories */}
        {avatar.accessory === 'sunglasses' && (
          <g>
            <rect x="39" y="50" width="17" height="11" rx="4" fill="#1E293B" stroke="#FACC15" strokeWidth="1.8" />
            <rect x="64" y="50" width="17" height="11" rx="4" fill="#1E293B" stroke="#FACC15" strokeWidth="1.8" />
            <line x1="56" y1="54" x2="64" y2="54" stroke="#FACC15" strokeWidth="2" />
          </g>
        )}

        {avatar.accessory === 'glasses' && (
          <g>
            <circle cx="48" cy="56" r="8" fill="#FFFFFF" fillOpacity="0.25" stroke="#475569" strokeWidth="2.2" />
            <circle cx="72" cy="56" r="8" fill="#FFFFFF" fillOpacity="0.25" stroke="#475569" strokeWidth="2.2" />
            <line x1="56" y1="56" x2="64" y2="56" stroke="#475569" strokeWidth="2.2" />
          </g>
        )}

        {/* Head Accessories */}
        {avatar.accessory === 'flower' && (
          <g transform="translate(77, 34)">
            <circle cx="0" cy="-5" r="4" fill="#F472B6" />
            <circle cx="5" cy="-1" r="4" fill="#F472B6" />
            <circle cx="3" cy="4" r="4" fill="#F472B6" />
            <circle cx="-3" cy="4" r="4" fill="#F472B6" />
            <circle cx="-5" cy="-1" r="4" fill="#F472B6" />
            <circle cx="0" cy="0" r="3.5" fill="#FACC15" />
          </g>
        )}

        {avatar.accessory === 'ribbon' && (
          <g transform="translate(76, 33) rotate(16)">
            <path d="M0 0 L-10 -6 L-10 6 Z" fill="#EC4899" />
            <path d="M0 0 L10 -6 L10 6 Z" fill="#EC4899" />
            <circle cx="0" cy="0" r="3.2" fill="#FBCFE8" />
          </g>
        )}

        {avatar.accessory === 'cap' && (
          <g>
            <path d="M33 42 C33 22 87 22 87 42 Z" fill="#3B82F6" />
            <path d="M33 41 Q60 45 96 42 Q88 37 70 39 Z" fill="#1D4ED8" />
          </g>
        )}

        {avatar.accessory === 'beanie' && (
          <g>
            <path d="M33 43 C33 21 87 21 87 43 Z" fill="#FB7185" />
            <rect x="31" y="38" width="58" height="8" rx="4" fill="#F43F5E" />
            <circle cx="60" cy="20" r="6" fill="#FFE4E6" />
          </g>
        )}

        {avatar.accessory === 'beret' && (
          <g transform="translate(0, -2)">
            <ellipse cx="58" cy="31" rx="26" ry="10" transform="rotate(-10 58 31)" fill="#8B5CF6" />
            <line x1="60" y1="19" x2="62" y2="23" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {avatar.accessory === 'headphones' && (
          <g>
            <path
              d="M30 56 C30 24 90 24 90 56"
              fill="none"
              stroke="#6366F1"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect x="25" y="49" width="9" height="17" rx="4.5" fill="#8B5CF6" />
            <rect x="86" y="49" width="9" height="17" rx="4.5" fill="#8B5CF6" />
          </g>
        )}

        {avatar.accessory === 'wizard' && (
          <g transform="translate(0, -6)">
            <ellipse cx="60" cy="37" rx="28" ry="6" fill="#5B21B6" />
            <path d="M40 36 L60 7 L80 36 Z" fill="#7C3AED" />
            <path d="M44 33 Q60 37 76 33" fill="none" stroke="#FBBF24" strokeWidth="3" />
            <polygon points="60,19 62,24 67,24 63,27 64,32 60,29 56,32 57,27 53,24 58,24" fill="#FDE047" />
          </g>
        )}

        {avatar.accessory === 'star_antenna' && (
          <g>
            <path d="M36 39 C40 28 80 28 84 39" fill="none" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="46" y1="31" x2="42" y2="17" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="74" y1="31" x2="78" y2="17" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="42,10 44,15 49,15 45,18 46,23 42,20 38,23 39,18 35,15 40,15" fill="#FACC15" />
            <polygon points="78,10 80,15 85,15 81,18 82,23 78,20 74,23 75,18 71,15 76,15" fill="#FACC15" />
          </g>
        )}

        {avatar.accessory === 'halo' && (
          <ellipse
            cx="60"
            cy="20"
            rx="19"
            ry="5.5"
            fill="none"
            stroke="#FDE047"
            strokeWidth="3.5"
          />
        )}

        {avatar.accessory === 'crown' && (
          <g transform="translate(0, -3)">
            <path
              d="M41 34 L45 16 L54 25 L60 12 L66 25 L75 16 L79 34 Z"
              fill="#FBBF24"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="25" r="2.6" fill="#EC4899" />
            <circle cx="49" cy="28" r="2" fill="#38BDF8" />
            <circle cx="71" cy="28" r="2" fill="#38BDF8" />
          </g>
        )}
      </svg>
    </div>
  );
};
