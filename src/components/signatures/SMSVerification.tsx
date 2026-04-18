import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { sendVerificationCode, verifyCode } from '@/services/smsService';

interface SMSVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

const SMSVerification: React.FC<SMSVerificationProps> = ({
  phoneNumber,
  onVerificationSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);

  // Send verification code when component mounts
  useEffect(() => {
    sendCode();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Basic formatting, could be improved based on country codes
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    return phone;
  };

  // Send verification code
  const sendCode = async () => {
    setIsSending(true);
    try {
      const success = await sendVerificationCode(phoneNumber);
      
      if (success) {
        toast({
          title: t('signatures.codeSent'),
          description: t('signatures.codeSentDescription'),
        });
        setTimeLeft(60); // 60 seconds cooldown
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: t('signatures.errorSendingCode'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Verify the code
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: t('signatures.invalidCode'),
        description: t('signatures.enterValidCode'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyCode(phoneNumber, verificationCode);
      
      if (success) {
        toast({
          title: t('signatures.verificationSuccess'),
          description: t('signatures.verificationSuccessDescription'),
        });
        onVerificationSuccess();
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts >= 2) {
          toast({
            title: t('signatures.tooManyAttempts'),
            description: t('signatures.tryAgainLater'),
            variant: 'destructive',
          });
          onCancel();
        } else {
          toast({
            title: t('signatures.incorrectCode'),
            description: t('signatures.tryAgain'),
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: t('signatures.errorVerifyingCode'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">{t('signatures.verifyPhone')}</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t('signatures.verifyPhoneDescription', { phone: formatPhoneNumber(phoneNumber) })}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-code">{t('signatures.verificationCode')}</Label>
          <Input
            id="verification-code"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
            maxLength={6}
            disabled={isLoading}
            className="text-center text-lg tracking-widest"
          />
        </div>

        <div className="flex justify-center">
          <Button
            variant="link"
            size="sm"
            onClick={sendCode}
            disabled={timeLeft > 0 || isSending}
            className="text-xs"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                {t('signatures.sendingCode')}
              </>
            ) : timeLeft > 0 ? (
              t('signatures.resendCodeIn', { seconds: timeLeft })
            ) : (
              t('signatures.resendCode')
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('signatures.verifying')}
            </>
          ) : (
            t('signatures.verify')
          )}
        </Button>
      </div>
    </div>
  );
};

export default SMSVerification;
