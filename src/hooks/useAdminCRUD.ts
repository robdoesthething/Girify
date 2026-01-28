import { useCallback, useState } from 'react';

interface UseAdminCRUDProps<T> {
  initialItems?: T[];

  createFn?: (data: any) => Promise<any>;

  updateFn?: (id: string, data: any) => Promise<any>;

  deleteFn?: (id: string) => Promise<any>;
  refreshFn?: () => void;

  notify?: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm?: (msg: string, title?: string, isDanger?: boolean) => Promise<boolean>;
}

export function useAdminCRUD<T extends { id?: string }>({
  initialItems = [],
  createFn,
  updateFn,
  deleteFn,
  refreshFn,
  notify,
  confirm,
}: UseAdminCRUDProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(
    async (data: any) => {
      if (!createFn) {
        return;
      }
      setLoading(true);
      try {
        await createFn(data);
        notify?.('Item created successfully', 'success');
        setIsCreating(false);
        setEditingItem(null);
        refreshFn?.();
      } catch (e) {
        console.error(e);
        notify?.('Creation failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [createFn, notify, refreshFn]
  );

  const handleUpdate = useCallback(
    async (id: string, data: any) => {
      if (!updateFn) {
        return;
      }
      setLoading(true);
      try {
        await updateFn(id, data);
        notify?.('Item updated successfully', 'success');
        setEditingItem(null);
        refreshFn?.();
      } catch (e) {
        console.error(e);
        notify?.('Update failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [updateFn, notify, refreshFn]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!deleteFn) {
        return;
      }

      if (
        confirm &&
        !(await confirm('Are you sure you want to delete this item?', 'Delete Item', true))
      ) {
        return;
      }

      setLoading(true);
      try {
        await deleteFn(id);
        notify?.('Item deleted successfully', 'success');
        refreshFn?.();
      } catch (e) {
        console.error(e);
        notify?.('Deletion failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [deleteFn, confirm, notify, refreshFn]
  );

  const startEdit = useCallback((item: T) => {
    setEditingItem(item);
    setIsCreating(false);
  }, []);

  const startCreate = useCallback(() => {
    setEditingItem(null);
    setIsCreating(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
  }, []);

  return {
    items,
    setItems,
    editingItem,
    setEditingItem,
    isCreating,
    setIsCreating,
    loading,
    setLoading,
    handleCreate,
    handleUpdate,
    handleDelete,
    startEdit,
    startCreate,
    cancelEdit,
  };
}
