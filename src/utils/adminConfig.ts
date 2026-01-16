import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { requireAdmin } from './auth';
import { logger } from './logger';

export interface GameConfig {
  maintenanceMode: boolean;
  scoreMultiplier: number;
  giurosMultiplier: number;
  dailyGameLimit: number; // 0 = unlimited
  announcementBar?: string; // Quick global text
  enabledShopCategories: string[];
}

const CONFIG_COLLECTION = 'config';
const CONFIG_DOC = 'global';

// Validation constants
const MIN_MULTIPLIER = 0.1;
const MAX_MULTIPLIER = 10;
const MAX_DAILY_LIMIT = 100;

export const DEFAULT_CONFIG: GameConfig = {
  maintenanceMode: false,
  scoreMultiplier: 1.0,
  giurosMultiplier: 1.0,
  dailyGameLimit: 0,
  enabledShopCategories: ['frames', 'titles', 'avatars', 'badges'],
};

/**
 * Validate game config updates
 */
const validateConfig = (updates: Partial<GameConfig>): void => {
  if (updates.scoreMultiplier !== undefined) {
    if (updates.scoreMultiplier < MIN_MULTIPLIER || updates.scoreMultiplier > MAX_MULTIPLIER) {
      throw new Error(`scoreMultiplier must be between ${MIN_MULTIPLIER} and ${MAX_MULTIPLIER}`);
    }
  }
  if (updates.giurosMultiplier !== undefined) {
    if (updates.giurosMultiplier < MIN_MULTIPLIER || updates.giurosMultiplier > MAX_MULTIPLIER) {
      throw new Error(`giurosMultiplier must be between ${MIN_MULTIPLIER} and ${MAX_MULTIPLIER}`);
    }
  }
  if (updates.dailyGameLimit !== undefined) {
    if (updates.dailyGameLimit < 0 || updates.dailyGameLimit > MAX_DAILY_LIMIT) {
      throw new Error(`dailyGameLimit must be between 0 and ${MAX_DAILY_LIMIT}`);
    }
  }
};

export const getGameConfig = async (): Promise<GameConfig> => {
  try {
    const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() } as GameConfig;
    } else {
      // Create default if missing (requires admin)
      await requireAdmin();
      await setDoc(ref, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    logger.error('Error fetching game config', { error });
    return DEFAULT_CONFIG;
  }
};

export const updateGameConfig = async (
  updates: Partial<GameConfig>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Security: Verify admin before write
    await requireAdmin();

    // Validation: Check values before write
    validateConfig(updates);

    const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    await updateDoc(ref, updates);
    return { success: true };
  } catch (error) {
    logger.error('Error updating game config', { error });
    return { success: false, error: String(error) };
  }
};
