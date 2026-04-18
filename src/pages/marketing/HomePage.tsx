import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Users,
  Calendar,
  CheckSquare,
  CreditCard,
  UserPlus,
  LayoutGrid,
  Utensils,
  Palette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const FeatureCard = ({ icon, title, description, onClick }: FeatureCardProps) => (
  <div
    className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-16 bg-primary/10 text-center">
        <div className="container px-4 mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className="text-primary">Knot To It</span> {t('marketing:tagline')}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            {t('marketing:heroDescription')}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" onClick={() => navigate('/signup')}>
              {t('marketing:getStarted')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/pricing')}>
              {t('marketing:viewPricing')}
            </Button>
          </div>

          <div className="relative mt-8 max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent h-20 bottom-0 z-10"></div>
            <img
              src="/images/dashboard-preview.svg"
              alt="Knot To It Dashboard Preview"
              className="rounded-lg shadow-xl max-w-full mx-auto border border-primary/20"
              style={{ maxHeight: '500px' }}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/1200x600/f8f9fa/6c757d?text=Dashboard+Preview';
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 bg-background">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">
            {t('marketing:featuresTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Users className="h-12 w-12 text-primary" />}
              title={t('marketing:features.clientManagement.title')}
              description={t('marketing:features.clientManagement.description')}
              onClick={() => navigate('/features#client-management')}
            />
            <FeatureCard
              icon={<Calendar className="h-12 w-12 text-primary" />}
              title={t('marketing:features.weddingTimelines.title')}
              description={t('marketing:features.weddingTimelines.description')}
              onClick={() => navigate('/features#wedding-timelines')}
            />
            <FeatureCard
              icon={<CheckSquare className="h-12 w-12 text-primary" />}
              title={t('marketing:features.taskTracking.title')}
              description={t('marketing:features.taskTracking.description')}
              onClick={() => navigate('/features#task-tracking')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<CreditCard className="h-12 w-12 text-primary" />}
              title={t('marketing:features.budgetTracking.title')}
              description={t('marketing:features.budgetTracking.description')}
              onClick={() => navigate('/features#budget-tracking')}
            />
            <FeatureCard
              icon={<UserPlus className="h-12 w-12 text-primary" />}
              title={t('marketing:features.guestManagement.title')}
              description={t('marketing:features.guestManagement.description')}
              onClick={() => navigate('/features#guest-management')}
            />
            <FeatureCard
              icon={<LayoutGrid className="h-12 w-12 text-primary" />}
              title={t('marketing:features.seatingCharts.title')}
              description={t('marketing:features.seatingCharts.description')}
              onClick={() => navigate('/features#seating-charts')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <FeatureCard
              icon={<Utensils className="h-12 w-12 text-primary" />}
              title={t('marketing:features.mealPlanning.title')}
              description={t('marketing:features.mealPlanning.description')}
              onClick={() => navigate('/features#meal-planning')}
            />
            <FeatureCard
              icon={<Palette className="h-12 w-12 text-primary" />}
              title={t('marketing:features.designSuggestions.title')}
              description={t('marketing:features.designSuggestions.description')}
              onClick={() => navigate('/features#design-suggestions')}
            />
          </div>

          <div className="text-center mb-8">
            <Button size="lg" onClick={() => navigate('/pricing')}>
              {t('marketing:viewPricingPlans')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <div className="py-16 bg-gradient-to-b from-background to-primary/10">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">{t('marketing:readyToStart', 'Ready to streamline your wedding planning business?')}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t('marketing:choosePlan', 'Choose the plan that works best for you and start managing your clients more efficiently today.')}
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            {t('marketing:getStarted', 'Get Started')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <footer className="bg-muted py-8">
        <div className="container px-4 mx-auto text-center">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Knot To It Wedding Planner CRM</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
