import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Eye,
  Edit3,
  CreditCard,
  Star,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Copy,
  Settings2,
  Tag,
  ToggleLeft,
  ToggleRight,
  MoveUp,
  MoveDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlanFeature {
  id: string;
  key: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  included: boolean | string;
  includedLabel: string;
  icon: string;
  enabled: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  billingCycleOptions: ("monthly" | "yearly")[];
  badge: string;
  badgeColor: string;
  isPopular: boolean;
  isHighlighted: boolean;
  yearlyDiscountPercent: number;
  buttonText: string;
  buttonTextFr: string;
  features: PlanFeature[];
  order: number;
}

// ─── Icon Options ────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  "Users", "Calendar", "CheckSquare", "CreditCard", "UserPlus",
  "LayoutGrid", "Utensils", "Palette", "FileText", "Contact",
  "Star", "Shield", "Zap", "Globe", "Heart", "Sparkles",
];

const BADGE_COLORS = [
  { label: "Rose", value: "from-rose-400 to-pink-500" },
  { label: "Violet", value: "from-violet-400 to-purple-500" },
  { label: "Blue", value: "from-blue-400 to-indigo-500" },
  { label: "Emerald", value: "from-emerald-400 to-green-500" },
  { label: "Amber", value: "from-amber-400 to-orange-500" },
  { label: "Cyan", value: "from-cyan-400 to-teal-500" },
];

const CURRENCIES = [
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "GBP (£)", value: "GBP", symbol: "£" },
  { label: "CAD (C$)", value: "CAD", symbol: "C$" },
];

// ─── Default Plan Template ───────────────────────────────────────────────────
const createDefaultPlan = (order: number): PricingPlan => ({
  id: `plan_${Date.now()}`,
  name: "",
  nameFr: "",
  description: "",
  descriptionFr: "",
  price: 0,
  yearlyPrice: 0,
  currency: "USD",
  trialDays: 0,
  billingCycleOptions: ["monthly", "yearly"],
  badge: "",
  badgeColor: "from-rose-400 to-pink-500",
  isPopular: false,
  isHighlighted: false,
  yearlyDiscountPercent: 0,
  buttonText: "Subscribe",
  buttonTextFr: "S'abonner",
  features: [],
  order,
});

const createDefaultFeature = (): PlanFeature => ({
  id: `feat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  key: "",
  name: "",
  nameFr: "",
  description: "",
  descriptionFr: "",
  included: true,
  includedLabel: "",
  icon: "Check",
  enabled: true,
});

// ─── Validation ──────────────────────────────────────────────────────────────
interface ValidationError {
  field: string;
  message: string;
}

const validatePlan = (plan: PricingPlan): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!plan.name.trim()) errors.push({ field: "name", message: "Plan name (EN) is required" });
  if (!plan.nameFr.trim()) errors.push({ field: "nameFr", message: "Plan name (FR) is required" });
  if (!plan.description.trim()) errors.push({ field: "description", message: "Description (EN) is required" });
  if (!plan.descriptionFr.trim()) errors.push({ field: "descriptionFr", message: "Description (FR) is required" });
  if (plan.price < 0) errors.push({ field: "price", message: "Price cannot be negative" });
  if (plan.yearlyPrice < 0) errors.push({ field: "yearlyPrice", message: "Yearly price cannot be negative" });
  if (plan.price > 0 && plan.yearlyPrice > 0 && plan.yearlyPrice >= plan.price * 12) {
    errors.push({ field: "yearlyPrice", message: "Yearly price should be less than monthly × 12" });
  }
  if (plan.yearlyDiscountPercent < 0 || plan.yearlyDiscountPercent > 100) {
    errors.push({ field: "yearlyDiscountPercent", message: "Discount must be 0-100%" });
  }
  if (plan.trialDays < 0) errors.push({ field: "trialDays", message: "Trial days cannot be negative" });
  if (!plan.buttonText.trim()) errors.push({ field: "buttonText", message: "Button text (EN) is required" });
  if (!plan.buttonTextFr.trim()) errors.push({ field: "buttonTextFr", message: "Button text (FR) is required" });
  return errors;
};

const validateFeature = (feature: PlanFeature): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!feature.name.trim()) errors.push({ field: "name", message: "Feature name (EN) is required" });
  if (!feature.nameFr.trim()) errors.push({ field: "nameFr", message: "Feature name (FR) is required" });
  return errors;
};

// ─── Initial Plans (matching current pricing.json) ───────────────────────────
const getInitialPlans = (): PricingPlan[] => [
  {
    id: "plan_free",
    name: "Free",
    nameFr: "Gratuit",
    description: "For individuals just starting out with wedding planning.",
    descriptionFr: "Pour les personnes qui débutent dans la planification de mariage.",
    price: 0,
    yearlyPrice: 0,
    currency: "USD",
    trialDays: 0,
    billingCycleOptions: ["monthly"],
    badge: "",
    badgeColor: "from-rose-400 to-pink-500",
    isPopular: false,
    isHighlighted: false,
    yearlyDiscountPercent: 0,
    buttonText: "Get Started",
    buttonTextFr: "Commencer",
    features: [
      { id: "f1", key: "clientManagement", name: "Client Management", nameFr: "Gestion des Clients", description: "", descriptionFr: "", included: "Up to 3", includedLabel: "Up to 3", icon: "Users", enabled: true },
      { id: "f2", key: "taskManagement", name: "Task Management", nameFr: "Gestion des Tâches", description: "", descriptionFr: "", included: "Basic", includedLabel: "Basic", icon: "CheckSquare", enabled: true },
      { id: "f3", key: "calendarView", name: "Calendar View", nameFr: "Vue Calendrier", description: "", descriptionFr: "", included: "Basic", includedLabel: "Basic", icon: "Calendar", enabled: true },
      { id: "f4", key: "vendorManagement", name: "Vendor Management", nameFr: "Gestion des Fournisseurs", description: "", descriptionFr: "", included: "Up to 5", includedLabel: "Up to 5", icon: "Contact", enabled: true },
      { id: "f5", key: "guestManagement", name: "Guest Management", nameFr: "Gestion des Invités", description: "", descriptionFr: "", included: "Up to 30", includedLabel: "Up to 30", icon: "UserPlus", enabled: true },
      { id: "f6", key: "budgetTracking", name: "Budget Tracking", nameFr: "Suivi Budgétaire", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "CreditCard", enabled: false },
      { id: "f7", key: "invoicesQuotations", name: "Invoices & Quotations", nameFr: "Factures et Devis", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "FileText", enabled: false },
      { id: "f8", key: "seatingCharts", name: "Seating Charts", nameFr: "Plans de Table", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "LayoutGrid", enabled: false },
      { id: "f9", key: "mealPlanning", name: "AI Meal Planning", nameFr: "Planification de Repas IA", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "Utensils", enabled: false },
      { id: "f10", key: "designSuggestions", name: "AI Design Suggestions", nameFr: "Suggestions de Design IA", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "Palette", enabled: false },
    ],
    order: 0,
  },
  {
    id: "plan_starter",
    name: "Starter",
    nameFr: "Débutant",
    description: "For established wedding planners with a growing business.",
    descriptionFr: "Pour les planificateurs de mariage établis avec une entreprise en croissance.",
    price: 19.99,
    yearlyPrice: 199.99,
    currency: "USD",
    trialDays: 14,
    billingCycleOptions: ["monthly", "yearly"],
    badge: "Most Popular",
    badgeColor: "from-rose-400 to-violet-500",
    isPopular: true,
    isHighlighted: true,
    yearlyDiscountPercent: 17,
    buttonText: "Subscribe",
    buttonTextFr: "S'abonner",
    features: [
      { id: "f11", key: "clientManagement", name: "Client Management", nameFr: "Gestion des Clients", description: "", descriptionFr: "", included: "Unlimited", includedLabel: "Unlimited", icon: "Users", enabled: true },
      { id: "f12", key: "taskManagement", name: "Task Management", nameFr: "Gestion des Tâches", description: "", descriptionFr: "", included: "Advanced", includedLabel: "Advanced", icon: "CheckSquare", enabled: true },
      { id: "f13", key: "calendarView", name: "Calendar View", nameFr: "Vue Calendrier", description: "", descriptionFr: "", included: "Full", includedLabel: "Full", icon: "Calendar", enabled: true },
      { id: "f14", key: "vendorManagement", name: "Vendor Management", nameFr: "Gestion des Fournisseurs", description: "", descriptionFr: "", included: "Unlimited", includedLabel: "Unlimited", icon: "Contact", enabled: true },
      { id: "f15", key: "guestManagement", name: "Guest Management", nameFr: "Gestion des Invités", description: "", descriptionFr: "", included: "Up to 150", includedLabel: "Up to 150", icon: "UserPlus", enabled: true },
      { id: "f16", key: "budgetTracking", name: "Budget Tracking", nameFr: "Suivi Budgétaire", description: "", descriptionFr: "", included: true, includedLabel: "", icon: "CreditCard", enabled: true },
      { id: "f17", key: "invoicesQuotations", name: "Invoices & Quotations", nameFr: "Factures et Devis", description: "", descriptionFr: "", included: "Basic", includedLabel: "Basic", icon: "FileText", enabled: true },
      { id: "f18", key: "seatingCharts", name: "Seating Charts", nameFr: "Plans de Table", description: "", descriptionFr: "", included: "Basic", includedLabel: "Basic", icon: "LayoutGrid", enabled: true },
      { id: "f19", key: "mealPlanning", name: "AI Meal Planning", nameFr: "Planification de Repas IA", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "Utensils", enabled: false },
      { id: "f20", key: "designSuggestions", name: "AI Design Suggestions", nameFr: "Suggestions de Design IA", description: "", descriptionFr: "", included: false, includedLabel: "", icon: "Palette", enabled: false },
    ],
    order: 1,
  },
  {
    id: "plan_pro",
    name: "Pro",
    nameFr: "Pro",
    description: "For professional wedding planners with multiple clients.",
    descriptionFr: "Pour les planificateurs de mariage professionnels avec plusieurs clients.",
    price: 39.99,
    yearlyPrice: 399.99,
    currency: "USD",
    trialDays: 14,
    billingCycleOptions: ["monthly", "yearly"],
    badge: "",
    badgeColor: "from-violet-400 to-purple-500",
    isPopular: false,
    isHighlighted: false,
    yearlyDiscountPercent: 17,
    buttonText: "Subscribe",
    buttonTextFr: "S'abonner",
    features: [
      { id: "f21", key: "clientManagement", name: "Client Management", nameFr: "Gestion des Clients", description: "", descriptionFr: "", included: "Unlimited", includedLabel: "Unlimited", icon: "Users", enabled: true },
      { id: "f22", key: "taskManagement", name: "Task Management", nameFr: "Gestion des Tâches", description: "", descriptionFr: "", included: "Advanced", includedLabel: "Advanced", icon: "CheckSquare", enabled: true },
      { id: "f23", key: "calendarView", name: "Calendar View", nameFr: "Vue Calendrier", description: "", descriptionFr: "", included: "Full", includedLabel: "Full", icon: "Calendar", enabled: true },
      { id: "f24", key: "vendorManagement", name: "Vendor Management", nameFr: "Gestion des Fournisseurs", description: "", descriptionFr: "", included: "Unlimited", includedLabel: "Unlimited", icon: "Contact", enabled: true },
      { id: "f25", key: "guestManagement", name: "Guest Management", nameFr: "Gestion des Invités", description: "", descriptionFr: "", included: "Unlimited", includedLabel: "Unlimited", icon: "UserPlus", enabled: true },
      { id: "f26", key: "budgetTracking", name: "Budget Tracking", nameFr: "Suivi Budgétaire", description: "", descriptionFr: "", included: "Advanced", includedLabel: "Advanced", icon: "CreditCard", enabled: true },
      { id: "f27", key: "invoicesQuotations", name: "Invoices & Quotations", nameFr: "Factures et Devis", description: "", descriptionFr: "", included: "Advanced", includedLabel: "Advanced", icon: "FileText", enabled: true },
      { id: "f28", key: "seatingCharts", name: "Seating Charts", nameFr: "Plans de Table", description: "", descriptionFr: "", included: "Advanced", includedLabel: "Advanced", icon: "LayoutGrid", enabled: true },
      { id: "f29", key: "mealPlanning", name: "AI Meal Planning", nameFr: "Planification de Repas IA", description: "", descriptionFr: "", included: true, includedLabel: "", icon: "Utensils", enabled: true },
      { id: "f30", key: "designSuggestions", name: "AI Design Suggestions", nameFr: "Suggestions de Design IA", description: "", descriptionFr: "", included: true, includedLabel: "", icon: "Palette", enabled: true },
    ],
    order: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AdminPricingManager = () => {
  const { t } = useTranslation("admin");
  const [plans, setPlans] = useState<PricingPlan[]>(getInitialPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [featureDeleteDialogOpen, setFeatureDeleteDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<{ planId: string; featureId: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;

  // ─── Plan CRUD ──────────────────────────────────────────────────────────────
  const handleAddPlan = useCallback(() => {
    const newPlan = createDefaultPlan(plans.length);
    setPlans((prev) => [...prev, newPlan]);
    setSelectedPlanId(newPlan.id);
    setHasUnsavedChanges(true);
    toast.success("New plan created. Fill in the details.");
  }, [plans.length]);

  const handleDuplicatePlan = useCallback(
    (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;
      const duplicated: PricingPlan = {
        ...plan,
        id: `plan_${Date.now()}`,
        name: `${plan.name} (Copy)`,
        nameFr: `${plan.nameFr} (Copie)`,
        order: plans.length,
        isPopular: false,
        features: plan.features.map((f) => ({
          ...f,
          id: `feat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        })),
      };
      setPlans((prev) => [...prev, duplicated]);
      setSelectedPlanId(duplicated.id);
      setHasUnsavedChanges(true);
      toast.success("Plan duplicated successfully.");
    },
    [plans]
  );

  const handleDeletePlan = useCallback(() => {
    if (!planToDelete) return;
    setPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planToDelete).map((p, i) => ({ ...p, order: i }));
      return updated;
    });
    if (selectedPlanId === planToDelete) setSelectedPlanId(null);
    setPlanToDelete(null);
    setDeleteDialogOpen(false);
    setHasUnsavedChanges(true);
    toast.success("Plan deleted successfully.");
  }, [planToDelete, selectedPlanId]);

  const handleMovePlan = useCallback(
    (planId: string, direction: "up" | "down") => {
      const sortedPlans = [...plans].sort((a, b) => a.order - b.order);
      const index = sortedPlans.findIndex((p) => p.id === planId);
      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === sortedPlans.length - 1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      const tempOrder = sortedPlans[index].order;
      sortedPlans[index] = { ...sortedPlans[index], order: sortedPlans[swapIndex].order };
      sortedPlans[swapIndex] = { ...sortedPlans[swapIndex], order: tempOrder };

      setPlans(sortedPlans);
      setHasUnsavedChanges(true);
    },
    [plans]
  );

  // ─── Plan Field Updates ─────────────────────────────────────────────────────
  const updatePlan = useCallback(
    (field: keyof PricingPlan, value: any) => {
      if (!selectedPlanId) return;
      setPlans((prev) =>
        prev.map((p) => (p.id === selectedPlanId ? { ...p, [field]: value } : p))
      );
      setHasUnsavedChanges(true);
      // Clear validation errors for the field being edited
      setValidationErrors((prev) => prev.filter((e) => e.field !== field));
    },
    [selectedPlanId]
  );

  // ─── Feature CRUD ───────────────────────────────────────────────────────────
  const handleAddFeature = useCallback(() => {
    if (!selectedPlanId) return;
    const newFeature = createDefaultFeature();
    setPlans((prev) =>
      prev.map((p) =>
        p.id === selectedPlanId ? { ...p, features: [...p.features, newFeature] } : p
      )
    );
    setHasUnsavedChanges(true);
    toast.success("Feature added. Fill in the details.");
  }, [selectedPlanId]);

  const handleDeleteFeature = useCallback(() => {
    if (!featureToDelete) return;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === featureToDelete.planId
          ? { ...p, features: p.features.filter((f) => f.id !== featureToDelete.featureId) }
          : p
      )
    );
    setFeatureToDelete(null);
    setFeatureDeleteDialogOpen(false);
    setHasUnsavedChanges(true);
    toast.success("Feature removed.");
  }, [featureToDelete]);

  const updateFeature = useCallback(
    (featureId: string, field: keyof PlanFeature, value: any) => {
      if (!selectedPlanId) return;
      setPlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlanId
            ? {
                ...p,
                features: p.features.map((f) =>
                  f.id === featureId ? { ...f, [field]: value } : f
                ),
              }
            : p
        )
      );
      setHasUnsavedChanges(true);
    },
    [selectedPlanId]
  );

  const handleMoveFeature = useCallback(
    (featureId: string, direction: "up" | "down") => {
      if (!selectedPlanId) return;
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPlanId) return p;
          const features = [...p.features];
          const index = features.findIndex((f) => f.id === featureId);
          if (direction === "up" && index === 0) return p;
          if (direction === "down" && index === features.length - 1) return p;
          const swapIndex = direction === "up" ? index - 1 : index + 1;
          [features[index], features[swapIndex]] = [features[swapIndex], features[index]];
          return { ...p, features };
        })
      );
      setHasUnsavedChanges(true);
    },
    [selectedPlanId]
  );

  // ─── Save / Publish ─────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // Validate all plans
    const allErrors: ValidationError[] = [];
    plans.forEach((plan) => {
      const errors = validatePlan(plan);
      errors.forEach((e) => allErrors.push({ ...e, field: `${plan.id}.${e.field}` }));
      plan.features.forEach((feat) => {
        const featErrors = validateFeature(feat);
        featErrors.forEach((e) =>
          allErrors.push({ ...e, field: `${plan.id}.feature.${feat.id}.${e.field}` })
        );
      });
    });

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      toast.error(`Validation failed: ${allErrors.length} error(s) found. Please fix them.`);
      return;
    }

    // In a real app, this would save to Supabase and update locale files
    setHasUnsavedChanges(false);
    setValidationErrors([]);
    toast.success("All plans saved successfully! Pricing page updated.");
  }, [plans]);

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      if (!selectedPlanId) return undefined;
      const error = validationErrors.find((e) => e.field === `${selectedPlanId}.${field}`);
      return error?.message;
    },
    [selectedPlanId, validationErrors]
  );

  const getFeatureFieldError = useCallback(
    (featureId: string, field: string): string | undefined => {
      if (!selectedPlanId) return undefined;
      const error = validationErrors.find(
        (e) => e.field === `${selectedPlanId}.feature.${featureId}.${field}`
      );
      return error?.message;
    },
    [selectedPlanId, validationErrors]
  );

  const currencySymbol = CURRENCIES.find((c) => c.value === (selectedPlan?.currency || "USD"))?.symbol || "$";

  const sortedPlans = [...plans].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-rose-400" />
            Plans & Pricing Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and manage subscription plans. Changes are previewed in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="gap-1.5 bg-gradient-to-r from-rose-400 to-violet-500 text-white"
          >
            <Check className="h-4 w-4" />
            Save & Publish
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          You have unsaved changes. Click "Save & Publish" to apply.
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 xl:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        {/* ═══════════════════════════════════════════════════════════════════════
            LEFT: PLAN MANAGEMENT
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* Plan List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Plans</CardTitle>
                <Button size="sm" onClick={handleAddPlan} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? "border-rose-300 bg-rose-50/50"
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePlan(plan.id, "up");
                        }}
                        disabled={plan.order === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovePlan(plan.id, "down");
                        }}
                        disabled={plan.order === plans.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{plan.name || "Untitled Plan"}</span>
                        {plan.isPopular && (
                          <Badge className="bg-gradient-to-r from-rose-400 to-violet-500 text-white text-[10px] px-1.5 py-0">
                            Popular
                          </Badge>
                        )}
                        {plan.badge && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {plan.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {currencySymbol}{plan.price}/mo · {plan.features.filter((f) => f.enabled).length} features
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePlan(plan.id);
                        }}
                        title="Duplicate plan"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete plan"
                        disabled={plans.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Editor */}
          {selectedPlan && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Edit Plan: {selectedPlan.name || "Untitled"}
                </CardTitle>
                <CardDescription>Configure plan details, pricing, and features.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-420px)]">
                  <div className="space-y-6 pr-4">
                    {/* ─── Basic Info ─────────────────────────────────── */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Basic Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-name" className="text-xs">Name (English) *</Label>
                          <Input
                            id="plan-name"
                            value={selectedPlan.name}
                            onChange={(e) => updatePlan("name", e.target.value)}
                            placeholder="e.g. Starter"
                            className={getFieldError("name") ? "border-red-400" : ""}
                          />
                          {getFieldError("name") && (
                            <p className="text-[11px] text-red-500">{getFieldError("name")}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-name-fr" className="text-xs">Name (French) *</Label>
                          <Input
                            id="plan-name-fr"
                            value={selectedPlan.nameFr}
                            onChange={(e) => updatePlan("nameFr", e.target.value)}
                            placeholder="ex: Débutant"
                            className={getFieldError("nameFr") ? "border-red-400" : ""}
                          />
                          {getFieldError("nameFr") && (
                            <p className="text-[11px] text-red-500">{getFieldError("nameFr")}</p>
                          )}
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="plan-desc" className="text-xs">Description (English) *</Label>
                          <Textarea
                            id="plan-desc"
                            value={selectedPlan.description}
                            onChange={(e) => updatePlan("description", e.target.value)}
                            placeholder="Describe this plan..."
                            rows={2}
                            className={getFieldError("description") ? "border-red-400" : ""}
                          />
                          {getFieldError("description") && (
                            <p className="text-[11px] text-red-500">{getFieldError("description")}</p>
                          )}
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="plan-desc-fr" className="text-xs">Description (French) *</Label>
                          <Textarea
                            id="plan-desc-fr"
                            value={selectedPlan.descriptionFr}
                            onChange={(e) => updatePlan("descriptionFr", e.target.value)}
                            placeholder="Décrivez ce forfait..."
                            rows={2}
                            className={getFieldError("descriptionFr") ? "border-red-400" : ""}
                          />
                          {getFieldError("descriptionFr") && (
                            <p className="text-[11px] text-red-500">{getFieldError("descriptionFr")}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ─── Pricing ────────────────────────────────────── */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pricing
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-price" className="text-xs">Monthly Price *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currencySymbol}
                            </span>
                            <Input
                              id="plan-price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedPlan.price}
                              onChange={(e) => updatePlan("price", parseFloat(e.target.value) || 0)}
                              className={`pl-7 ${getFieldError("price") ? "border-red-400" : ""}`}
                            />
                          </div>
                          {getFieldError("price") && (
                            <p className="text-[11px] text-red-500">{getFieldError("price")}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-yearly-price" className="text-xs">Yearly Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currencySymbol}
                            </span>
                            <Input
                              id="plan-yearly-price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedPlan.yearlyPrice}
                              onChange={(e) => updatePlan("yearlyPrice", parseFloat(e.target.value) || 0)}
                              className={`pl-7 ${getFieldError("yearlyPrice") ? "border-red-400" : ""}`}
                            />
                          </div>
                          {getFieldError("yearlyPrice") && (
                            <p className="text-[11px] text-red-500">{getFieldError("yearlyPrice")}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-currency" className="text-xs">Currency</Label>
                          <Select
                            value={selectedPlan.currency}
                            onValueChange={(v) => updatePlan("currency", v)}
                          >
                            <SelectTrigger id="plan-currency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-discount" className="text-xs">Yearly Discount %</Label>
                          <Input
                            id="plan-discount"
                            type="number"
                            min="0"
                            max="100"
                            value={selectedPlan.yearlyDiscountPercent}
                            onChange={(e) => updatePlan("yearlyDiscountPercent", parseInt(e.target.value) || 0)}
                            className={getFieldError("yearlyDiscountPercent") ? "border-red-400" : ""}
                          />
                          {getFieldError("yearlyDiscountPercent") && (
                            <p className="text-[11px] text-red-500">{getFieldError("yearlyDiscountPercent")}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-trial" className="text-xs">Trial Period (days)</Label>
                          <Input
                            id="plan-trial"
                            type="number"
                            min="0"
                            value={selectedPlan.trialDays}
                            onChange={(e) => updatePlan("trialDays", parseInt(e.target.value) || 0)}
                            className={getFieldError("trialDays") ? "border-red-400" : ""}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ─── Badge & Display ────────────────────────────── */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Badge & Display
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-badge" className="text-xs">Badge Text</Label>
                          <Input
                            id="plan-badge"
                            value={selectedPlan.badge}
                            onChange={(e) => updatePlan("badge", e.target.value)}
                            placeholder="e.g. Most Popular"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Badge Color</Label>
                          <Select
                            value={selectedPlan.badgeColor}
                            onValueChange={(v) => updatePlan("badgeColor", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BADGE_COLORS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${c.value}`} />
                                    {c.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={selectedPlan.isPopular}
                              onCheckedChange={(v) => updatePlan("isPopular", v)}
                            />
                            <Label className="text-xs">Mark as Popular</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={selectedPlan.isHighlighted}
                              onCheckedChange={(v) => updatePlan("isHighlighted", v)}
                            />
                            <Label className="text-xs">Highlight / Recommended</Label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-btn-text" className="text-xs">Button Text (EN) *</Label>
                          <Input
                            id="plan-btn-text"
                            value={selectedPlan.buttonText}
                            onChange={(e) => updatePlan("buttonText", e.target.value)}
                            placeholder="e.g. Subscribe"
                            className={getFieldError("buttonText") ? "border-red-400" : ""}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plan-btn-text-fr" className="text-xs">Button Text (FR) *</Label>
                          <Input
                            id="plan-btn-text-fr"
                            value={selectedPlan.buttonTextFr}
                            onChange={(e) => updatePlan("buttonTextFr", e.target.value)}
                            placeholder="ex: S'abonner"
                            className={getFieldError("buttonTextFr") ? "border-red-400" : ""}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ─── Features ───────────────────────────────────── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <ToggleLeft className="h-4 w-4" />
                          Features ({selectedPlan.features.length})
                        </h4>
                        <Button size="sm" variant="outline" onClick={handleAddFeature} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Add Feature
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {selectedPlan.features.map((feature, featureIndex) => (
                          <div
                            key={feature.id}
                            className={`rounded-xl border p-4 transition-colors ${
                              feature.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <div className="flex flex-col gap-0.5 mt-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveFeature(feature.id, "up")}
                                  disabled={featureIndex === 0}
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveFeature(feature.id, "down")}
                                  disabled={featureIndex === selectedPlan.features.length - 1}
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[11px]">Name (EN) *</Label>
                                  <Input
                                    value={feature.name}
                                    onChange={(e) => updateFeature(feature.id, "name", e.target.value)}
                                    placeholder="Feature name"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[11px]">Name (FR) *</Label>
                                  <Input
                                    value={feature.nameFr}
                                    onChange={(e) => updateFeature(feature.id, "nameFr", e.target.value)}
                                    placeholder="Nom de la fonctionnalité"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Switch
                                  checked={feature.enabled}
                                  onCheckedChange={(v) => updateFeature(feature.id, "enabled", v)}
                                  className="scale-75"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-400 hover:text-red-600"
                                  onClick={() => {
                                    setFeatureToDelete({ planId: selectedPlan.id, featureId: feature.id });
                                    setFeatureDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {feature.enabled && (
                              <div className="grid grid-cols-3 gap-3 ml-9">
                                <div className="space-y-1">
                                  <Label className="text-[11px]">Included Value</Label>
                                  <Select
                                    value={typeof feature.included === "boolean" ? (feature.included ? "true" : "false") : "custom"}
                                    onValueChange={(v) => {
                                      if (v === "true") updateFeature(feature.id, "included", true);
                                      else if (v === "false") updateFeature(feature.id, "included", false);
                                      else updateFeature(feature.id, "included", "");
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">✓ Included</SelectItem>
                                      <SelectItem value="false">✗ Not included</SelectItem>
                                      <SelectItem value="custom">Custom label</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {typeof feature.included === "string" && (
                                  <div className="space-y-1">
                                    <Label className="text-[11px]">Custom Label</Label>
                                    <Input
                                      value={feature.included}
                                      onChange={(e) => updateFeature(feature.id, "included", e.target.value)}
                                      placeholder="e.g. Up to 50"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <Label className="text-[11px]">Icon</Label>
                                  <Select
                                    value={feature.icon}
                                    onValueChange={(v) => updateFeature(feature.id, "icon", v)}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ICON_OPTIONS.map((icon) => (
                                        <SelectItem key={icon} value={icon}>
                                          {icon}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {selectedPlan.features.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No features yet. Click "Add Feature" to get started.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {!selectedPlan && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Plan Selected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a plan from the list above to edit its details, or create a new one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RIGHT: LIVE PREVIEW
            ═══════════════════════════════════════════════════════════════════════ */}
        {showPreview && (
          <div className="xl:sticky xl:top-6 self-start">
            <Card className="border-2 border-dashed border-violet-200 bg-gradient-to-b from-violet-50/30 to-rose-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-violet-500" />
                  Live Preview
                </CardTitle>
                <CardDescription className="text-[11px]">
                  This is how your pricing page will appear to users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedPlans.map((plan) => {
                    const sym = CURRENCIES.find((c) => c.value === plan.currency)?.symbol || "$";
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl p-4 transition-all ${
                          plan.isPopular
                            ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg scale-[1.02]"
                            : "bg-white border border-gray-100 shadow-sm"
                        }`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r ${plan.badgeColor} text-white rounded-full`}>
                              {plan.badge}
                            </span>
                          </div>
                        )}

                        <h4 className={`text-sm font-semibold ${plan.isPopular ? "text-white" : "text-gray-900"}`}>
                          {plan.name || "Untitled"}
                        </h4>
                        <p className={`text-[11px] mb-2 ${plan.isPopular ? "text-gray-300" : "text-gray-400"}`}>
                          {plan.description || "No description"}
                        </p>

                        <div className="mb-3">
                          <span className={`text-2xl font-bold ${plan.isPopular ? "text-white" : "text-gray-900"}`}>
                            {sym}{plan.price}
                          </span>
                          {plan.price > 0 && (
                            <span className={`text-[11px] ml-0.5 ${plan.isPopular ? "text-gray-400" : "text-gray-400"}`}>
                              /mo
                            </span>
                          )}
                          {plan.yearlyPrice > 0 && plan.yearlyDiscountPercent > 0 && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                              Save {plan.yearlyDiscountPercent}%
                            </span>
                          )}
                        </div>

                        <div className={`w-full py-1.5 rounded-lg text-[11px] font-medium text-center mb-3 ${
                          plan.isPopular
                            ? "bg-white text-gray-900"
                            : "bg-gray-900 text-white"
                        }`}>
                          {plan.buttonText || "Subscribe"}
                        </div>

                        <ul className="space-y-1.5">
                          {plan.features.filter((f) => f.enabled).slice(0, 5).map((feat) => (
                            <li key={feat.id} className="flex items-center gap-1.5">
                              {typeof feat.included === "boolean" ? (
                                feat.included ? (
                                  <Check className={`h-3 w-3 ${plan.isPopular ? "text-emerald-400" : "text-emerald-500"}`} />
                                ) : (
                                  <X className={`h-3 w-3 ${plan.isPopular ? "text-gray-600" : "text-gray-300"}`} />
                                )
                              ) : (
                                <Check className={`h-3 w-3 ${plan.isPopular ? "text-emerald-400" : "text-emerald-500"}`} />
                              )}
                              <span className={`text-[11px] ${plan.isPopular ? "text-gray-300" : "text-gray-600"}`}>
                                {feat.name || "Unnamed"}
                                {typeof feat.included === "string" && feat.included && (
                                  <span className={`ml-0.5 ${plan.isPopular ? "text-gray-500" : "text-gray-400"}`}>
                                    ({feat.included})
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                          {plan.features.filter((f) => f.enabled).length > 5 && (
                            <li className={`text-[10px] ${plan.isPopular ? "text-gray-500" : "text-gray-400"}`}>
                              +{plan.features.filter((f) => f.enabled).length - 5} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ═══ Delete Plan Confirmation Dialog ═══ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone. All
              associated features and pricing data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Delete Feature Confirmation Dialog ═══ */}
      <AlertDialog open={featureDeleteDialogOpen} onOpenChange={setFeatureDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this feature from the plan? This will affect how
              the plan is displayed to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPricingManager;
