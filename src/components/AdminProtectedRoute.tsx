import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const AdminProtectedRoute = () => {
  const { user, session, isLoading, isAuthenticating } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data?.role === 'admin');
    };
    checkAdmin();
    return () => { cancelled = true; };
  }, [user?.id]);

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
};

