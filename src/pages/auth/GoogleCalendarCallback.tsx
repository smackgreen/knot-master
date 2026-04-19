import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import calendarService from "@/services/CalendarService";
import { useTranslation } from "react-i18next";

const GoogleCalendarCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Guard to prevent duplicate OAuth callback execution.
  // Google auth codes are single-use; if the useEffect re-runs (e.g. when
  // `user` transitions from null → authenticated), the same code would be
  // sent again, causing Google to return invalid_grant.
  const hasExchanged = useRef(false);

  useEffect(() => {
    // Skip if we've already attempted the code exchange
    if (hasExchanged.current) return;

    const handleCallback = async () => {
      try {
        if (!user) {
          // Don't set error or stop processing — wait for user to load.
          // The effect will re-run when `user` changes.
          return;
        }

        // Mark as exchanged BEFORE the async call to prevent duplicates
        hasExchanged.current = true;

        // Get the code and state from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          const error = urlParams.get('error');
          if (error === 'access_denied') {
            setError(t('calendar.auth.accessDenied'));
          } else {
            setError(t('calendar.auth.noCode'));
          }
          setIsProcessing(false);
          return;
        }

        if (!state) {
          setError(t('calendar.auth.noState'));
          setIsProcessing(false);
          return;
        }

        // Set the user in the calendar service
        calendarService.setUser(user);

        // Handle the OAuth callback
        const success = await calendarService.handleOAuthCallback(code, state);

        if (success) {
          toast({
            title: t('calendar.auth.success'),
            description: t('calendar.auth.successDescription'),
          });
          navigate("/app/calendar");
        } else {
          setError(t('calendar.auth.failed'));
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Error handling Google Calendar callback:", error);
        setError(t('calendar.auth.unexpectedError'));
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [user, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('calendar.auth.connectionFailed')}</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/app/calendar", { replace: true })}
            className="w-full"
          >
            {t('calendar.auth.returnToCalendar')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <p className="text-sm text-gray-500">{t('calendar.auth.connecting')}</p>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
