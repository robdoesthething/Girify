import { useCallback, useLayoutEffect, useRef } from 'react';
import { Achievement } from '../../../data/achievements';
import { useAdminCRUD } from '../../../hooks/useAdminCRUD';
import {
  createAchievement,
  deleteAchievement,
  getAllAchievements,
  updateAchievement,
} from '../../../utils/game/achievements';

interface UseAdminAchievementsProps {
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

export function useAdminAchievements({ notify, confirm }: UseAdminAchievementsProps) {
  const fetchFn = useCallback(async () => {
    const items = await getAllAchievements(true);
    // Sort by category then name
    return items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, []);

  const createFn = useCallback(async (data: Achievement) => {
    const result = await createAchievement(data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }, []);

  const updateFn = useCallback(async (id: string, data: Partial<Achievement>) => {
    const result = await updateAchievement(id, data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }, []);

  const deleteFnImpl = useCallback(async (id: string) => {
    const result = await deleteAchievement(id);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }, []);

  // Use a ref to store the refresh implementation to avoid circular dependency
  const refreshImplRef = useRef<(() => void) | null>(null);

  // Create refresh trigger function that can be passed to useAdminCRUD
  const refreshAchievementsTrigger = useCallback(() => {
    refreshImplRef.current?.();
  }, []);

  const crud = useAdminCRUD<Achievement>({
    notify,
    confirm,
    createFn,
    updateFn,
    deleteFn: deleteFnImpl,
    refreshFn: refreshAchievementsTrigger,
  });

  // Store the actual refresh implementation in the ref
  // This updates the CRUD state after fetching
  useLayoutEffect(() => {
    refreshImplRef.current = () => {
      crud.setLoading(true);
      fetchFn()
        .then(items => {
          crud.setItems(items);
        })
        .catch(e => {
          console.error(e);
          notify('Failed to fetch achievements', 'error');
        })
        .finally(() => {
          crud.setLoading(false);
        });
    };
  }, [crud, fetchFn, notify]);

  // Wrapper for manual refresh calls
  const refreshAchievements = useCallback(() => {
    refreshImplRef.current?.();
  }, []);

  // Initial load
  const loadInitial = useCallback(() => {
    refreshAchievements();
  }, [refreshAchievements]);

  return {
    ...crud,
    refreshAchievements,
    loadInitial,
  };
}
