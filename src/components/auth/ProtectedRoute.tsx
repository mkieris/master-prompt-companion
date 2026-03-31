import { Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  session: Session | null;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function ProtectedRoute({ session, isLoading, children }: ProtectedRouteProps) {
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
