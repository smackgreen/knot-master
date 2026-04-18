import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setError(t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
          <CardDescription>
            {t('auth.resetPasswordInstructions')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {t('auth.resetPasswordSuccess')}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || success}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.sendResetLink')}
            </Button>
            
            <div className="text-center text-sm">
              <Link 
                to="/login" 
                className="text-primary hover:underline"
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
            
            <div className="text-center text-sm">
              <Link 
                to="/" 
                className="text-muted-foreground hover:underline"
              >
                {t('auth.backToHome')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
