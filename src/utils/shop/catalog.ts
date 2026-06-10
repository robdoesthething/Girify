/**
 * Cosmetics Catalog
 *
 * Single source of truth for the bundled cosmetics.json catalog.
 * All avatar/frame/title resolution and display defaults live here so that
 * the shop, profile, public profile, and friend list render cosmetics
 * consistently.
 */

import cosmetics from '../../data/cosmetics.json';
import type { RawCosmeticItem, ShopItem, ShopItemType } from './types';

const rawCosmetics = cosmetics as Record<string, RawCosmeticItem[]>;

const withType = (items: RawCosmeticItem[] | undefined, type: ShopItemType): ShopItem[] =>
  (items || []).map(i => ({ ...i, type }));

export const LOCAL_FRAMES: ShopItem[] = withType(rawCosmetics.avatarFrames, 'frame');
export const LOCAL_TITLES: ShopItem[] = withType(rawCosmetics.titles, 'title');
export const LOCAL_SPECIAL: ShopItem[] = withType(rawCosmetics.special, 'special');
export const LOCAL_AVATARS: ShopItem[] = withType(rawCosmetics.avatars, 'avatar');

/** All bundled cosmetics, in shop merge order (frames, titles, special, avatars). */
export const LOCAL_SHOP_ITEMS: ShopItem[] = [
  ...LOCAL_FRAMES,
  ...LOCAL_TITLES,
  ...LOCAL_SPECIAL,
  ...LOCAL_AVATARS,
];

/** Frame shown when no frame cosmetic is equipped. */
export const DEFAULT_FRAME_CLASS = 'ring-4 ring-white dark:ring-slate-700';

/** Title shown when no title cosmetic is equipped. */
export const DEFAULT_TITLE_NAME = 'Street Explorer';

/** Background for avatar circles when no cosmetic image is equipped. */
export const AVATAR_FALLBACK_CLASS = 'bg-gradient-to-br from-sky-400 to-indigo-600';

/** Default avatar artwork, used for frame previews in the shop. */
export const DEFAULT_AVATAR_IMAGE = '/assets/pixel_avatar_guiri.png';

const avatarImageById = new Map<string, string>(
  LOCAL_AVATARS.filter(a => a.image).map(a => [a.id, a.image as string])
);
const frameClassById = new Map<string, string>(
  LOCAL_FRAMES.filter(f => f.cssClass).map(f => [f.id, f.cssClass as string])
);
const titleNameById = new Map<string, string>(
  LOCAL_TITLES.filter(t => t.name).map(t => [t.id, t.name as string])
);

/**
 * Resolve an equipped cosmetic avatar id (e.g. "avatar_local", "pixel_avatar_cat")
 * to its image URL from the cosmetics catalog.
 * @param avatarId - The equipped cosmetic avatar id
 * @returns The image URL, or null if the id is unknown (caller should fall back to the legacy avatar)
 */
export function getCosmeticAvatarImage(avatarId: string | null | undefined): string | null {
  if (!avatarId) {
    return null;
  }
  return avatarImageById.get(avatarId) ?? null;
}

/**
 * Resolve an equipped frame id to its ring CSS classes.
 * @param frameId - The equipped frame cosmetic id
 * @returns The frame classes, or the default frame when none is equipped/known
 */
export function getFrameClass(frameId: string | null | undefined): string {
  if (!frameId) {
    return DEFAULT_FRAME_CLASS;
  }
  return frameClassById.get(frameId) ?? DEFAULT_FRAME_CLASS;
}

/**
 * Resolve an equipped title id to its display name.
 * @param titleId - The equipped title cosmetic id
 * @returns The title name, or the default title when none is equipped/known
 */
export function getTitleName(titleId: string | null | undefined): string {
  if (!titleId) {
    return DEFAULT_TITLE_NAME;
  }
  return titleNameById.get(titleId) ?? DEFAULT_TITLE_NAME;
}
