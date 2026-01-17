import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import cosmetics from '../data/cosmetics.json';
import { db } from '../firebase';

export type ShopItemType = 'frame' | 'title' | 'special' | 'avatar' | 'avatars';

export interface ShopItem {
  id: string;
  name?: string;
  type: ShopItemType;
  cost?: number; // Renamed/Added from price to match usage
  price?: number; // Kept for backward compatibility if needed, but better to migrate
  rarity?: string;
  color?: string;
  description?: string;
  image?: string;
  emoji?: string;
  cssClass?: string;
  flavorText?: string;
  prefix?: string;
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
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all shop items from Firestore, merged with local cosmetics.json
 */
export const getShopItems = async (forceRefresh = false): Promise<GroupedShopItems> => {
  const now = Date.now();
  if (!forceRefresh && shopItemsCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return shopItemsCache;
  }

  // Start with local cosmetics.json as the base source of truth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCosmetics = cosmetics as Record<string, any[]>;
  const localItems: ShopItem[] = [
    ...(rawCosmetics.avatarFrames || []).map(i => ({ ...i, type: 'frame' as const })),
    ...(rawCosmetics.titles || []).map(i => ({ ...i, type: 'title' as const })),
    ...(rawCosmetics.special || []).map(i => ({ ...i, type: 'special' as const })),
    ...(rawCosmetics.avatars || []).map(i => ({ ...i, type: 'avatar' as const })),
  ] as ShopItem[];

  const firestoreItems: ShopItem[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'shop_items'));
    querySnapshot.forEach(docSnapshot => {
      firestoreItems.push({ id: docSnapshot.id, ...docSnapshot.data() } as ShopItem);
    });
    console.warn('Shop Fetch Success:', firestoreItems.length, 'Firestore items');
  } catch (error) {
    console.error('Error fetching shop items from Firestore:', error);
    // Continue with just local items
  }

  // Merge: Firestore items override local items with same ID
  // Merge: Firestore items override local items with same ID, but preserve local fields (like images) if missing in Firestore
  const itemMap = new Map<string, ShopItem>();
  localItems.forEach(item => itemMap.set(item.id, item));

  firestoreItems.forEach(item => {
    const existing = itemMap.get(item.id);
    if (existing) {
      // Merge existing (local) with new (firestore)
      // Firestore data takes precedence for conflicting keys, but local keys (like new images) are kept
      itemMap.set(item.id, { ...existing, ...item });
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
 */
export const updateShopItem = async (
  id: string,
  updates: Partial<ShopItem>
): Promise<OperationResult> => {
  try {
    await setDoc(doc(db, 'shop_items', id), updates, { merge: true });
    shopItemsCache = null; // Invalidate cache
    return { success: true };
  } catch (error) {
    console.error('Error updating shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Create a new shop item
 */
export const createShopItem = async (itemData: ShopItem): Promise<OperationResult> => {
  try {
    const id = itemData.id;
    if (id) {
      await setDoc(doc(db, 'shop_items', id), itemData);
    } else {
      await addDoc(collection(db, 'shop_items'), itemData);
    }
    shopItemsCache = null;
    return { success: true };
  } catch (error) {
    console.error('Error creating shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Delete a shop item
 */
export const deleteShopItem = async (id: string): Promise<OperationResult> => {
  try {
    await deleteDoc(doc(db, 'shop_items', id));
    shopItemsCache = null;
    return { success: true };
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return { success: false, error: (error as Error).message };
  }
};
