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
  className = '',
}) => {
  const heightMap = {
    sm: 'h-7',
    md: 'h-9 sm:h-10',
    lg: 'h-12',
    xl: 'h-20 sm:h-24',
  };

  const currentHeight = heightMap[size];

  return (
    <div className={`relative flex items-center shrink-0 ${currentHeight} ${className}`}>
      <img
        src="/logo.svg"
        alt="PaisaKG - Paisa Kha Gya?"
        className="h-full w-auto object-contain max-h-full transition-transform duration-200"
      />
    </div>
  );
};
