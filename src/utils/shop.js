import cosmetics from '../data/cosmetics.json';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

// Simple in-memory cache
let shopItemsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all shop items from Firestore, merged with local cosmetics.json
 * @param {boolean} forceRefresh - If true, ignore cache
 * @returns {Promise<Object>} - Grouped by type: { avatarFrames: [], titles: [], special: [], avatars: [] }
 */
export const getShopItems = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && shopItemsCache && now - cacheTimestamp < CACHE_DURATION) {
    return shopItemsCache;
  }

  // Start with local cosmetics.json as the base source of truth
  const localItems = [
    ...(cosmetics.avatarFrames || []).map(i => ({ ...i, type: 'frame' })),
    ...(cosmetics.titles || []).map(i => ({ ...i, type: 'title' })),
    ...(cosmetics.special || []).map(i => ({ ...i, type: 'special' })),
    ...(cosmetics.avatars || []).map(i => ({ ...i, type: 'avatar' })),
  ];

  const firestoreItems = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'shop_items'));
    querySnapshot.forEach(doc => {
      firestoreItems.push({ id: doc.id, ...doc.data() });
    });
    console.warn('Shop Fetch Success:', firestoreItems.length, 'Firestore items');
  } catch (error) {
    console.error('Error fetching shop items from Firestore:', error);
    // Continue with just local items
  }

  // Merge: Firestore items override local items with same ID
  const itemMap = new Map();
  localItems.forEach(item => itemMap.set(item.id, item));
  firestoreItems.forEach(item => itemMap.set(item.id, item));

  const allItems = Array.from(itemMap.values());

  // Group items
  const grouped = {
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
 * @param {string} id
 * @param {Object} updates
 */
export const updateShopItem = async (id, updates) => {
  try {
    await setDoc(doc(db, 'shop_items', id), updates, { merge: true });
    shopItemsCache = null; // Invalidate cache
    return { success: true };
  } catch (error) {
    console.error('Error updating shop item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new shop item
 * @param {Object} itemData
 */
export const createShopItem = async itemData => {
  try {
    // If ID is provided, use it, else auto-generate (though typically we want clean IDs like 'frame_gold')
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
    return { success: false, error: error.message };
  }
};

/**
 * Delete a shop item
 * @param {string} id
 */
export const deleteShopItem = async id => {
  try {
    await deleteDoc(doc(db, 'shop_items', id));
    shopItemsCache = null;
    return { success: true };
  } catch (error) {
    console.error('Error deleting shop item:', error);
    return { success: false, error: error.message };
  }
};
