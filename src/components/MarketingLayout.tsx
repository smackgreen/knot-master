import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

const MarketingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['nav']);
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // No need to redirect authenticated users from marketing pages
  // They should be able to browse the website even when logged in

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">Knot To It</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('nav:home')}
                </Link>
                <Link
                  to="/features"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/features') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('nav:features')}
                </Link>
                <Link
                  to="/pricing"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/pricing') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('nav:pricing')}
                </Link>
              </nav>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/app/dashboard')}>
                    {t('nav:dashboard')}
                  </Button>
                  <Button onClick={() => navigate('/account')}>
                    {t('nav:account')}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    {t('nav:login')}
                  </Button>
                  <Button onClick={() => navigate('/signup')}>
                    {t('nav:signup')}
                  </Button>
                </>
              )}
            </div>
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between border-b py-4">
                      <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <span className="text-xl font-bold text-primary">Knot To It</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </div>
                    <nav className="flex flex-col gap-4 py-6">
                      <Link
                        to="/"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          isActive('/') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('nav:home')}
                      </Link>
                      <Link
                        to="/features"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          isActive('/features') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('nav:features')}
                      </Link>
                      <Link
                        to="/pricing"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          isActive('/pricing') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('nav:pricing')}
                      </Link>
                    </nav>
                    <div className="mt-auto border-t py-6">
                      {user ? (
                        <div className="flex flex-col gap-4">
                          <Button variant="outline" onClick={() => {
                            navigate('/app/dashboard');
                            setIsMenuOpen(false);
                          }}>
                            {t('nav:dashboard')}
                          </Button>
                          <Button onClick={() => {
                            navigate('/account');
                            setIsMenuOpen(false);
                          }}>
                            {t('nav:account')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <Button variant="outline" onClick={() => {
                            navigate('/login');
                            setIsMenuOpen(false);
                          }}>
                            {t('nav:login')}
                          </Button>
                          <Button onClick={() => {
                            navigate('/signup');
                            setIsMenuOpen(false);
                          }}>
                            {t('nav:signup')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MarketingLayout;
