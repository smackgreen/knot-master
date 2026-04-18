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
  Palette,
  FileText,
  Contact
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  imageUrl: string;
  reverse?: boolean;
}

const FeatureSection = ({ id, icon, title, description, imageUrl, reverse = false }: FeatureSectionProps) => (
  <section id={id} className="py-16 scroll-mt-16">
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <p className="text-muted-foreground mb-6">{description}</p>
      </div>
      <div className="flex-1">
        <img
          src={imageUrl}
          alt={title}
          className="rounded-lg shadow-lg w-full object-cover"
          style={{ maxHeight: '400px' }}
        />
      </div>
    </div>
  </section>
);

const FeaturesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-12 bg-wedding-ivory text-center">
        <div className="container px-4 mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('marketing:featuresPageTitle')}
          </h1>
          <p className="text-lg mb-8 max-w-3xl mx-auto">
            {t('marketing:featuresPageDescription')}
          </p>
          <Button onClick={() => navigate('/pricing')}>
            {t('marketing:viewPricing')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto space-y-12">
          <FeatureSection
            id="client-management"
            icon={<Users className="h-8 w-8 text-primary" />}
            title={t('marketing:features.clientManagement.title')}
            description={t('marketing:features.clientManagement.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
          />

          <hr />

          <FeatureSection
            id="wedding-timelines"
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title={t('marketing:features.weddingTimelines.title')}
            description={t('marketing:features.weddingTimelines.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?auto=format&fit=crop&w=1200&q=80"
            reverse
          />

          <hr />

          <FeatureSection
            id="task-tracking"
            icon={<CheckSquare className="h-8 w-8 text-primary" />}
            title={t('marketing:features.taskTracking.title')}
            description={t('marketing:features.taskTracking.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80"
          />

          <hr />

          <FeatureSection
            id="budget-tracking"
            icon={<CreditCard className="h-8 w-8 text-primary" />}
            title={t('marketing:features.budgetTracking.title')}
            description={t('marketing:features.budgetTracking.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
            reverse
          />

          <hr />

          <FeatureSection
            id="vendor-management"
            icon={<Contact className="h-8 w-8 text-primary" />}
            title={t('marketing:features.vendorManagement.title')}
            description={t('marketing:features.vendorManagement.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80"
          />

          <hr />

          <FeatureSection
            id="invoices-quotations"
            icon={<FileText className="h-8 w-8 text-primary" />}
            title={t('marketing:features.invoicesQuotations.title')}
            description={t('marketing:features.invoicesQuotations.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80"
            reverse
          />

          <hr />

          <FeatureSection
            id="guest-management"
            icon={<UserPlus className="h-8 w-8 text-primary" />}
            title={t('marketing:features.guestManagement.title')}
            description={t('marketing:features.guestManagement.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
          />

          <hr />

          <FeatureSection
            id="seating-charts"
            icon={<LayoutGrid className="h-8 w-8 text-primary" />}
            title={t('marketing:features.seatingCharts.title')}
            description={t('marketing:features.seatingCharts.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80"
            reverse
          />

          <hr />

          <FeatureSection
            id="meal-planning"
            icon={<Utensils className="h-8 w-8 text-primary" />}
            title={t('marketing:features.mealPlanning.title')}
            description={t('marketing:features.mealPlanning.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80"
          />

          <hr />

          <FeatureSection
            id="design-suggestions"
            icon={<Palette className="h-8 w-8 text-primary" />}
            title={t('marketing:features.designSuggestions.title')}
            description={t('marketing:features.designSuggestions.fullDescription')}
            imageUrl="https://images.unsplash.com/photo-1519741347686-c1e331fcb4e3?auto=format&fit=crop&w=1200&q=80"
            reverse
          />

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">{t('marketing:readyToStart')}</h2>
            <p className="mb-6">{t('marketing:choosePlan')}</p>
            <Button size="lg" onClick={() => navigate('/pricing')}>
              {t('marketing:viewPricingPlans')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8">
        <div className="container px-4 mx-auto text-center">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Knot To It Wedding Planner CRM</p>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
