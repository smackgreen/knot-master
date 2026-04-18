
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Save, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { UserProfile } from "@/types/auth";

const Profile = () => {
  const { user, updateUserProfile, isLoading } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [weddingDate, setWeddingDate] = useState<Date | null>(
    user?.weddingDate ? new Date(user.weddingDate) : null
  );
  
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
    
    const updates: Partial<UserProfile> = {};
    
    if (name !== user.name) {
      updates.name = name;
    }
    
    if (weddingDate !== (user.weddingDate ? new Date(user.weddingDate) : null)) {
      updates.weddingDate = weddingDate;
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
      <h1 className="text-3xl font-serif font-bold mb-6">Your Profile</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details and wedding information
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              <div className="relative">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile preview" 
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
                  <span className="sr-only">Change profile picture</span>
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
                <p className="font-medium">Profile Photo</p>
                <p>Upload a new profile picture by clicking on the icon.</p>
                <p>Square images work best. Maximum size 5MB.</p>
              </div>
            </div>
            
            <div className="grid gap-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" 
                />
              </div>
              
              {/* Email (read-only) */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={user.email || ""} 
                  readOnly 
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              
              {/* Wedding Date picker */}
              <div className="grid gap-2">
                <Label htmlFor="wedding-date">Wedding Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="wedding-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !weddingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {weddingDate ? format(weddingDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={weddingDate || undefined}
                      onSelect={setWeddingDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">This helps us plan your wedding timeline</p>
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                <p>Account created on {user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}</p>
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
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Profile;
