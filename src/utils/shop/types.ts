export type ShopItemType = 'frame' | 'title' | 'badge' | 'special' | 'avatar';

export interface ShopItem {
  id: string;
  name?: string;
  type: ShopItemType;
  cost?: number;
  price?: number;
  rarity?: string;
  color?: string;
  description?: string;
  image?: string;
  emoji?: string;
  cssClass?: string;
  flavorText?: string;
  prefix?: string;
  unlockCondition?: { type: string; value: number };
  [key: string]: unknown;
}

/** A cosmetics.json entry: a ShopItem before its category type is assigned */
export interface RawCosmeticItem {
  id: string;
  name?: string;
  cost?: number;
  price?: number;
  rarity?: string;
  color?: string;
  description?: string;
  image?: string;
  emoji?: string;
  cssClass?: string;
  flavorText?: string;
  prefix?: string;
  unlockCondition?: { type: string; value: number };
  [key: string]: unknown;
}

export interface GroupedShopItems {
  avatarFrames: ShopItem[];
  frames: ShopItem[];
  titles: ShopItem[];
  badges: ShopItem[];
  special: ShopItem[];
  avatars: ShopItem[];
  all: ShopItem[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
