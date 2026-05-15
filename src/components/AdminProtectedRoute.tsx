import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AdminProtectedRouteProps {
  children?: ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, session, isLoading, isAuthenticating } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      if (!user?.id) {
        console.log('[AdminRoute] No user ID available');
        setIsAdmin(false);
        return;
      }

      console.log('[AdminRoute] Checking admin role for user:', user.id);

      // Method 1: Check user.role from AuthContext profile fetch (already available)
      if (user.role === 'admin') {
        console.log('[AdminRoute] Admin confirmed via user.role from AuthContext');
        if (!cancelled) setIsAdmin(true);
        return;
      }

      // Method 2: Direct query to profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('[AdminRoute] Error querying profiles.role:', error);
          // Don't give up yet — try a raw RPC call as fallback
          setIsAdmin(false);
          return;
        }

        console.log('[AdminRoute] Profile query result:', { data, role: data?.role });

        if (data?.role === 'admin') {
          console.log('[AdminRoute] Admin confirmed via profiles query');
          setIsAdmin(true);
          return;
        }

        // Method 3: Try the is_admin() RPC function as a final fallback
        const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)('is_admin');

        if (cancelled) return;

        if (rpcError) {
          console.error('[AdminRoute] Error calling is_admin RPC:', rpcError);
          setIsAdmin(false);
          return;
        }

        console.log('[AdminRoute] is_admin RPC result:', rpcResult);
        setIsAdmin(!!rpcResult);
      } catch (err) {
        console.error('[AdminRoute] Unexpected error during admin check:', err);
        if (!cancelled) setIsAdmin(false);
      }
    };

    checkAdmin();
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  // Show loading state if we're loading or in the process of authenticating or checking admin
  if (isLoading || isAuthenticating || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-wedding-blush rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    console.log('[AdminRoute] No user/session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('[AdminRoute] User is not admin, redirecting to /app/dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  console.log('[AdminRoute] Admin access granted');
  return children ? <>{children}</> : <Outlet />;
};
