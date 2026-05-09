import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Heart, ArrowRight } from 'lucide-react';

const MarketingLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['nav']);
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className={`text-lg font-serif font-bold transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  Knot To It
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {[
                  { path: '/', label: t('nav:home', 'Home') },
                  { path: '/features', label: t('nav:features', 'Features') },
                  { path: '/pricing', label: t('nav:pricing', 'Pricing') },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/app/dashboard')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {t('nav:dashboard', 'Dashboard')}
                  </Button>
                  <Button
                    onClick={() => navigate('/account')}
                    className="bg-gradient-to-r from-rose-400 to-violet-500 text-white hover:opacity-90 shadow-sm"
                  >
                    {t('nav:account', 'Account')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {t('nav:login', 'Log In')}
                  </Button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="group flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-400 to-violet-500 text-white text-sm font-medium rounded-xl hover:opacity-90 shadow-sm shadow-rose-200/50 transition-all duration-300"
                  >
                    {t('nav:signup', 'Get Started')}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center">
                          <Heart className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-lg font-serif font-bold text-gray-900">Knot To It</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="text-gray-400">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Nav links */}
                    <nav className="flex flex-col gap-1 py-6">
                      {[
                        { path: '/', label: t('nav:home', 'Home') },
                        { path: '/features', label: t('nav:features', 'Features') },
                        { path: '/pricing', label: t('nav:pricing', 'Pricing') },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? 'text-gray-900 bg-gray-50'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Auth buttons */}
                    <div className="mt-auto border-t border-gray-100 py-6 space-y-3">
                      {user ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-center"
                            onClick={() => {
                              navigate('/app/dashboard');
                              setIsMenuOpen(false);
                            }}
                          >
                            {t('nav:dashboard', 'Dashboard')}
                          </Button>
                          <Button
                            className="w-full justify-center bg-gradient-to-r from-rose-400 to-violet-500 text-white"
                            onClick={() => {
                              navigate('/account');
                              setIsMenuOpen(false);
                            }}
                          >
                            {t('nav:account', 'Account')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-center"
                            onClick={() => {
                              navigate('/login');
                              setIsMenuOpen(false);
                            }}
                          >
                            {t('nav:login', 'Log In')}
                          </Button>
                          <button
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-violet-500 text-white text-sm font-medium rounded-xl"
                            onClick={() => {
                              navigate('/signup');
                              setIsMenuOpen(false);
                            }}
                          >
                            {t('nav:signup', 'Get Started Free')}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MarketingLayout;
