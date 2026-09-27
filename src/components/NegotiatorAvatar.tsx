import React, { useState } from 'react';

interface NegotiatorAvatarProps {
  avatarId: 'john' | 'kenji' | 'sarah' | 'elena' | 'david' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_IMAGE_MAP: Record<string, string> = {
  john: './characters/john.jpg',
  kenji: './characters/kenji.jpg',
  sarah: './characters/sarah.jpg',
  elena: './characters/elena.jpg',
  david: './characters/david.jpg',
};

export const NegotiatorAvatar: React.FC<NegotiatorAvatarProps> = ({
  avatarId,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-12 h-14 rounded-xl',
    lg: 'w-20 h-24 rounded-2xl',
    xl: 'w-28 h-36 rounded-2xl',
  };

  const currentSize = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
  const imageSrc = AVATAR_IMAGE_MAP[avatarId] || `./characters/${avatarId}.jpg`;

  return (
    <div
      className={`relative inline-block overflow-hidden shadow-2xl border-2 border-sky-400/70 bg-slate-900 group select-none shrink-0 ${currentSize} ${className}`}
    >
      {!hasError ? (
        <img
          src={imageSrc}
          alt={avatarId}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-950 text-white font-black text-xs font-mono uppercase">
          {avatarId.slice(0, 3)}
        </div>
      )}
      {/* Subtle glass rim highlight */}
      <div className="absolute inset-0 rounded-inherit ring-1 ring-inset ring-white/20 pointer-events-none" />
    </div>
  );
};
