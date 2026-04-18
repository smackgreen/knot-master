import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { sendTestEmail } from '@/services/emailService';
import { useTranslation } from 'react-i18next';

interface TestEmailButtonProps {
  recipientEmail?: string;
  recipientName?: string;
}

const TestEmailButton: React.FC<TestEmailButtonProps> = ({
  recipientEmail = '',
  recipientName = '',
}) => {
  const { t } = useTranslation();
  const [isSending, setIsSending] = useState(false);

  const handleTestEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: t('signatures.emailRequired'),
        description: t('signatures.pleaseEnterEmail'),
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Send the test email using the dedicated test email function
      console.log('Sending test email to:', recipientEmail);
      const success = await sendTestEmail(
        recipientEmail,
        recipientName
      );

      if (success) {
        toast({
          title: t('signatures.testEmailSent'),
          description: t('signatures.checkInbox', { email: recipientEmail }),
        });

        // Only show the simulation message if we're in development mode
        if (import.meta.env.DEV) {
          toast({
            title: 'Email Simulation',
            description: 'Check the browser console to see the simulated email content',
          });
        }
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: t('signatures.testEmailFailed'),
        description: t('signatures.errorSendingEmail'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTestEmail}
      disabled={isSending}
    >
      {isSending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('signatures.sendingTestEmail')}
        </>
      ) : (
        t('signatures.sendTestEmail')
      )}
    </Button>
  );
};

export default TestEmailButton;
