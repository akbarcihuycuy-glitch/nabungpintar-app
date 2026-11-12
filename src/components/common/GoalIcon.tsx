import React from 'react';

interface GoalIconProps {
  icon?: string | null;
  className?: string;
  size?: number; // size in px, default 24
}

/**
 * Checks whether a given string is a custom image (DataURL base64 or HTTP URL)
 */
export function isCustomImageIcon(icon?: string | null): boolean {
  if (!icon) return false;
  return (
    icon.startsWith('data:image') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('blob:')
  );
}

/**
 * Checks whether a given string is an emoji
 */
export function isEmojiIcon(icon?: string | null): boolean {
  if (!icon) return false;
  if (isCustomImageIcon(icon)) return false;
  // If it contains typical emoji characters or is short and contains non-ascii
  const emojiRegex = /\p{Extended_Pictographic}/u;
  return emojiRegex.test(icon) || (icon.length <= 4 && !/^[a-z0-9_]+$/i.test(icon));
}

export const GoalIcon: React.FC<GoalIconProps> = ({
  icon,
  className = '',
  size = 22,
}) => {
  const resolved = icon || 'savings';

  // 1. Custom Image / Photo
  if (isCustomImageIcon(resolved)) {
    return (
      <img
        src={resolved}
        alt="Ikon Target"
        className={`w-full h-full object-cover rounded-xl ${className}`}
      />
    );
  }

  // 2. Emoji
  if (isEmojiIcon(resolved)) {
    return (
      <span
        className={`select-none leading-none flex items-center justify-center ${className}`}
        style={{ fontSize: `${Math.round(size * 1.15)}px` }}
      >
        {resolved}
      </span>
    );
  }

  // 3. Material Symbols Icon
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      {resolved}
    </span>
  );
};
