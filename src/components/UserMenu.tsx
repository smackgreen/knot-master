
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  // Display name or email if name is not available
  const displayName = user.name || user.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none flex items-center gap-2">
          <UserAvatar />
          <span className="hidden md:block text-sm font-medium">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/app/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>{t('nav.profile')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/app/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('nav.settings')}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('nav.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
