import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  // /app is the universal sign-in surface now (2026-09-17 rework) — it
  // shows a real sign-in form when signed out and, once authenticated,
  // surfaces links to whichever of Platform Admin / City Admin / a
  // specific business dashboard the account actually has access to.
  if (!user) return <Navigate to="/app" replace />;

  return <>{children}</>;
}
