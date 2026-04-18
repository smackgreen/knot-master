
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

interface UserAvatarProps {
  className?: string;
}

export const UserAvatar = ({ className }: UserAvatarProps) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Generate initials from name or use first letter of email
  const initials = user.name 
    ? user.name.split(" ").map(name => name[0]).join("").toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <Avatar className={className}>
      <AvatarImage src={user.profileImage || undefined} alt={user.name || user.email || "User"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};
