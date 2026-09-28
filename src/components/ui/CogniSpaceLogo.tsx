import React from 'react';
import { cn } from '../../lib/utils';

interface CogniSpaceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const CogniSpaceLogo: React.FC<CogniSpaceLogoProps> = ({
  size = 'md',
  showTagline = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Modern glowing gradient badge with spark/brain 'C' glyph */}
      <div
        className={cn(
          'relative rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/20 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 flex-shrink-0',
          sizeClasses[size]
        )}
      >
        {/* Subtle inner reflection */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Brain / Spark / Stylized 'C' geometric glyph */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/6 h-4/6 drop-shadow-sm"
        >
          {/* Stylized neural 'C' curve with spark node */}
          <path d="M17 7.5A7 7 0 1 0 17 16.5" />
          <path d="M12 9a3 3 0 1 0 3 3" />
          <circle cx="17.5" cy="12" r="1.5" fill="currentColor" />
          <path d="M19 7l1-2" strokeWidth="2" />
          <path d="M19 17l1 2" strokeWidth="2" />
        </svg>
      </div>

      {/* Brand Name & Optional Tagline */}
      <div className="flex flex-col leading-tight min-w-0">
        <div className={cn('font-bold tracking-tight text-zinc-100 flex items-center gap-1', textClasses[size])}>
          <span>Cogni</span>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Space
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
            Your AI-Enhanced Second Brain
          </span>
        )}
      </div>
    </div>
  );
};

export default CogniSpaceLogo;
