import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

export const DEFAULT_CONFIG: GameConfig = {
  maintenanceMode: false,
  scoreMultiplier: 1.0,
  giurosMultiplier: 1.0,
  dailyGameLimit: 0,
  enabledShopCategories: ['frames', 'titles', 'avatars', 'badges'],
};

export const getGameConfig = async (): Promise<GameConfig> => {
  try {
    const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() } as GameConfig;
    } else {
      // Create default if missing
      await setDoc(ref, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error fetching game config:', error);
    return DEFAULT_CONFIG;
  }
};

export const updateGameConfig = async (
  updates: Partial<GameConfig>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    await updateDoc(ref, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating game config:', error);
    return { success: false, error: String(error) };
  }
};
