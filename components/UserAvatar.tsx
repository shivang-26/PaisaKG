'use client';

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  iconClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = 'w-9 h-9 rounded-full',
  iconClassName = 'w-4.5 h-4.5',
}) => {
  const isUploaded =
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    src !== '/logo.svg' &&
    !src.includes('picsum.photos') &&
    !src.includes('unsplash.com');

  if (isUploaded) {
    return (
      <img
        src={src}
        alt={name || 'User Avatar'}
        className={`${className} object-cover ring-1 ring-[#d5dbcb] shrink-0 bg-white`}
      />
    );
  }

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : '';

  return (
    <div
      className={`${className} bg-white border border-[#d5dbcb] text-slate-700 flex items-center justify-center shrink-0 font-black shadow-2xs select-none`}
      title={name || 'User Profile'}
    >
      {initial ? (
        <span>{initial}</span>
      ) : (
        <User className={`${iconClassName} text-slate-400`} />
      )}
    </div>
  );
};
