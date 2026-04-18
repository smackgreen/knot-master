import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Contact,
  Check,
  X
} from "lucide-react";

// Define pricing plan interface
interface PlanFeature {
  name: string;
  included: boolean | string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
}

const NewIndex = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'marketing', 'pricing']);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState("features");

  // Define pricing plans
  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: t('pricing:plans.free.name'),
      description: t('pricing:plans.free.description'),
      price: 0,
      buttonText: t('pricing:getStarted'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:limits.upTo', { count: 3 }) },
        { name: t('pricing:features.taskManagement'), included: t('pricing:basic') },
        { name: t('pricing:features.calendarView'), included: t('pricing:basic') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:limits.upTo', { count: 5 }) },
        { name: t('pricing:features.guestManagement'), included: t('pricing:limits.upTo', { count: 30 }) },
        { name: t('pricing:features.budgetTracking'), included: false },
        { name: t('pricing:features.invoicesQuotations'), included: false },
        { name: t('pricing:features.seatingCharts'), included: false },
        { name: t('pricing:features.mealPlanning'), included: false },
        { name: t('pricing:features.designSuggestions'), included: false },
      ],
    },
    {
      id: 'starter',
      name: t('pricing:plans.starter.name'),
      description: t('pricing:plans.starter.description'),
      price: 19.99,
      yearlyPrice: 199.99,
      popular: true,
      buttonText: t('pricing:subscribe'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.taskManagement'), included: t('pricing:advanced') },
        { name: t('pricing:features.calendarView'), included: t('pricing:full') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.guestManagement'), included: t('pricing:limits.upTo', { count: 150 }) },
        { name: t('pricing:features.budgetTracking'), included: true },
        { name: t('pricing:features.invoicesQuotations'), included: t('pricing:basic') },
        { name: t('pricing:features.seatingCharts'), included: t('pricing:basic') },
        { name: t('pricing:features.mealPlanning'), included: false },
        { name: t('pricing:features.designSuggestions'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('pricing:plans.pro.name'),
      description: t('pricing:plans.pro.description'),
      price: 39.99,
      yearlyPrice: 399.99,
      buttonText: t('pricing:subscribe'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.taskManagement'), included: t('pricing:advanced') },
        { name: t('pricing:features.calendarView'), included: t('pricing:full') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.guestManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.budgetTracking'), included: t('pricing:advanced') },
        { name: t('pricing:features.invoicesQuotations'), included: t('pricing:advanced') },
        { name: t('pricing:features.seatingCharts'), included: t('pricing:advanced') },
        { name: t('pricing:features.mealPlanning'), included: true },
        { name: t('pricing:features.designSuggestions'), included: true },
      ],
    },
  ];

  // Handle subscription button click
  const handleSubscribe = (planId: string) => {
    navigate('/signup?plan=' + planId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="py-20 bg-gradient-to-b from-wedding-ivory to-background text-center">
        <div className="container px-4 mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className="text-primary">Knot To It</span> {t('marketing:tagline')}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            {t('marketing:heroDescription')}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/signup')}>
              {t('marketing:getStarted')} Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('marketing:viewPricing')}
            </Button>
          </div>
          <div className="mt-12 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-20 bottom-0 z-10"></div>
            <img
              src="/images/dashboard-preview.png"
              alt="Knot To It Dashboard"
              className="rounded-t-lg shadow-xl max-w-full mx-auto"
              style={{ maxHeight: '500px' }}
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/1200x600/f8f9fa/6c757d?text=Dashboard+Preview';
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Features and Pricing Tabs */}
        <div className="py-16 bg-background">
          <div className="container px-4 mx-auto">
            <Tabs defaultValue="features" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="pricing" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="features" className="space-y-16">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-center mb-12">{t('marketing:featuresTitle')}</h2>

                  {/* First row of features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <FeatureCard
                      icon={<Users className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.clientManagement.title')}
                      description={t('marketing:features.clientManagement.description')}
                    />
                    <FeatureCard
                      icon={<Calendar className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.weddingTimelines.title')}
                      description={t('marketing:features.weddingTimelines.description')}
                    />
                    <FeatureCard
                      icon={<CheckSquare className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.taskTracking.title')}
                      description={t('marketing:features.taskTracking.description')}
                    />
                  </div>

                  {/* Second row of features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <FeatureCard
                      icon={<CreditCard className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.budgetTracking.title')}
                      description={t('marketing:features.budgetTracking.description')}
                    />
                    <FeatureCard
                      icon={<UserPlus className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.guestManagement.title')}
                      description={t('marketing:features.guestManagement.description')}
                    />
                    <FeatureCard
                      icon={<LayoutGrid className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.seatingCharts.title')}
                      description={t('marketing:features.seatingCharts.description')}
                    />
                  </div>

                  {/* AI Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <FeatureCard
                      icon={<Utensils className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.mealPlanning.title')}
                      description={t('marketing:features.mealPlanning.description')}
                    />
                    <FeatureCard
                      icon={<Palette className="h-12 w-12 text-primary" />}
                      title={t('marketing:features.designSuggestions.title')}
                      description={t('marketing:features.designSuggestions.description')}
                    />
                  </div>

                  <div className="text-center mt-12">
                    <Button size="lg" onClick={() => setActiveTab("pricing")}>
                      {t('marketing:viewPricingPlans')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" id="pricing" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-center mb-4">{t('pricing:title')}</h2>
                  <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {t('pricing:description')}
                  </p>

                  <div className="flex items-center justify-center space-x-2 mb-8">
                    <Label htmlFor="billing-cycle">{t('pricing:monthly')}</Label>
                    <Switch
                      id="billing-cycle"
                      checked={billingCycle === 'yearly'}
                      onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                    />
                    <Label htmlFor="billing-cycle" className="flex items-center gap-2">
                      {t('pricing:yearly')}
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        {t('pricing:savePercent', { percent: 15 })}
                      </span>
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : ''}`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                              {t('pricing:mostPopular')}
                            </span>
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">
                              ${billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                            </span>
                            {plan.price > 0 && (
                              <span className="text-muted-foreground ml-1">
                                /{billingCycle === 'yearly' ? t('pricing:year') : t('pricing:month')}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                {typeof feature.included === 'boolean' ? (
                                  feature.included ? (
                                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                                  )
                                ) : (
                                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                                )}
                                <span>
                                  {feature.name}
                                  {typeof feature.included === 'string' && (
                                    <span className="text-muted-foreground ml-1">
                                      ({feature.included})
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button
                            className="w-full"
                            variant={plan.id === 'free' ? 'outline' : 'default'}
                            onClick={() => handleSubscribe(plan.id)}
                          >
                            {plan.buttonText}
                            {plan.id !== 'free' && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 bg-muted/30">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">{t('marketing:testimonials.title', 'What Wedding Planners Say')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TestimonialCard
                quote={t('marketing:testimonials.quote1', "Knot To It has completely transformed how I manage my wedding planning business. The client management and task tracking features save me hours every week.")}
                author={t('marketing:testimonials.author1', "Sarah Johnson")}
                role={t('marketing:testimonials.role1', "Wedding Planner, Elegant Events")}
              />
              <TestimonialCard
                quote={t('marketing:testimonials.quote2', "The seating chart designer is a game-changer! My clients love being able to visualize their reception layout, and it makes the planning process so much smoother.")}
                author={t('marketing:testimonials.author2', "Michael Rodriguez")}
                role={t('marketing:testimonials.role2', "Owner, Dream Day Weddings")}
              />
              <TestimonialCard
                quote={t('marketing:testimonials.quote3', "I was skeptical about the AI features, but they've proven invaluable. The meal planning suggestions have impressed even my most discerning clients.")}
                author={t('marketing:testimonials.author3', "Emma Thompson")}
                role={t('marketing:testimonials.role3', "Independent Wedding Consultant")}
              />
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="py-16 bg-primary/5">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl font-serif font-bold mb-4">{t('marketing:readyToStart')}</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              {t('marketing:choosePlan')}
            </p>
            <Button size="lg" onClick={() => navigate('/signup')}>
              {t('marketing:getStarted')} Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Knot To It</h3>
              <p className="text-muted-foreground">The ultimate CRM for wedding planners.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Client Management</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Task Tracking</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Budget Management</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Seating Charts</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Support</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center">
            <p className="text-muted-foreground">© {new Date().getFullYear()} Knot To It Wedding Planner CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
    <div className="mb-4 bg-primary/10 p-3 rounded-full">
      {icon}
    </div>
    <h3 className="text-xl font-medium mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

// Testimonial Card Component
interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

const TestimonialCard = ({ quote, author, role }: TestimonialCardProps) => (
  <div className="bg-background p-6 rounded-lg shadow-sm border">
    <div className="mb-4 text-primary">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 opacity-50">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
      </svg>
    </div>
    <p className="mb-4">{quote}</p>
    <div>
      <p className="font-medium">{author}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  </div>
);

export default NewIndex;
