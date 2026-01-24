/**
 * useTabs Hook
 *
 * Generic hook for managing tab state.
 * Reduces boilerplate in components with tabbed interfaces.
 */

import { useCallback, useState } from 'react';

export function useTabs<T extends string>(initialTab: T) {
  const [activeTab, setActiveTab] = useState<T>(initialTab);

  const setTab = useCallback((tab: T) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    setTab,
    isTabActive: (tab: T) => activeTab === tab,
  };
}

export default useTabs;
