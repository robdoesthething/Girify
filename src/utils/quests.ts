import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Quest {
  id: string;
  title: string;
  description: string;
  criteriaType: 'find_street' | 'score_attack' | 'district_explorer' | 'login_streak';
  criteriaValue: number | string;
  rewardGiuros: number;
  activeDate?: string; // e.g., "2024-02-15" - if set, only active on this day
  isActive: boolean;
  createdAt: number;
}

const QUESTS_COLLECTION = 'quests';

export const getQuests = async (): Promise<Quest[]> => {
  try {
    const q = query(collection(db, QUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Quest);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return [];
  }
};

export const createQuest = async (quest: Omit<Quest, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, QUESTS_COLLECTION), {
      ...quest,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating quest:', error);
    throw error;
  }
};

export const updateQuest = async (id: string, updates: Partial<Quest>): Promise<void> => {
  try {
    await updateDoc(doc(db, QUESTS_COLLECTION, id), updates);
  } catch (error) {
    console.error('Error updating quest:', error);
    throw error;
  }
};

export const deleteQuest = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, QUESTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting quest:', error);
    throw error;
  }
};
