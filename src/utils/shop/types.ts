export type ShopItemType = 'frame' | 'title' | 'special' | 'avatar' | 'avatars';

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

export interface GroupedShopItems {
  avatarFrames: ShopItem[];
  frames: ShopItem[]; // Alias for avatarFrames - used by ShopScreen tabs
  titles: ShopItem[];
  special: ShopItem[];
  avatars: ShopItem[];
  all: ShopItem[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
