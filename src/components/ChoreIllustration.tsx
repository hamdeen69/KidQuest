import React from 'react';
import { ChoreItem } from '../types';
import {
  BedDouble,
  BookOpen,
  ChefHat,
  HeartHandshake,
  PawPrint,
  Recycle,
  Shirt,
  Sparkles,
  Trash2,
  Utensils,
  Waves,
  Wind,
} from 'lucide-react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-6">
    <div className="relative w-11 h-11">
      <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-violet-500 animate-spin" />
    </div>
    {label && (
      <p className="text-sm font-medium text-slate-600">{label}</p>
    )}
  </div>
);

export const ChoreIconBadge: React.FC<{
  iconKey: ChoreItem['iconKey'];
  size?: 'sm' | 'md';
}> = ({ iconKey, size = 'md' }) => {
  const boxClass =
    size === 'sm'
      ? 'w-10 h-10 rounded-xl'
      : 'w-11 h-11 rounded-2xl';

  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-5 h-5';

  const palette: Record<ChoreItem['iconKey'], string> = {
    toys: 'bg-sky-50 text-sky-600',
    laundry: 'bg-violet-50 text-violet-600',
    wipe: 'bg-cyan-50 text-cyan-600',
    dust: 'bg-amber-50 text-amber-600',
    pet: 'bg-pink-50 text-pink-600',
    bed: 'bg-indigo-50 text-indigo-600',
    broom: 'bg-emerald-50 text-emerald-600',
    table: 'bg-orange-50 text-orange-600',
    sort: 'bg-purple-50 text-purple-600',
    trash: 'bg-slate-100 text-slate-600',
    washer: 'bg-blue-50 text-blue-600',
    dishes: 'bg-teal-50 text-teal-600',
    sink: 'bg-sky-50 text-sky-600',
    snack: 'bg-rose-50 text-rose-600',
    recycle: 'bg-emerald-50 text-emerald-600',
  };

  const renderIcon = () => {
    switch (iconKey) {
      case 'toys':
        return <BookOpen className={iconSize} />;
      case 'laundry':
      case 'sort':
        return <Shirt className={iconSize} />;
      case 'wipe':
      case 'sink':
        return <Waves className={iconSize} />;
      case 'dust':
      case 'broom':
        return <Wind className={iconSize} />;
      case 'pet':
        return <PawPrint className={iconSize} />;
      case 'bed':
        return <BedDouble className={iconSize} />;
      case 'table':
      case 'dishes':
        return <Utensils className={iconSize} />;
      case 'snack':
        return <ChefHat className={iconSize} />;
      case 'trash':
        return <Trash2 className={iconSize} />;
      case 'recycle':
        return <Recycle className={iconSize} />;
      case 'washer':
        return <Sparkles className={iconSize} />;
      default:
        return <HeartHandshake className={iconSize} />;
    }
  };

  return (
    <div
      className={`${boxClass} ${palette[iconKey] || 'bg-violet-50 text-violet-600'} flex items-center justify-center shrink-0`}
    >
      {renderIcon()}
    </div>
  );
};

/* Soft 3D-inspired SVG illustrations for "Your Aims" cards matching Screenshot 1 */
export const AimCardIllustration: React.FC<{
  variant: 'coins' | 'streak' | 'avatar';
}> = ({ variant }) => {
  if (variant === 'coins') {
    return (
      <svg viewBox="0 0 80 64" className="w-16 h-14 drop-shadow-md" aria-hidden="true">
        <defs>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="52" rx="24" ry="6" fill="#000" opacity="0.12" />
        <rect x="20" y="18" width="40" height="32" rx="10" fill="#FFFFFF" opacity="0.92" />
        <rect x="24" y="22" width="32" height="24" rx="7" fill="#EEF2FF" />
        <circle cx="40" cy="34" r="10" fill="url(#coinGrad)" stroke="#FFF" strokeWidth="2" />
        <polygon points="40,28 42,32 46,32 43,35 44,39 40,37 36,39 37,35 34,32 38,32" fill="#FFFBEB" />
      </svg>
    );
  }

  if (variant === 'streak') {
    return (
      <svg viewBox="0 0 80 64" className="w-16 h-14 drop-shadow-md" aria-hidden="true">
        <ellipse cx="40" cy="52" rx="22" ry="6" fill="#000" opacity="0.12" />
        <path
          d="M28 16 H52 L49 36 C49 42 45 46 40 46 C35 46 31 42 31 36 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M28 20 H21 C18 20 18 31 23 32 L29 33"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M52 20 H59 C62 20 62 31 57 32 L51 33"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect x="37" y="45" width="6" height="6" fill="#E0E7FF" />
        <rect x="30" y="50" width="20" height="4" rx="2" fill="#FFFFFF" />
        <polygon points="40,22 42,27 47,27 43,30 44,35 40,32 36,35 37,30 33,27 38,27" fill="#A855F7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 64" className="w-16 h-14 drop-shadow-md" aria-hidden="true">
      <ellipse cx="40" cy="53" rx="22" ry="5" fill="#000" opacity="0.12" />
      <circle cx="40" cy="30" r="18" fill="#FFFFFF" opacity="0.92" />
      <path d="M27 30 L35 22 L45 22 L53 30 L40 43 Z" fill="#C4B5FD" />
      <circle cx="40" cy="29" r="5" fill="#7C3AED" />
    </svg>
  );
};
