'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'full' | 'mark' | 'full-image';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'full',
}) => {
  const heightMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-24',
  };

  const currentHeight = heightMap[size];

  if (variant === 'full-image' || (variant === 'full' && size === 'xl')) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl shadow-sm border border-[#D5DBCB] dark:border-slate-800 ${currentHeight} ${className}`}>
        <img
          src="/logo.svg"
          alt="PaisaKG - Paisa Kha Gya?"
          className="h-full w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${currentHeight} ${className}`}>
      {/* Full Logo Badge matching exact uploaded visual identity */}
      <div className="h-full bg-[#E6EBDC] dark:bg-slate-900 border border-[#D5DBCB] dark:border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-sm shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto aspect-square shrink-0">
          <path
            d="M15 18H85M15 42H85M15 42C40 42 70 48 70 72C70 96 40 100 15 100M15 100L65 140"
            fill="none"
            stroke="#0A3A22"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {showText && (
          <div className="flex flex-col justify-center leading-none text-[#0A3A22] dark:text-emerald-400">
            <span className="font-black text-xs tracking-wider">PAISA</span>
            <span className="font-bold text-[10px] tracking-wider opacity-90">KHA</span>
            <span className="font-bold text-[10px] tracking-wider opacity-90">GYA?</span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
            PaisaKG
          </span>
          <span className="text-[10px] font-bold text-[#0A3A22] dark:text-emerald-400 uppercase tracking-wider">
            Family Tracker
          </span>
        </div>
      )}
    </div>
  );
};
