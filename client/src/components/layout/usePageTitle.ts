import { useLocation, useParams } from 'react-router-dom';

export function usePageTitle(): string {
  const location = useLocation();
  const { itemId } = useParams<{ itemId?: string }>();

  if (location.pathname === '/notifications') return 'Notifications';
  if (itemId) return 'Item details';
  if (location.pathname.startsWith('/items')) return 'Items';
  if (location.pathname.startsWith('/dashboard')) return 'Dashboard';
  return 'Inventory';
}
