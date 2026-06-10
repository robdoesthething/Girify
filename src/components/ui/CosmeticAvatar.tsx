import React from 'react';
import { AVATAR_FALLBACK_CLASS } from '../../utils/shop/catalog';

interface CosmeticAvatarProps {
  /** Resolved cosmetic image URL (use getCosmeticAvatarImage); null falls back to the emoji */
  image: string | null;
  /** Emoji (or node) shown when no cosmetic image is equipped */
  fallback: React.ReactNode;
  /** Avatar diameter in px — also used for the img intrinsic dimensions */
  size: number;
  alt: string;
  /** Extra classes: frame ring, shadows, borders, interactivity */
  className?: string;
}

/**
 * Standard avatar circle for every surface that displays a user's equipped
 * cosmetic avatar (profile, public profile, friend list). Renders the pixel-art
 * image crisply, or the legacy emoji on the shared gradient background.
 */
const CosmeticAvatar: React.FC<CosmeticAvatarProps> = ({
  image,
  fallback,
  size,
  alt,
  className = '',
}) => (
  <div
    className={`rounded-full flex items-center justify-center overflow-hidden select-none ${
      image ? 'bg-transparent' : AVATAR_FALLBACK_CLASS
    } ${className}`}
    style={{ width: size, height: size }}
  >
    {image ? (
      <img
        src={image}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
    ) : (
      <span aria-label={alt} style={{ fontSize: Math.round(size * 0.45) }}>
        {fallback}
      </span>
    )}
  </div>
);

export default CosmeticAvatar;
