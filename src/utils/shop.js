import cosmetics from '../data/cosmetics.json';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

// Simple in-memory cache
let shopItemsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all shop items from Firestore
 * @param {boolean} forceRefresh - If true, ignore cache
 * @returns {Promise<Object>} - Grouped by type: { avatarFrames: [], titles: [], special: [] }
 */
export const getShopItems = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && shopItemsCache && now - cacheTimestamp < CACHE_DURATION) {
    return shopItemsCache;
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'shop_items'));
    const items = [];
    querySnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    console.warn('Shop Fetch Success:', items.length, 'items');

    // Group items
    // Group items
    const grouped = {
      avatarFrames: items.filter(i => i.type === 'frame'),
      titles: items.filter(i => i.type === 'title'),
      special: items.filter(i => i.type === 'special'),
      avatars: items.filter(i => i.type === 'avatar' || (i.id && i.id.startsWith('avatar_'))),
      all: items,
    };

    shopItemsCache = grouped;
    cacheTimestamp = now;
    return grouped;
  } catch (error) {
    console.error('Error fetching shop items (FULL):', error, error.code, error.message);

    // FALLBACK for local verification if rules prevent access
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      // Use local cosmetics.json as source of truth
      return {
        avatarFrames: cosmetics.avatarFrames || [],
        titles: cosmetics.titles || [],
        special: cosmetics.special || [],
        avatars: cosmetics.avatars || [],
        all: [
          ...(cosmetics.avatarFrames || []),
          ...(cosmetics.titles || []),
          ...(cosmetics.special || []),
          ...(cosmetics.avatars || []),
        ],
      };
    }

    return { avatarFrames: [], titles: [], special: [], all: [] };
  }
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
