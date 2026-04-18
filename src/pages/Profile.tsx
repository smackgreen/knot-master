import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User } from "lucide-react";
import { format } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { user, updateUserProfile, isLoading } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || "");

  // State for image upload (mock implementation)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<typeof user> = {};

    if (name !== user.name) {
      updates.name = name;
    }

    if (previewUrl) {
      // In a real app, you'd upload the image and get a URL back
      updates.profileImage = previewUrl;
    }

    if (Object.keys(updates).length > 0) {
      await updateUserProfile(updates);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-serif font-bold mb-6">{t('profile.yourProfile')}</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.profileInformation')}</CardTitle>
            <CardDescription>
              {t('profile.updatePersonalDetails')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t('profile.changeProfilePicture')}
                    className="rounded-full w-24 h-24 object-cover border"
                  />
                ) : (
                  <UserAvatar className="w-24 h-24" />
                )}

                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
                >
                  <User size={16} />
                  <span className="sr-only">{t('profile.changeProfilePicture')}</span>
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{t('profile.profilePhoto')}</p>
                <p>{t('profile.uploadInstructions')}</p>
                <p>{t('profile.imageRequirements')}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">{t('profile.fullName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('profile.fullNamePlaceholder')}
                />
              </div>

              {/* Email (read-only) */}
              <div className="grid gap-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input
                  id="email"
                  value={user.email || ""}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">{t('profile.emailCannotBeChanged')}</p>
              </div>



              <div className="text-sm text-muted-foreground mt-2">
                <p>{t('profile.accountCreatedOn', { date: user.created_at ? format(new Date(user.created_at), "PPP") : t('common.notApplicable') })}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="ml-auto flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              {t('profile.saveChanges')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Profile;
