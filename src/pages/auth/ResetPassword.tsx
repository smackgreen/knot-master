import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the reset token from the URL
  const queryParams = new URLSearchParams(location.search);
  const resetToken = queryParams.get('token');
  
  useEffect(() => {
    // Redirect if no token is present
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!resetToken) {
        throw new Error('No reset token found');
      }
      
      await updatePassword(resetToken, password);
      navigate('/login', { 
        replace: true,
        state: { message: t('auth.passwordUpdated') }
      });
    } catch (error) {
      console.error('Reset password error:', error);
      setError(t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
          <CardDescription>
            {t('auth.enterNewPassword')}
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
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.updatePassword')}
            </Button>
            
            <div className="text-center text-sm">
              <Link 
                to="/login" 
                className="text-primary hover:underline"
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
