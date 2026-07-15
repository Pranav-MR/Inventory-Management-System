import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
