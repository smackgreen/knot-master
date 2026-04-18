import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

interface EmailAuthFormProps {
  defaultTab?: "login" | "signup";
  selectedPlan?: string | null;
}

export const EmailAuthForm = ({ defaultTab = "login", selectedPlan = null }: EmailAuthFormProps) => {
  const { signIn, signUp, isAuthenticating } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t('auth.enterBothFields'));
      return;
    }

    try {
      const result = await signIn(email, password);
      if (result?.success) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });

        // Navigate to dashboard or the page the user was trying to access
        const from = location.state?.from?.pathname || "/app/dashboard";
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || t('auth.loginFailed'));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!email || !password || !companyName || !fullName) {
      setError(t('auth.enterAllRequiredFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    try {
      // Include additional metadata for the wedding planner
      const metadata = {
        full_name: fullName,
        company_name: companyName,
        phone_number: phoneNumber
      };

      const result = await signUp(email, password, metadata);

      if (result?.success) {
        toast({
          title: t('auth.signupSuccess'),
          description: t('auth.accountCreatedSuccess'),
        });

        if (result.requiresEmailConfirmation) {
          // If email confirmation is required, redirect to login page
          navigate('/login', { replace: true });
        } else {
          // If a plan was selected, redirect to subscription page
          if (selectedPlan) {
            navigate(`/account/subscription?plan=${selectedPlan}`, { replace: true });
          } else {
            // Otherwise redirect to dashboard
            navigate('/app/dashboard', { replace: true });
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || t('auth.signupFailed'));
    }
  };

  return (
    <Card className="w-full">
      <Tabs defaultValue={defaultTab} onValueChange={(value) => {
        setActiveTab(value as "login" | "signup");
        setError(null);
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
          <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>{t('auth.loginWithEmail')}</CardTitle>
              <CardDescription>{t('auth.enterEmailPassword')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full py-6"
                disabled={isAuthenticating || !email || !password}
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin mr-2"></div>
                ) : null}
                {t('auth.login')}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t('auth.noAccount')}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("signup")}
                >
                  {t('auth.signup')}
                </button>
              </p>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignup}>
            <CardHeader>
              <CardTitle>{t('auth.createAccount')}</CardTitle>
              <CardDescription>{t('auth.enterDetailsForAccount')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Company Information */}
              <div className="space-y-2">
                <Label htmlFor="company-name">{t('auth.companyName')}</Label>
                <Input
                  id="company-name"
                  placeholder={t('auth.companyNamePlaceholder')}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-2">
                <Label htmlFor="full-name">{t('auth.fullName')}</Label>
                <Input
                  id="full-name"
                  placeholder={t('auth.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-number">{t('auth.phoneNumber')}</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder={t('auth.phoneNumberPlaceholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">{t('auth.phoneNumberOptional')}</p>
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <Label htmlFor="signup-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('auth.passwordRequirements')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full py-6"
                disabled={isAuthenticating || !email || !password || !confirmPassword || !companyName || !fullName || password !== confirmPassword}
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin mr-2"></div>
                ) : null}
                {t('auth.createAccount')}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t('auth.hasAccount')}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setActiveTab("login")}
                >
                  {t('auth.login')}
                </button>
              </p>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default EmailAuthForm;
