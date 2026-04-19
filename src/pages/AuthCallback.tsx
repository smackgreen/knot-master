import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import type { EmailOtpType } from '@supabase/supabase-js';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // This component handles three types of auth callbacks:
    // 1. OAuth redirects (Google) with PKCE code
    // 2. Email confirmation links in PKCE mode (token_hash + type)
    // 3. Transitional fallback for pre-PKCE confirmation links (hash fragment)
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback: Processing authentication callback");

        const queryParams = new URLSearchParams(window.location.search);
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');
        const code = queryParams.get('code');
        const tokenHash = queryParams.get('token_hash');
        const type = queryParams.get('type');

        // Check for error params from OAuth provider
        if (errorParam) {
          console.error(`Auth error: ${errorParam} - ${errorDescription}`);
          setError(`Authentication error: ${errorDescription || errorParam}`);
          setIsProcessing(false);
          return;
        }

        // Case 1: OAuth redirect with PKCE code (e.g., Google OAuth)
        if (code) {
          console.log("Auth callback: Processing PKCE code exchange");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Error exchanging code for session:", error);
            // Specific error for expired/already-used codes
            if (error.message.includes('code verifier') || error.message.includes('expired')) {
              setError('This sign-in link has expired. Please try signing in again.');
            } else {
              setError('There was a problem completing your sign in. Please try again.');
            }
            setIsProcessing(false);
            return;
          }

          if (data.session) {
            console.log("Auth callback: Session established successfully via PKCE");
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
            // AuthContext.onAuthStateChange will handle plan/return recovery
            window.location.href = `${window.location.origin}/app/dashboard`;
          } else {
            console.log("Auth callback: No session after code exchange");
            setError("No session was established. Please try signing in again.");
            setIsProcessing(false);
          }
          return;
        }

        // Case 2: Email confirmation in PKCE mode
        if (tokenHash && type) {
          console.log("Auth callback: Processing email confirmation via verifyOtp");

          // Validate type before casting — protects against malicious query params
          const validTypes: string[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];
          if (!validTypes.includes(type)) {
            console.warn("Auth callback: Invalid OTP type:", type);
            navigate('/login', { replace: true });
            return;
          }

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });

          if (error) {
            console.error("Error verifying OTP:", error);
            setError('There was a problem verifying your email. Please try again.');
            setIsProcessing(false);
            return;
          }

          if (data.session) {
            console.log("Auth callback: Email confirmed successfully");
            toast({
              title: "Email verified",
              description: "Your account has been confirmed.",
            });
            window.location.href = `${window.location.origin}/app/dashboard`;
          } else {
            setError("No session was established. Please try signing in again.");
            setIsProcessing(false);
          }
          return;
        }

        // Case 3: Transitional fallback for pre-PKCE confirmation links.
        // TODO: Remove this block once all pre-PKCE confirmation emails have expired.
        // Supabase confirmation links expire after 24 hours by default.
        // This fallback can be removed 24–48 hours after the PKCE migration deploys.
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log("Auth callback: Processing legacy hash fragment fallback");
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            window.location.href = `${window.location.origin}/app/dashboard`;
            return;
          }
        }

        // Case 4: No recognizable auth params
        console.log("Auth callback: No auth data found in URL, redirecting to login");
        navigate("/login", { replace: true });
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
