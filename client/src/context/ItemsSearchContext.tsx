import { createContext, useContext, useState, type ReactNode } from 'react';

interface ItemsSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

const ItemsSearchContext = createContext<ItemsSearchContextValue | undefined>(undefined);

/**
 * In-memory (not URL or storage-backed) so the query survives navigating
 * between the Items list and an item's detail page — AppShell, where this
 * provider lives, never unmounts during in-app navigation — but resets on an
 * actual page reload, matching the product requirement exactly.
 */
export function ItemsSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  return <ItemsSearchContext.Provider value={{ query, setQuery }}>{children}</ItemsSearchContext.Provider>;
}

export function useItemsSearch() {
  const ctx = useContext(ItemsSearchContext);
  if (!ctx) throw new Error('useItemsSearch must be used within ItemsSearchProvider');
  return ctx;
}
