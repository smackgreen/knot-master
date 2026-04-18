import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import EmailAuthForm from "@/components/auth/EmailAuthForm";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Login = () => {
  const { isLoading, user, session, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.log("Login page: Checking authentication state:", {
      user: !!user,
      session: !!session,
      isAuthenticating,
      userId: user?.id,
      pathname: location.pathname
    });

    // If user is already authenticated, redirect to dashboard
    if (user && session) {
      console.log("Login page: User already authenticated, redirecting to dashboard");
      const from = location.state?.from?.pathname || "/app/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, session, navigate, location, isAuthenticating]);

  // Show loading state if we're loading auth data or in the process of authenticating
  if (isLoading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          <p className="text-sm text-gray-500">
            {isAuthenticating ? t('auth.authenticating') : t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Don't show login page if user is already authenticated
  if (user && session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-2">
      <div className="w-full space-y-8">
        <div className="text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageSwitcher />
          </div>
          <HeartHandshake className="mx-auto h-16 w-16 text-wedding-blush" />
          <h1 className="mt-6 text-4xl font-serif font-bold text-wedding-navy">
            Knot To It
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('app.tagline')}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg sm:px-10 max-w-md mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-2">{t('auth.login')}</h2>
            <p className="text-sm text-gray-600">
              {t('app.title')}
            </p>
          </div>

          <div className="space-y-6">
            {/* Email Authentication Form */}
            <EmailAuthForm />

            <div className="text-sm text-center text-gray-500">
              {t('auth.termsNotice')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
