import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import SubscriptionManager from '@/components/account/SubscriptionManager';
import { User, Settings, CreditCard, LogOut, Home, LayoutDashboard } from 'lucide-react';

const AccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['account', 'common']);
  const { user, signOut, updateUserProfile } = useAuth();
  const { toast } = useToast();

  // Determine which tab to show based on URL
  const getDefaultTab = () => {
    const path = location.pathname;
    if (path.includes('/account/subscription')) return 'subscription';
    if (path.includes('/account/settings')) return 'settings';
    return 'profile';
  };

  const [activeTab, setActiveTab] = React.useState(getDefaultTab());
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.name || user?.user_metadata?.name || '',
    companyName: user?.companyName || user?.user_metadata?.company_name || '',
    phone: user?.phone || user?.user_metadata?.phone || '',
  });

  // Update form data when user profile changes
  React.useEffect(() => {
    if (user) {
      console.log("User profile updated:", user);
      console.log("User metadata:", user.user_metadata);
      console.log("User profile fields:", {
        name: user.name,
        companyName: user.companyName,
        phone: user.phone,
        profileImage: user.profileImage
      });

      setFormData({
        name: user.name || user.user_metadata?.name || '',
        companyName: user.companyName || user.user_metadata?.company_name || '',
        phone: user.phone || user.user_metadata?.phone || '',
      });
    }
  }, [user]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/account/${value === 'profile' ? '' : value}`, { replace: true });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateUserProfile({
        name: formData.name,
        companyName: formData.companyName,
        phone: formData.phone,
      });

      toast({
        title: t('profileUpdated'),
        description: t('profileUpdatedDescription'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profileUpdateError'),
        description: t('profileUpdateErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: t('signOutError'),
        description: t('signOutErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('notSignedIn')}</CardTitle>
            <CardDescription>{t('signInToViewAccount')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login?redirect=/account')}>
              {t('signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center gap-1"
        >
          <LayoutDashboard className="h-4 w-4" />
          {t('common:nav.dashboard')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          {t('common:home')}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profileImage || user.user_metadata?.avatar_url} />
                  <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{formData.name || user.email}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                orientation="vertical"
                className="w-full"
              >
                <TabsList className="flex flex-col h-auto items-start gap-1">
                  <TabsTrigger value="profile" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    {t('tabs.profile')}
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('tabs.subscription')}
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('tabs.settings')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-8">
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsContent value="profile" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profileInformation')}</CardTitle>
                  <CardDescription>{t('profileDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('emailCannotBeChanged')}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">{t('companyName')}</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">{t('phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? t('updating') : t('updateProfile')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="mt-0">
              <SubscriptionManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings')}</CardTitle>
                  <CardDescription>{t('settingsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="language">{t('language')}</Label>
                      <select
                        id="language"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="en">{t('languages.english')}</option>
                        <option value="fr">{t('languages.french')}</option>
                      </select>
                    </div>
                    <Button>
                      {t('saveSettings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
