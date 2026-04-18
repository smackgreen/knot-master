import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // This component handles the OAuth callback
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback: Processing authentication callback");

        // Check if we're being redirected from the production site
        const currentUrl = window.location.href;
        if (currentUrl.includes('lovable.app')) {
          console.log("Detected redirect from production site, redirecting to local login");
          // Extract any query parameters or hash fragments to preserve them
          const localUrl = window.location.origin + '/login';
          window.location.href = localUrl;
          return;
        }

        // Get the URL hash and parse it
        const hash = window.location.hash;
        const queryParams = new URLSearchParams(window.location.search);
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        if (errorParam) {
          console.error(`Auth error: ${errorParam} - ${errorDescription}`);
          setError(`Authentication error: ${errorDescription || errorParam}`);
          setIsProcessing(false);
          return;
        }

        if (!hash && !queryParams.has('code')) {
          console.log("No auth data found in URL, redirecting to login");
          navigate("/login", { replace: true });
          return;
        }

        // The hash or code contains the access token and other auth data
        // Supabase will automatically handle this when we call getSession
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error in auth callback:", error);
          setError("There was a problem completing your sign in. Please try again.");
          setIsProcessing(false);
          return;
        }

        if (data.session) {
          console.log("Auth callback: Session established successfully");
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
          });

          // Ensure we're redirecting to the local dashboard
          const localDashboard = window.location.origin + '/app/dashboard';
          window.location.href = localDashboard;
        } else {
          console.log("Auth callback: No session found after callback");
          setError("No session was established. Please try signing in again.");
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        setError("An unexpected error occurred. Please try again.");
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <p className="text-sm text-gray-500">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
