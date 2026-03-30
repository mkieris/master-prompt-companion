import { Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  session: Session | null;
  children: React.ReactNode;
}

export function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
