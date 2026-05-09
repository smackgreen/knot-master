import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Check,
  X,
  Star,
  Heart,
  Sparkles,
  Globe,
  Shield,
  Zap,
  ChevronRight,
  Play,
  Quote,
} from "lucide-react";

// ─── Intersection Observer Hook for Scroll Animations ────────────────────────
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

// ─── Animated Counter Hook ───────────────────────────────────────────────────
const useCounter = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
};

// ─── Pricing Plan Interface ──────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const NewIndex = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'marketing', 'pricing']);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Pricing plans
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

  const handleSubscribe = (planId: string) => {
    navigate('/signup?plan=' + planId);
  };

  return (
    <div className="home-page">
      {/* ══════════════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════════════ */}
      <HeroSection navigate={navigate} t={t} />

      {/* ══════════════════════════════════════════════════════════════════════════
          SOCIAL PROOF BAR
          ══════════════════════════════════════════════════════════════════════════ */}
      <SocialProofBar />

      {/* ══════════════════════════════════════════════════════════════════════════
          FEATURES BENTO GRID
          ══════════════════════════════════════════════════════════════════════════ */}
      <FeaturesSection t={t} />

      {/* ══════════════════════════════════════════════════════════════════════════
          DASHBOARD SHOWCASE
          ══════════════════════════════════════════════════════════════════════════ */}
      <DashboardShowcase navigate={navigate} t={t} />

      {/* ══════════════════════════════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection t={t} />

      {/* ══════════════════════════════════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════════════════════════════════ */}
      <PricingSection
        t={t}
        plans={plans}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        handleSubscribe={handleSubscribe}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════════════════════════════════════ */}
      <FinalCTA navigate={navigate} t={t} />

      {/* ══════════════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════════════ */}
      <FooterSection />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const HeroSection = ({ navigate, t }: { navigate: any; t: any }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  return (
    <section
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f8] via-[#faf5ff] to-[#f0f9ff]" />

      {/* Animated blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 animate-blob"
        style={{
          background: 'radial-gradient(circle, rgba(212,131,159,0.3) 0%, transparent 70%)',
          top: '10%',
          left: '10%',
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 animate-blob delay-200"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
          bottom: '10%',
          right: '10%',
          transform: `translate(${-mousePos.x * 15}px, ${-mousePos.y * 15}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 animate-blob delay-400"
        style={{
          background: 'radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%)',
          top: '40%',
          right: '30%',
        }}
      />

      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(340 80% 75%) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-20 pb-32">
        {/* Badge */}
        <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-100 shadow-sm mb-8">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-gray-700">
            {t('marketing:heroBadge', 'The #1 Wedding Planning Platform')}
          </span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold leading-[1.05] tracking-tight mb-8">
          <span className="block text-gray-900">
            {t('marketing:heroLine1', 'Plan weddings')}
          </span>
          <span className="block text-gradient">
            {t('marketing:heroLine2', 'that inspire')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          {t('marketing:heroDescription', 'The all-in-one platform that helps wedding planners manage clients, guests, budgets, seating charts, and timelines — beautifully.')}
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => navigate('/signup')}
            className="group relative px-8 py-4 bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-2xl font-medium text-base shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('marketing:getStarted', 'Get Started')} Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-medium text-base border border-gray-200 hover:border-rose-200 hover:bg-white hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <Play className="h-4 w-4 text-rose-400" />
            {t('marketing:watchDemo', 'See How It Works')}
          </button>
        </div>

        {/* Dashboard Preview */}
        <div className="animate-scale-in delay-600 relative max-w-5xl mx-auto">
          {/* Glow effect behind dashboard */}
          <div className="absolute -inset-4 bg-gradient-to-r from-rose-200 via-violet-200 to-blue-200 rounded-3xl blur-2xl opacity-40" />

          {/* Dashboard card */}
          <div className="relative glass rounded-2xl shadow-2xl shadow-black/5 border border-white/50 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-gray-50 rounded-lg text-xs text-gray-400 font-mono">
                  app.knottoit.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="p-6 bg-gradient-to-br from-white to-rose-50/30">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Clients', value: '24', color: 'from-rose-400 to-pink-500' },
                  { label: 'Upcoming Events', value: '8', color: 'from-violet-400 to-purple-500' },
                  { label: 'Total Guests', value: '1,247', color: 'from-blue-400 to-indigo-500' },
                  { label: 'Tasks Completed', value: '94%', color: 'from-emerald-400 to-green-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Revenue Overview</p>
                    <span className="text-xs text-emerald-500 font-medium">+23%</span>
                  </div>
                  {/* Chart bars */}
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-400 to-rose-300 opacity-80"
                        style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-40">
                  <p className="text-sm font-medium text-gray-700 mb-3">Upcoming</p>
                  <div className="space-y-2">
                    {['Sarah & James', 'Emma & Liam', 'Olivia & Noah'].map((name, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${['bg-rose-400', 'bg-violet-400', 'bg-blue-400'][i]}`} />
                        <span className="text-xs text-gray-600">{name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{['Jun 15', 'Jul 22', 'Aug 8'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF BAR
// ═══════════════════════════════════════════════════════════════════════════════

const SocialProofBar = () => {
  const { ref, isVisible } = useScrollReveal();
  const weddings = useCounter(2500, 2000, isVisible);
  const planners = useCounter(850, 2000, isVisible);
  const guests = useCounter(50000, 2000, isVisible);

  return (
    <section ref={ref} className="relative py-16 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: `${weddings}+`, label: 'Weddings Planned', icon: Heart },
            { value: `${planners}+`, label: 'Happy Planners', icon: Users },
            { value: `${guests}+`, label: 'Guests Managed', icon: UserPlus },
            { value: '4.9', label: 'Average Rating', icon: Star },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <stat.icon className="h-5 w-5 text-rose-400 mx-auto mb-2" />
              <p className="text-3xl md:text-4xl font-serif font-bold text-gradient">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURES SECTION — BENTO GRID
// ═══════════════════════════════════════════════════════════════════════════════

const features = [
  {
    icon: Users,
    title: 'Client Management',
    description: 'Organize all your couples in one place. Track preferences, timelines, and communications effortlessly.',
    gradient: 'from-rose-400 to-pink-500',
    size: 'large' as const,
  },
  {
    icon: Calendar,
    title: 'Wedding Timelines',
    description: 'Create minute-by-minute timelines that keep everyone synchronized on the big day.',
    gradient: 'from-violet-400 to-purple-500',
    size: 'medium' as const,
  },
  {
    icon: CheckSquare,
    title: 'Task Tracking',
    description: 'Never miss a deadline with smart task management and automated reminders.',
    gradient: 'from-blue-400 to-indigo-500',
    size: 'medium' as const,
  },
  {
    icon: CreditCard,
    title: 'Budget Tracking',
    description: 'Real-time budget monitoring with expense categories, payment tracking, and vendor cost management.',
    gradient: 'from-emerald-400 to-green-500',
    size: 'medium' as const,
  },
  {
    icon: LayoutGrid,
    title: 'Seating Charts',
    description: 'Drag-and-drop seating chart designer with interactive floor plans and guest assignment.',
    gradient: 'from-amber-400 to-orange-500',
    size: 'large' as const,
  },
  {
    icon: UserPlus,
    title: 'Guest Management',
    description: 'RSVP tracking, meal preferences, plus-one management, and automated communications.',
    gradient: 'from-cyan-400 to-teal-500',
    size: 'medium' as const,
  },
  {
    icon: Utensils,
    title: 'Meal Planning',
    description: 'AI-powered meal suggestions based on guest dietary needs and preferences.',
    gradient: 'from-fuchsia-400 to-pink-500',
    size: 'medium' as const,
    badge: 'AI',
  },
  {
    icon: Palette,
    title: 'Design Suggestions',
    description: 'Get AI-curated design inspiration for themes, color palettes, and décor.',
    gradient: 'from-indigo-400 to-violet-500',
    size: 'medium' as const,
    badge: 'AI',
  },
];

const FeaturesSection = ({ t }: { t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="features" ref={ref} className="relative py-24 md:py-32 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4">
            <Zap className="h-3.5 w-3.5" />
            {t('marketing:featuresBadge', 'Powerful Features')}
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {t('marketing:featuresTitle', 'Everything you need to plan the perfect wedding')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('marketing:featuresSubtitle', 'A complete toolkit designed by wedding planners, for wedding planners.')}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 md:p-8 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-500 cursor-default ${
                feature.size === 'large' ? 'lg:col-span-2' : ''
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Gradient hover overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

              {/* Icon */}
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-5`}>
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                  <feature.icon className={`h-5 w-5 bg-gradient-to-br ${feature.gradient} bg-clip-text`} style={{
                    color: 'transparent',
                    backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                    WebkitBackgroundClip: 'text',
                  }} />
                </div>
              </div>

              {/* Badge */}
              {feature.badge && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
                    {feature.badge}
                  </span>
                </div>
              )}

              {/* Text */}
              <h3 className="relative text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="relative text-sm text-gray-400 leading-relaxed">{feature.description}</p>

              {/* Arrow */}
              <div className="relative mt-4 flex items-center text-sm font-medium text-gray-300 group-hover:text-gray-500 transition-colors">
                Learn more
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

const DashboardShowcase = ({ navigate, t }: { navigate: any; t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-gradient-to-b from-white via-rose-50/20 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-6">
              <Globe className="h-3.5 w-3.5" />
              {t('marketing:showcaseBadge', 'Built for Professionals')}
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
              {t('marketing:showcaseTitle', 'Your entire workflow,')}
              <br />
              <span className="text-gradient">{t('marketing:showcaseTitleHighlight', 'in one place')}</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              {t('marketing:showcaseDescription', 'From the first client meeting to the last dance, Knot To It streamlines every step of the wedding planning journey.')}
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: Shield, text: 'Secure client data with role-based access' },
                { icon: Zap, text: 'Real-time collaboration with your team' },
                { icon: Globe, text: 'Access from anywhere, on any device' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-violet-500" />
                  </div>
                  <span className="text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/signup')}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-gray-200"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right: Feature cards stack */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-rose-100 via-violet-100 to-blue-100 rounded-3xl blur-3xl opacity-30" />

            <div className="relative space-y-4">
              {/* Card 1 */}
              <div className="glass rounded-2xl p-6 shadow-lg animate-float-slow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Client Overview</p>
                    <p className="text-xs text-gray-400">Real-time updates</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Sarah & James — Jun 15', 'Emma & Liam — Jul 22', 'Olivia & Noah — Aug 8'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/60">
                      <span className="text-sm text-gray-700">{name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ['bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-blue-50 text-blue-600'][i]
                      }`}>
                        {['On Track', 'In Review', 'Planning'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass rounded-2xl p-6 shadow-lg animate-float-slow delay-300 ml-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Budget Tracker</p>
                    <p className="text-xs text-gray-400">$42,500 total budget</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                  <div className="bg-gradient-to-r from-violet-400 to-purple-500 h-3 rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>68% used</span>
                  <span>$13,600 remaining</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass rounded-2xl p-6 shadow-lg animate-float-slow delay-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Tasks Completed</p>
                    <p className="text-xs text-gray-400">18 of 24 tasks done</p>
                  </div>
                  <div className="text-2xl font-bold text-emerald-500">75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════

const testimonials = [
  {
    quote: "Knot To It has completely transformed how I manage my wedding planning business. The client management and task tracking features save me hours every week.",
    author: "Sarah Johnson",
    role: "Wedding Planner, Elegant Events",
    rating: 5,
    avatar: 'SJ',
    color: 'from-rose-400 to-pink-500',
  },
  {
    quote: "The seating chart designer is a game-changer! My clients love being able to visualize their reception layout, and it makes the planning process so much smoother.",
    author: "Michael Rodriguez",
    role: "Owner, Dream Day Weddings",
    rating: 5,
    avatar: 'MR',
    color: 'from-violet-400 to-purple-500',
  },
  {
    quote: "I was skeptical about the AI features, but they've proven invaluable. The meal planning suggestions have impressed even my most discerning clients.",
    author: "Emma Thompson",
    role: "Independent Wedding Consultant",
    rating: 5,
    avatar: 'ET',
    color: 'from-blue-400 to-indigo-500',
  },
];

const TestimonialsSection = ({ t }: { t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-medium mb-4">
            <Star className="h-3.5 w-3.5" />
            {t('marketing:testimonialsBadge', 'Loved by Planners')}
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {t('marketing:testimonialsTitle', 'What wedding planners say')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('marketing:testimonialsSubtitle', 'Join hundreds of professionals who trust Knot To It for their business.')}
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div
              key={testimonial.author}
              className={`group relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-2 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Quote icon */}
              <div className="mb-6">
                <Quote className="h-8 w-8 text-rose-200" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-gray-600 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-sm font-medium`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{testimonial.author}</p>
                  <p className="text-xs text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PricingSection = ({
  t,
  plans,
  billingCycle,
  setBillingCycle,
  handleSubscribe,
}: {
  t: any;
  plans: PricingPlan[];
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (v: 'monthly' | 'yearly') => void;
  handleSubscribe: (id: string) => void;
}) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="pricing" ref={ref} className="relative py-24 md:py-32 bg-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-sm font-medium mb-4">
            <CreditCard className="h-3.5 w-3.5" />
            {t('pricing:badge', 'Simple Pricing')}
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {t('pricing:title', 'Plans for every stage')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            {t('pricing:description', 'Start free and scale as your business grows. No hidden fees.')}
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              {t('pricing:monthly', 'Monthly')}
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
              {t('pricing:yearly', 'Yearly')}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-full">
              {t('pricing:savePercent', 'Save 15%')}
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={`relative group rounded-2xl p-8 transition-all duration-500 ${
                plan.popular
                  ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl shadow-gray-300/30 scale-[1.02] md:scale-105'
                  : 'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-full shadow-lg">
                    {t('pricing:mostPopular', 'Most Popular')}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className={`text-lg font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.popular ? 'text-gray-300' : 'text-gray-400'}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  ${billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                </span>
                {plan.price > 0 && (
                  <span className={`text-sm ml-1 ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                    /{billingCycle === 'yearly' ? t('pricing:year', 'year') : t('pricing:month', 'month')}
                  </span>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 mb-8 ${
                  plan.popular
                    ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg'
                    : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
                }`}
              >
                {plan.buttonText}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    {typeof feature.included === 'boolean' ? (
                      feature.included ? (
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      ) : (
                        <X className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-gray-600' : 'text-gray-300'}`} />
                      )
                    ) : (
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    )}
                    <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature.name}
                      {typeof feature.included === 'string' && (
                        <span className={`ml-1 ${plan.popular ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({feature.included})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

const FinalCTA = ({ navigate, t }: { navigate: any; t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900" />

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-rose-500/20 to-violet-500/20 blur-3xl" />

      <div className={`relative max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Heart icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
          <Heart className="h-8 w-8 text-rose-400" />
        </div>

        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
          {t('marketing:ctaTitle', 'Ready to plan your')}
          <br />
          <span className="text-gradient">{t('marketing:ctaTitleHighlight', 'dream wedding?')}</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('marketing:ctaDescription', 'Join thousands of wedding planners who\'ve elevated their business with Knot To It. Start your free trial today.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="group px-8 py-4 bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-2xl font-medium text-base shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              {t('marketing:getStarted', 'Get Started')} Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 text-white/80 hover:text-white rounded-2xl font-medium text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300"
          >
            {t('marketing:signIn', 'Sign In')}
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>SSL Encrypted</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            <span>No credit card required</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span>Free forever plan</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

const FooterSection = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-serif font-bold text-gray-900">Knot To It</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The ultimate CRM for wedding planners. Beautifully designed, powerfully built.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Features</h4>
            <ul className="space-y-2.5">
              {['Client Management', 'Guest Lists', 'Seating Charts', 'Budget Tracker', 'Timelines'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {['Documentation', 'Blog', 'Help Center', 'Community', 'Webinars'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'GDPR', 'Security'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Knot To It. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Twitter', 'Instagram', 'LinkedIn', 'Pinterest'].map((social) => (
              <a key={social} href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NewIndex;
