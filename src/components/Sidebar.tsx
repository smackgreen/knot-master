
import { NavLink } from "react-router-dom";
import {
  Users,
  Truck,
  CheckSquare,
  Settings,
  Calendar,
  HeartHandshake,
  FileText,
  Palette,
  DollarSign,
  FileSignature,
  FileStack,
  FileDigit,
  PenTool,
  BarChart3,
  Package
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="w-64 h-full bg-white border-r flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2 text-wedding-navy">
          <HeartHandshake className="text-wedding-blush" size={24} />
          <span>Knot To It</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('app.title')}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        <NavItem to="/app/dashboard" icon={<Calendar size={18} />} text={t('nav.dashboard')} />
        <NavItem to="/app/clients" icon={<Users size={18} />} text={t('nav.clients')} />
        <NavItem to="/app/vendors" icon={<Truck size={18} />} text={t('nav.vendors')} />
        <NavItem to="/app/tasks" icon={<CheckSquare size={18} />} text={t('nav.tasks')} />
        <NavItem to="/app/calendar" icon={<Calendar size={18} />} text={t('nav.calendar')} />
        <NavItem to="/app/invoices" icon={<FileText size={18} />} text={t('nav.invoices')} />
        <NavItem to="/app/contracts" icon={<FileSignature size={18} />} text={t('nav.contracts')} />
        <NavItem to="/app/contract-templates" icon={<FileStack size={18} />} text={t('nav.contractTemplates')} />
        <NavItem to="/app/documents" icon={<FileDigit size={18} />} text={t('nav.documents')} />
        <NavItem to="/app/signatures" icon={<PenTool size={18} />} text={t('nav.signatures')} />
        <NavItem to="/app/analytics" icon={<BarChart3 size={18} />} text={t('nav.analytics')} />
        <NavItem to="/app/resources" icon={<Package size={18} />} text={t('nav.resources')} />
        <NavItem to="/app/settings" icon={<Settings size={18} />} text={t('nav.settings')} />
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Knot To It</p>
        <p>{t('app.tagline')}</p>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const NavItem = ({ to, icon, text }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex w-full items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors cursor-pointer select-none
      ${isActive
        ? 'bg-wedding-blush text-primary-foreground'
        : 'text-foreground hover:bg-muted hover:text-foreground'
      }
    `}
  >
    <span className="shrink-0">{icon}</span>
    <span className="flex-1">{text}</span>
  </NavLink>
);

export default Sidebar;
