import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({
  children,
  redirectTo = "/app/dashboard"
}: PublicRouteProps) => {
  const { user, session } = useAuth();
  const location = useLocation();

  // Get the redirect path from the location state or URL parameters
  const from = location.state?.from?.pathname ||
               new URLSearchParams(location.search).get("redirect") ||
               redirectTo;

  // If user is already authenticated and this is a login/signup page,
  // redirect them to the dashboard or the page they were trying to access
  if (user && session) {
    return <Navigate to={from} replace />;
  }

  // Otherwise, render the public route
  return <>{children}</>;
};
