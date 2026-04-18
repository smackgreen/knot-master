
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Users, FileText, Truck, Calendar, Save, Edit, X, Upload, Image, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { PLAN_DETAILS } from "@/services/stripeService";

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const { clients, vendors, tasks } = useApp();
  const { subscription } = useSubscription();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Company profile state
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // Logo upload state - using the same approach as profile photo
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load user data when component mounts or user data changes
  useEffect(() => {
    if (user) {
      console.log("Loading user profile data:", user);

      // Check if we have any company profile data
      const hasCompanyData = user.companyName || user.companyAddress || user.companyCity ||
                            user.companyPhone || user.companyEmail || user.companyWebsite ||
                            user.companyDescription || user.companyLogo;

      // If we don't have any company data, set isEditing to true to show the form
      if (!hasCompanyData && !isEditing) {
        setIsEditing(true);
      }

      // Always update local state with the latest user data
      // This ensures the component always displays the most current data
      setCompanyName(user.companyName || "");
      setCompanyAddress(user.companyAddress || "");
      setCompanyCity(user.companyCity || "");
      setCompanyPhone(user.companyPhone || "");
      setCompanyEmail(user.companyEmail || user.email || "");
      setCompanyWebsite(user.companyWebsite || "");
      setCompanyDescription(user.companyDescription || "");

      // For the logo, log the value to help with debugging
      console.log("Setting company logo from user data:", user.companyLogo);
      setCompanyLogo(user.companyLogo || null);
    }
  }, [user, isEditing]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      console.log("Starting profile save process...");

      // Prepare the profile data to update
      const profileData: any = {
        companyName,
        companyAddress,
        companyCity,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyDescription
      };

      // If we have a new logo, include it in the update
      // Using the same approach as profile photo - pass the data URL directly
      if (companyLogo) {
        profileData.companyLogo = companyLogo;
      }

      console.log("Updating user profile with data:", profileData);

      // Update the profile with all data
      await updateUserProfile(profileData);

      // Reset the logo file state since it's been saved
      setLogoFile(null);

      console.log("Profile update completed successfully");

      // Update local state with the saved values to ensure consistency
      // This ensures the view mode shows the correct data without needing a refresh
      if (user) {
        // The user object should have been updated by updateUserProfile
        setCompanyName(user.companyName || "");
        setCompanyAddress(user.companyAddress || "");
        setCompanyCity(user.companyCity || "");
        setCompanyPhone(user.companyPhone || "");
        setCompanyEmail(user.companyEmail || user.email || "");
        setCompanyWebsite(user.companyWebsite || "");
        setCompanyDescription(user.companyDescription || "");
        setCompanyLogo(user.companyLogo || null);
      }

      toast({
        title: t("settings.companyProfileUpdated"),
        description: t("settings.companyInfoSavedSuccess")
      });
      // Exit edit mode after successful save
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast({
        title: t("settings.errorSavingProfile"),
        description: t("settings.problemSavingCompanyInfo"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("settings.fileTooLarge"),
          description: t("settings.logoSizeLimit"),
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("settings.invalidFileType"),
          description: t("settings.pleaseUploadImage"),
          variant: "destructive"
        });
        return;
      }

      setLogoFile(file);

      // Create a preview URL - same approach as profile photo
      const reader = new FileReader();
      reader.onload = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleCancelEdit = () => {
    // Reset form to current user data
    if (user) {
      setCompanyName(user.companyName || "");
      setCompanyAddress(user.companyAddress || "");
      setCompanyCity(user.companyCity || "");
      setCompanyPhone(user.companyPhone || "");
      setCompanyEmail(user.companyEmail || user.email || "");
      setCompanyWebsite(user.companyWebsite || "");
      setCompanyDescription(user.companyDescription || "");
      setCompanyLogo(user.companyLogo || null);
      setLogoFile(null);
    }
    // Exit edit mode
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-serif font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" /> {t("settings.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          title={t("nav.clients")}
          value={clients.length.toString()}
          linkTo="/app/clients"
        />
        <StatCard
          icon={<Truck className="h-6 w-6" />}
          title={t("nav.vendors")}
          value={vendors.length.toString()}
          linkTo="/app/vendors"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          title={t("nav.tasks")}
          value={tasks.length.toString()}
          linkTo="/app/tasks"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("settings.companyProfile")}</CardTitle>
              <CardDescription>{t("settings.updateBusinessInfo")}</CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                {t("common.edit")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                {/* Company Logo - using the same approach as profile photo */}
                <div className="mb-6">
                  <Label className="block mb-2">{t("settings.companyLogo")}</Label>
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                    <div className="relative">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt={t("settings.companyLogo")}
                          className="w-32 h-32 object-contain border rounded-md"
                        />
                      ) : (
                        <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted">
                          <Image className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}

                      <label
                        htmlFor="logo-upload"
                        className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer"
                      >
                        <Upload size={16} />
                        <span className="sr-only">{t("settings.changeCompanyLogo")}</span>
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{t("settings.companyLogo")}</p>
                      <p>{t("settings.uploadLogoInstructions")}</p>
                      <p>{t("settings.logoRequirements")}</p>
                      {companyLogo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCompanyLogo(null);
                            setLogoFile(null);
                          }}
                          className="mt-2 text-destructive hover:text-destructive p-0 h-auto"
                        >
                          {t("settings.removeLogo")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t("settings.businessName")}</Label>
                    <Input
                      id="businessName"
                      placeholder={t("settings.businessNamePlaceholder")}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">{t("settings.website")}</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder={t("settings.websitePlaceholder")}
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("settings.businessEmail")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("settings.businessEmailPlaceholder")}
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("settings.businessPhone")}</Label>
                    <Input
                      id="phone"
                      placeholder={t("settings.businessPhonePlaceholder")}
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t("settings.businessAddress")}</Label>
                    <Input
                      id="address"
                      placeholder={t("settings.businessAddressPlaceholder")}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("settings.cityStateZip")}</Label>
                    <Input
                      id="city"
                      placeholder={t("settings.cityStateZipPlaceholder")}
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="description">{t("settings.businessDescription")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t("settings.businessDescriptionPlaceholder")}
                      rows={4}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isLoading ? t("common.updating") : t("settings.saveProfile")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Company Logo - using the same approach as profile photo */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t("settings.companyLogo")}</p>
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={t("settings.companyLogo")}
                        className="w-32 h-32 object-contain border rounded-md"
                      />
                    ) : (
                      <div className="w-32 h-32 border rounded-md flex flex-col items-center justify-center bg-muted">
                        <Image className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t("settings.noLogoSet")}</p>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p>{t("settings.logoAppearOnDocuments")}</p>
                      <p>{t("settings.clickEditToChangeLogo")}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.businessName")}</p>
                    <p className="text-base">{companyName || t("clients.notSet")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.website")}</p>
                    <p className="text-base">{companyWebsite || t("clients.notSet")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.businessEmail")}</p>
                    <p className="text-base">{companyEmail || t("clients.notSet")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.businessPhone")}</p>
                    <p className="text-base">{companyPhone || t("clients.notSet")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.businessAddress")}</p>
                    <p className="text-base">{companyAddress || t("clients.notSet")}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.cityStateZip")}</p>
                    <p className="text-base">{companyCity || t("clients.notSet")}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t("settings.businessDescription")}</p>
                    <p className="text-base">{companyDescription || t("clients.notSet")}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col items-start space-y-4 pt-6">
            <div>
              <CardTitle className="text-lg mb-2">{t("settings.intakeForm")}</CardTitle>
              <CardDescription>
                {t("settings.intakeFormDescription")}
              </CardDescription>
            </div>
            <div className="w-full flex flex-col md:flex-row gap-4 items-center">
              <Input
                readOnly
                value={`${companyWebsite ? companyWebsite : 'https://yourwebsite.com'}/intake-form`}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button variant="outline">{t("settings.copyLink")}</Button>
                <Button>
                  <Link to="/intake-form">{t("settings.preview")}</Link>
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Subscription Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("settings.subscription")}</CardTitle>
              <CardDescription>{t("settings.manageSubscription")}</CardDescription>
            </div>
            <Button
              onClick={() => navigate('/account/subscription')}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-4 w-4" />
              {t("settings.managePlan")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{t("settings.currentPlan")}</p>
                  <p className="text-muted-foreground">{t("settings.subscriptionDetails")}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {subscription ? (
                      subscription.planId === 'free' ?
                        t("pricing.plans.free.name") :
                        subscription.planId === 'starter' ?
                          t("pricing.plans.starter.name") :
                          t("pricing.plans.pro.name")
                    ) : t("pricing.plans.free.name")}
                  </p>
                  <p className="text-muted-foreground">
                    {subscription && subscription.planId !== 'free' ? (
                      subscription.billingCycle === 'monthly' ?
                        `$${PLAN_DETAILS[subscription.planId].price}/mo` :
                        `$${PLAN_DETAILS[subscription.planId].yearlyPrice}/yr`
                    ) : t("pricing.free")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{t("settings.features")}</p>
                  <p className="text-muted-foreground">{t("settings.availableFeatures")}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  {t("settings.comparePlans")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FeatureItem
                  feature="budgetTracking"
                  name={t("settings.featureItems.budgetTracking")}
                  included={subscription ?
                    PLAN_DETAILS[subscription.planId]?.features.budgetTracking :
                    PLAN_DETAILS.free.features.budgetTracking}
                />
                <FeatureItem
                  feature="invoicing"
                  name={t("settings.featureItems.invoicing")}
                  included={subscription ?
                    PLAN_DETAILS[subscription.planId]?.features.invoicing :
                    PLAN_DETAILS.free.features.invoicing}
                />
                <FeatureItem
                  feature="seatingCharts"
                  name={t("settings.featureItems.seatingCharts")}
                  included={subscription ?
                    PLAN_DETAILS[subscription.planId]?.features.seatingCharts :
                    PLAN_DETAILS.free.features.seatingCharts}
                />
                <FeatureItem
                  feature="mealPlanning"
                  name={t("settings.featureItems.mealPlanning")}
                  included={subscription ?
                    PLAN_DETAILS[subscription.planId]?.features.mealPlanning :
                    PLAN_DETAILS.free.features.mealPlanning}
                />
                <FeatureItem
                  feature="designSuggestions"
                  name={t("settings.featureItems.designSuggestions")}
                  included={subscription ?
                    PLAN_DETAILS[subscription.planId]?.features.designSuggestions :
                    PLAN_DETAILS.free.features.designSuggestions}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.applicationSettings")}</CardTitle>
            <CardDescription>{t("settings.configureAppPreferences")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{t("settings.demoDescription")}</p>

            <div className="flex flex-col md:flex-row gap-4">
              <Button variant="outline">{t("settings.exportData")}</Button>
              <Button variant="outline">{t("settings.resetDemoData")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  linkTo: string;
}

// Feature item component for subscription settings
interface FeatureItemProps {
  feature: string;
  name: string;
  included: boolean;
}

const FeatureItem = ({ feature, name, included }: FeatureItemProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center p-3 rounded-md border">
      <div>
        <p className="font-medium">{name}</p>
      </div>
      <div>
        {included ? (
          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
            {t("settings.included")}
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/pricing')}
          >
            {t("settings.upgrade")}
          </Button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, linkTo }: StatCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link to={linkTo}>{t("settings.view")} {title}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
