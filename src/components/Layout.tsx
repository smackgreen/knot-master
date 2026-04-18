
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { SubscriptionStatusIndicator } from "./subscription/SubscriptionStatusIndicator";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                      lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full lg:w-[calc(100%-16rem)]">
        {/* Top navigation bar */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground lg:hidden"
          >
            <Menu size={24} />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {user && <SubscriptionStatusIndicator />}
            <LanguageSwitcher />
            {user && <UserMenu />}
          </div>
        </div>

        <div className="p-2 md:p-3 w-full">
          <Outlet />
        </div>
      </div>

      {/* Overlay for mobile view when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
