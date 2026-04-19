
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, isLoading, isAuthenticating } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute: Authentication state", {
      isAuthenticated: !!user && !!session,
      isLoading,
      isAuthenticating,
      currentPath: location.pathname,
      hasSession: !!session,
      hasUser: !!user
    });
  }, [user, isLoading, location.pathname, session, isAuthenticating]);

  // Show loading state if we're loading or in the process of authenticating
  if (isLoading || isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-wedding-blush rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (need both user and session)
  if (!user || !session) {
    console.log("User not fully authenticated, redirecting to login");
    // Save the intended destination for post-OAuth redirect.
    // This is read by AuthContext.onAuthStateChange after a successful
    // Google OAuth flow to redirect the user back to where they were going.
    sessionStorage.setItem('post_oauth_return', location.pathname + location.search);
    // Save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  console.log("User authenticated, rendering protected content");
  return children ? <>{children}</> : <Outlet />;
};
