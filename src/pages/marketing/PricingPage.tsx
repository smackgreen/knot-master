import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Check,
  X,
  CreditCard,
  Sparkles,
  ChevronRight,
  Heart,
  Shield,
  Zap,
  Star,
  HelpCircle,
  Globe,
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

const PricingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["marketing", "pricing"]);
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: t("pricing:plans.free.name"),
      description: t("pricing:plans.free.description"),
      price: 0,
      buttonText: user ? t("pricing:currentPlan") : t("pricing:getStarted"),
      features: [
        { name: t("pricing:features.clientManagement"), included: t("pricing:limits.upTo", { count: 3 }) },
        { name: t("pricing:features.taskManagement"), included: t("pricing:basic") },
        { name: t("pricing:features.calendarView"), included: t("pricing:basic") },
        { name: t("pricing:features.vendorManagement"), included: t("pricing:limits.upTo", { count: 5 }) },
        { name: t("pricing:features.guestManagement"), included: t("pricing:limits.upTo", { count: 30 }) },
        { name: t("pricing:features.budgetTracking"), included: false },
        { name: t("pricing:features.invoicesQuotations"), included: false },
        { name: t("pricing:features.seatingCharts"), included: false },
        { name: t("pricing:features.mealPlanning"), included: false },
        { name: t("pricing:features.designSuggestions"), included: false },
        { name: t("pricing:features.contractsSignatures"), included: false },
        { name: t("pricing:features.documentManagement"), included: false },
        { name: t("pricing:features.resourceManagement"), included: false },
        { name: t("pricing:features.analyticsReporting"), included: false },
        { name: t("pricing:features.calendarScheduling"), included: false },
      ],
    },
    {
      id: "starter",
      name: t("pricing:plans.starter.name"),
      description: t("pricing:plans.starter.description"),
      price: 19.99,
      yearlyPrice: 199.99,
      popular: true,
      buttonText: t("pricing:subscribe"),
      features: [
        { name: t("pricing:features.clientManagement"), included: t("pricing:unlimited") },
        { name: t("pricing:features.taskManagement"), included: t("pricing:advanced") },
        { name: t("pricing:features.calendarView"), included: t("pricing:full") },
        { name: t("pricing:features.vendorManagement"), included: t("pricing:unlimited") },
        { name: t("pricing:features.guestManagement"), included: t("pricing:limits.upTo", { count: 150 }) },
        { name: t("pricing:features.budgetTracking"), included: true },
        { name: t("pricing:features.invoicesQuotations"), included: t("pricing:basic") },
        { name: t("pricing:features.seatingCharts"), included: t("pricing:basic") },
        { name: t("pricing:features.mealPlanning"), included: false },
        { name: t("pricing:features.designSuggestions"), included: false },
        { name: t("pricing:features.contractsSignatures"), included: t("pricing:basic") },
        { name: t("pricing:features.documentManagement"), included: true },
        { name: t("pricing:features.resourceManagement"), included: false },
        { name: t("pricing:features.analyticsReporting"), included: t("pricing:basic") },
        { name: t("pricing:features.calendarScheduling"), included: t("pricing:basic") },
      ],
    },
    {
      id: "pro",
      name: t("pricing:plans.pro.name"),
      description: t("pricing:plans.pro.description"),
      price: 39.99,
      yearlyPrice: 399.99,
      buttonText: t("pricing:subscribe"),
      features: [
        { name: t("pricing:features.clientManagement"), included: t("pricing:unlimited") },
        { name: t("pricing:features.taskManagement"), included: t("pricing:advanced") },
        { name: t("pricing:features.calendarView"), included: t("pricing:full") },
        { name: t("pricing:features.vendorManagement"), included: t("pricing:unlimited") },
        { name: t("pricing:features.guestManagement"), included: t("pricing:unlimited") },
        { name: t("pricing:features.budgetTracking"), included: t("pricing:advanced") },
        { name: t("pricing:features.invoicesQuotations"), included: t("pricing:advanced") },
        { name: t("pricing:features.seatingCharts"), included: t("pricing:advanced") },
        { name: t("pricing:features.mealPlanning"), included: true },
        { name: t("pricing:features.designSuggestions"), included: true },
        { name: t("pricing:features.contractsSignatures"), included: t("pricing:advanced") },
        { name: t("pricing:features.documentManagement"), included: true },
        { name: t("pricing:features.resourceManagement"), included: t("pricing:advanced") },
        { name: t("pricing:features.analyticsReporting"), included: true },
        { name: t("pricing:features.calendarScheduling"), included: t("pricing:full") },
      ],
    },
  ];

  const handleSubscribe = (planId: string) => {
    if (!user) {
      navigate("/signup?plan=" + planId);
    } else {
      navigate("/account/subscription?plan=" + planId);
    }
  };

  return (
    <div className="pricing-page">
      {/* ═══ HERO ═══ */}
      <PricingHero t={t} billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

      {/* ═══ PRICING CARDS ═══ */}
      <PricingCards
        t={t}
        plans={plans}
        billingCycle={billingCycle}
        handleSubscribe={handleSubscribe}
        user={user}
      />

      {/* ═══ FAQ ═══ */}
      <FAQSection t={t} />

      {/* ═══ FINAL CTA ═══ */}
      <PricingCTA navigate={navigate} t={t} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PricingHero = ({
  t,
  billingCycle,
  setBillingCycle,
}: {
  t: any;
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (v: "monthly" | "yearly") => void;
}) => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f8] via-[#faf5ff] to-[#f0f9ff]" />

      {/* Decorative blobs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 animate-blob"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
          top: "5%",
          left: "10%",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 animate-blob delay-300"
        style={{
          background: "radial-gradient(circle, rgba(212,131,159,0.25) 0%, transparent 70%)",
          bottom: "10%",
          right: "5%",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(340 80% 75%) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center pt-12">
        {/* Badge */}
        <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-100 shadow-sm mb-8">
          <CreditCard className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-medium text-gray-700">
            {t("pricing:badge", "Simple Pricing")}
          </span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] tracking-tight mb-6">
          <span className="block text-gray-900">
            {t("marketing:pricingPage.heroTitle", "Plans for every")}
          </span>
          <span className="block text-gradient">
            {t("marketing:pricingPage.heroTitleHighlight", "stage of growth")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          {t(
            "pricing:description",
            "Start free and scale as your business grows. No hidden fees."
          )}
        </p>

        {/* Billing toggle */}
        <div className="animate-fade-in-up delay-400 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {t("pricing:monthly", "Monthly")}
          </span>
          <Switch
            checked={billingCycle === "yearly"}
            onCheckedChange={(checked) =>
              setBillingCycle(checked ? "yearly" : "monthly")
            }
          />
          <span
            className={`text-sm font-medium transition-colors ${
              billingCycle === "yearly" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {t("pricing:yearly", "Yearly")}
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-full">
            {t("pricing:savePercent", "Save {{percent}}%").replace("{{percent}}", "15")}
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING CARDS
// ═══════════════════════════════════════════════════════════════════════════════

const PricingCards = ({
  t,
  plans,
  billingCycle,
  handleSubscribe,
  user,
}: {
  t: any;
  plans: PricingPlan[];
  billingCycle: "monthly" | "yearly";
  handleSubscribe: (id: string) => void;
  user: any;
}) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-8 md:py-16 bg-white">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={`relative group rounded-2xl p-8 transition-all duration-500 ${
                plan.popular
                  ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl shadow-gray-300/30 scale-[1.02] md:scale-105"
                  : "bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-full shadow-lg">
                    {t("pricing:mostPopular", "Most Popular")}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3
                className={`text-lg font-semibold mb-1 ${
                  plan.popular ? "text-white" : "text-gray-900"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.popular ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <span
                  className={`text-5xl font-bold ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  $
                  {billingCycle === "yearly" && plan.yearlyPrice
                    ? plan.yearlyPrice
                    : plan.price}
                </span>
                {plan.price > 0 && (
                  <span
                    className={`text-sm ml-1 ${
                      plan.popular ? "text-gray-400" : "text-gray-400"
                    }`}
                  >
                    /
                    {billingCycle === "yearly"
                      ? t("pricing:year", "year")
                      : t("pricing:month", "month")}
                  </span>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!(user && plan.id === "free")}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 mb-8 ${
                  plan.popular
                    ? "bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.buttonText}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    {typeof feature.included === "boolean" ? (
                      feature.included ? (
                        <Check
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            plan.popular ? "text-emerald-400" : "text-emerald-500"
                          }`}
                        />
                      ) : (
                        <X
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            plan.popular ? "text-gray-600" : "text-gray-300"
                          }`}
                        />
                      )
                    ) : (
                      <Check
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-emerald-400" : "text-emerald-500"
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {feature.name}
                      {typeof feature.included === "string" && (
                        <span
                          className={`ml-1 ${
                            plan.popular ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
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

        {/* Money-back guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm">
            <Shield className="h-4 w-4" />
            {t(
              "marketing:pricingPage.guarantee",
              "30-day money-back guarantee. No questions asked."
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const FAQSection = ({ t }: { t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  const faqItems = [
    { q: t("pricing:faq.q1"), a: t("pricing:faq.a1") },
    { q: t("pricing:faq.q2"), a: t("pricing:faq.a2") },
    { q: t("pricing:faq.q3"), a: t("pricing:faq.a3") },
  ];

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 bg-gradient-to-b from-white to-gray-50 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-rose-50/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            {t("pricing:faq.title", "Frequently Asked Questions")}
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {t(
              "marketing:pricingPage.faqTitle",
              "Questions? We've got answers"
            )}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t(
              "marketing:pricingPage.faqSubtitle",
              "Everything you need to know about our pricing and plans."
            )}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className={`group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {item.q}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">{item.a}</p>
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
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

const PricingCTA = ({ navigate, t }: { navigate: any; t: any }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900" />

      {/* Decorative elements */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-rose-500/20 to-violet-500/20 blur-3xl" />

      <div
        className={`relative max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Heart icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
          <Heart className="h-8 w-8 text-rose-400" />
        </div>

        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
          {t("marketing:ctaTitle", "Ready to plan your")}
          <br />
          <span className="text-gradient">
            {t("marketing:ctaTitleHighlight", "dream wedding?")}
          </span>
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t(
            "marketing:ctaDescription",
            "Join thousands of wedding planners who've elevated their business with Knot To It. Start your free trial today."
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/signup")}
            className="group px-8 py-4 bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-2xl font-medium text-base shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              {t("marketing:startFreeTrial", "Start Free Trial")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <Link
            to="/features"
            className="px-8 py-4 text-white/80 hover:text-white rounded-2xl font-medium text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
          >
            {t("marketing:learnMore", "Learn more")}
            <ArrowRight className="h-4 w-4" />
          </Link>
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

export default PricingPage;
