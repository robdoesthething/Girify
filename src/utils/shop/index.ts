import cosmetics from '../../data/cosmetics.json';
import {
  createShopItem as dbCreateShopItem,
  deleteShopItem as dbDeleteShopItem,
  getShopItems as dbGetShopItems,
  updateShopItem as dbUpdateShopItem,
} from '../../services/database';
import { ShopItemRow } from '../../types/supabase';

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
  titles: ShopItem[];
  special: ShopItem[];
  avatars: ShopItem[];
  all: ShopItem[];
}

interface OperationResult {
  success: boolean;
  error?: string;
}

// Simple in-memory cache
let shopItemsCache: GroupedShopItems | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MINUTES = 5;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const CACHE_DURATION_MS = CACHE_DURATION_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

/**
 * Fetch all shop items from Supabase, merged with local cosmetics.json
 * @param forceRefresh - If true, bypasses the in-memory cache
 * @returns Promise resolving to helper object containing grouped shop items
 */
export const getShopItems = async (forceRefresh = false): Promise<GroupedShopItems> => {
  const now = Date.now();
  if (!forceRefresh && shopItemsCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return shopItemsCache;
  }

  // Start with local cosmetics.json as the base source of truth

  const rawCosmetics = cosmetics as Record<string, any[]>;
  const localItems: ShopItem[] = [
    ...(rawCosmetics.avatarFrames || []).map(i => ({ ...i, type: 'frame' as const })),
    ...(rawCosmetics.titles || []).map(i => ({ ...i, type: 'title' as const })),
    ...(rawCosmetics.special || []).map(i => ({ ...i, type: 'special' as const })),
    ...(rawCosmetics.avatars || []).map(i => ({ ...i, type: 'avatar' as const })),
  ] as ShopItem[];

  const dbItems: ShopItem[] = [];
  try {
    const rows = await dbGetShopItems();
    rows.forEach(row => {
      dbItems.push({
        id: row.id,
        name: row.name,
        type: row.type as ShopItemType,
        cost: row.cost,
        rarity: row.rarity || undefined,
        color: row.color || undefined,
        description: row.description || undefined,
        image: row.image || undefined,
        emoji: row.emoji || undefined,
        cssClass: row.css_class || undefined,
        flavorText: row.flavor_text || undefined,
        prefix: row.prefix || undefined,
        // Helper to keep other fields if needed, but strict types preferred
      });
    });
    // console.warn('Shop Fetch Success:', dbItems.length, 'DB items');
  } catch (error) {
    console.error('Error fetching shop items from DB:', error);
    // Continue with just local items
  }

  // Merge: DB items override local items with same ID
  const itemMap = new Map<string, ShopItem>();
  localItems.forEach(item => itemMap.set(item.id, item));

  dbItems.forEach(item => {
    const existing = itemMap.get(item.id);
    if (existing) {
      // Merge DB item over existing, but strictly preserve local assets (image, cssClass)
      // This ensures we always show the correct pixel art from the bundle
      const merged = { ...existing, ...item };

      if (existing.image) {
        merged.image = existing.image;
      }
      if (existing.cssClass) {
        merged.cssClass = existing.cssClass;
      }

      itemMap.set(item.id, merged);
    } else {
      itemMap.set(item.id, item);
    }
  });

  const allItems = Array.from(itemMap.values());

  // Group items
  const grouped: GroupedShopItems = {
    avatarFrames: allItems.filter(i => i.type === 'frame'),
    titles: allItems.filter(i => i.type === 'title'),
    special: allItems.filter(i => i.type === 'special'),
    avatars: allItems.filter(
      i => i.type === 'avatar' || i.type === 'avatars' || (i.id && i.id.startsWith('avatar_'))
    ),
    all: allItems,
  };

  shopItemsCache = grouped;
  cacheTimestamp = now;
  return grouped;
};

/**
 * Update a shop item
 * @param id - The ID of the item to update
 * @param updates - The updates to apply
 * @returns Promise resolving to operation result
 */
export const updateShopItem = async (
  id: string,
  updates: Partial<ShopItem>
): Promise<OperationResult> => {
  try {
    // Map updates to DB columns
    const dbUpdates: Partial<ShopItemRow> = {};
    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }
    if (updates.cost !== undefined) {
      dbUpdates.cost = updates.cost;
    }
    if (updates.type !== undefined) {
      dbUpdates.type = updates.type;
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description || null;
    }
    if (updates.image !== undefined) {
      dbUpdates.image = updates.image || null;
    }
    if (updates.emoji !== undefined) {
      dbUpdates.emoji = updates.emoji || null;
    }

    // Add other fields mapping as needed

    const success = await dbUpdateShopItem(id, dbUpdates);
    if (success) {
      shopItemsCache = null; // Invalidate cache
      return { success: true };
    }
    return { success: false, error: 'Update failed' };
  } catch (error) {
    console.error('Error updating shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Create a new shop item
 * @param itemData - The item data to create
 * @returns Promise resolving to operation result
 */
export const createShopItem = async (itemData: ShopItem): Promise<OperationResult> => {
  try {
    // Map to Row
    const row: ShopItemRow = {
      id: itemData.id,
      name: itemData.name || '',
      type: itemData.type,
      cost: itemData.cost || 0,
      is_active: true,
      created_at: new Date().toISOString(),
      description: itemData.description || null,
      image: itemData.image || null,
      emoji: itemData.emoji || null,
      rarity: itemData.rarity || null,
      color: itemData.color || null,
      css_class: itemData.cssClass || null,
      flavor_text: itemData.flavorText || null,
      prefix: itemData.prefix || null,
    };

    const success = await dbCreateShopItem(row);

    if (success) {
      shopItemsCache = null;
      return { success: true };
    }
    return { success: false, error: 'Creation failed' };
  } catch (error) {
    console.error('Error creating shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Delete a shop item
 * @param id - The ID of the item to delete
 * @returns Promise resolving to operation result
 */
export const deleteShopItem = async (id: string): Promise<OperationResult> => {
  try {
    const success = await dbDeleteShopItem(id);
    if (success) {
      shopItemsCache = null;
      return { success: true };
    }
    return { success: false, error: 'Delete failed' };
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Sync local cosmetics.json to DB
 * @returns Promise resolving to sync stats { updated, errors }
 */
export const syncWithLocal = async (): Promise<{ updated: number; errors: number }> => {
  const rawCosmetics = cosmetics as Record<string, any[]>;
  const localItems: ShopItem[] = [
    ...(rawCosmetics.avatarFrames || []).map(i => ({ ...i, type: 'frame' as const })),
    ...(rawCosmetics.titles || []).map(i => ({ ...i, type: 'title' as const })),
    ...(rawCosmetics.special || []).map(i => ({ ...i, type: 'special' as const })),
    ...(rawCosmetics.avatars || []).map(i => ({ ...i, type: 'avatar' as const })),
  ] as ShopItem[];

  let updated = 0;
  let errors = 0;

  for (const item of localItems) {
    try {
      if (!item.id) {
        continue;
      }

      const row: Partial<ShopItemRow> = {
        name: item.name || '',
        type: item.type,
        cost: item.cost || 0,
        description: item.description || null,
        image: item.image || null,
        emoji: item.emoji || null,
        rarity: item.rarity || null,
        color: item.color || null,
        css_class: item.cssClass || null,
        flavor_text: item.flavorText || null,
        prefix: item.prefix || null,
        is_active: true,
      };

      // Upsert logic: Check if exists, update; else create
      // Supabase .upsert() is best handled in database.ts, but here we can try update then create
      // Or we can add upsertShopItem to database.ts

      const success = await dbUpdateShopItem(item.id, row);
      if (!success) {
        // Try create
        // But we need full row for create
        await createShopItem(item);
      }
      updated++;
    } catch (e) {
      console.error(`Failed to sync item ${item.id}`, e);
      errors++;
    }
  }

  shopItemsCache = null;
  return { updated, errors };
};

import { UserProfile } from '../../types/user';

/**
 * Check if a shop item is locked for the user
 * @param item - The shop item to check
 * @param userStats - The user's stats
 * @returns Object indicating lock status and reason if locked
 */
export const checkUnlockCondition = (
  item: ShopItem,
  userStats: Partial<UserProfile> | null
): { locked: boolean; reason?: string } => {
  if (!item.unlockCondition || !userStats) {
    return { locked: false };
  }

  const { type, value } = item.unlockCondition;

  if (type === 'streak') {
    const currentStreak = userStats.streak || 0;
    if (currentStreak < value) {
      return { locked: true, reason: `Need ${value} day streak (Current: ${currentStreak})` };
    }
  }

  if (type === 'gamesPlayed') {
    const games = userStats.gamesPlayed || 0;
    if (games < value) {
      return { locked: true, reason: `Play ${value} games (Current: ${games})` };
    }
  }

  if (type === 'bestScore') {
    const best = userStats.bestScore || 0;
    if (best < value) {
      return { locked: true, reason: `Score > ${value} in one game (Best: ${best})` };
    }
  }

  return { locked: false };
};
