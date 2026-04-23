/**
 * WeddingBudgetManager
 *
 * A stunning, premium budget management component for the wedding planning app.
 * Features Framer Motion animations, romantic color palette, donut chart,
 * animated progress bars, and a beautiful vertical category timeline.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Gem,
  Music,
  Camera,
  Utensils,
  Car,
  Flower2,
  Shirt,
  Gift,
  Building,
  Palette,
  FileText,
  Truck,
  PartyPopper,
  MoreHorizontal,
  Film,
  Crown,
  Star,
  Scissors,
  Wine,
  Cake,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Budget, BudgetCategory, Client, VendorCategory } from '@/types';
import { formatCurrency, formatVendorCategory } from '@/utils/formatters';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  venue: Building,
  catering: Utensils,
  photography: Camera,
  videography: Camera,
  florist: Flower2,
  music: Music,
  cake: PartyPopper,
  attire: Shirt,
  hair_makeup: Sparkles,
  transportation: Car,
  rentals: Truck,
  stationery: FileText,
  gifts: Gift,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<string, string> = {
  venue: '#e11d48',       // rose-600
  catering: '#f59e0b',    // amber-500
  photography: '#8b5cf6', // violet-500
  videography: '#6366f1', // indigo-500
  florist: '#ec4899',     // pink-500
  music: '#a855f7',       // purple-500
  cake: '#f472b6',        // pink-400
  attire: '#3b82f6',      // blue-500
  hair_makeup: '#d946ef', // fuchsia-500
  transportation: '#14b8a6', // teal-500
  rentals: '#64748b',     // slate-500
  stationery: '#78716c',  // stone-500
  gifts: '#e879f9',       // fuchsia-400
  other: '#9ca3af',       // gray-400
};

const ROMANTIC_COLORS = [
  '#e11d48', '#f472b6', '#ec4899', '#be185d',
  '#a855f7', '#8b5cf6', '#d946ef', '#f59e0b',
  '#fb923c', '#14b8a6', '#3b82f6', '#6366f1',
  '#78716c', '#64748b',
];

const VENDOR_CATEGORIES: VendorCategory[] = [
  'venue', 'catering', 'photography', 'videography', 'florist',
  'music', 'cake', 'attire', 'hair_makeup', 'transportation',
  'rentals', 'stationery', 'gifts', 'other',
];

// ============================================================================
// Comprehensive Budget Template (19 French Categories)
// ============================================================================

interface BudgetTemplateItem {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  vendorCategory: VendorCategory;
}

const BUDGET_TEMPLATE: BudgetTemplateItem[] = [
  { key: 'entertainment', label: 'Divertissement', icon: PartyPopper, color: '#e11d48', vendorCategory: 'other' },
  { key: 'beauty', label: 'Beauté et santé', icon: Sparkles, color: '#d946ef', vendorCategory: 'hair_makeup' },
  { key: 'cake', label: 'Gâteau', icon: Cake, color: '#f472b6', vendorCategory: 'cake' },
  { key: 'catering', label: 'Restauration', icon: Utensils, color: '#f59e0b', vendorCategory: 'catering' },
  { key: 'music', label: 'Musique de la cérémonie', icon: Music, color: '#a855f7', vendorCategory: 'music' },
  { key: 'bride_attire', label: 'Robe et tenue vestimentaire - Mariée', icon: Crown, color: '#ec4899', vendorCategory: 'attire' },
  { key: 'groom_attire', label: 'Costume - Marié', icon: Shirt, color: '#3b82f6', vendorCategory: 'attire' },
  { key: 'favors', label: 'Faveurs et cadeaux', icon: Gift, color: '#e879f9', vendorCategory: 'gifts' },
  { key: 'flowers', label: 'Fleurs', icon: Flower2, color: '#10b981', vendorCategory: 'florist' },
  { key: 'invitations', label: 'Invitations', icon: FileText, color: '#78716c', vendorCategory: 'stationery' },
  { key: 'jewelry', label: 'Bijoux', icon: Gem, color: '#eab308', vendorCategory: 'other' },
  { key: 'officiant', label: 'Fonctionnaire', icon: Building, color: '#6366f1', vendorCategory: 'venue' },
  { key: 'photography', label: 'Photographie', icon: Camera, color: '#8b5cf6', vendorCategory: 'photography' },
  { key: 'videography', label: 'Vidéographie', icon: Film, color: '#0ea5e9', vendorCategory: 'videography' },
  { key: 'planning', label: 'Planification', icon: Palette, color: '#14b8a6', vendorCategory: 'other' },
  { key: 'rentals', label: 'Locations', icon: Truck, color: '#64748b', vendorCategory: 'rentals' },
  { key: 'transport', label: 'Transport', icon: Car, color: '#f97316', vendorCategory: 'transportation' },
  { key: 'venue', label: 'Lieu', icon: Building, color: '#e11d48', vendorCategory: 'venue' },
  { key: 'other', label: 'Autres', icon: MoreHorizontal, color: '#9ca3af', vendorCategory: 'other' },
];

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

// ============================================================================
// Helper Components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtitle,
  trend,
  trendValue,
  gradient,
  delay = 0,
}) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
    whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(225, 29, 72, 0.12)' }}
    className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] opacity-10 ${gradient}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
    {trend && trendValue && (
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' ? (
          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
        ) : trend === 'down' ? (
          <ArrowDownRight className="h-3 w-3 text-red-500" />
        ) : null}
        <span className={`text-xs font-medium ${
          trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trendValue}
        </span>
      </div>
    )}
  </motion.div>
);

// ============================================================================
// Main Component
// ============================================================================

interface WeddingBudgetManagerProps {
  client: Client;
  onUpdateBudget: (budget: { totalBudget: number; categories: BudgetCategory[] }) => void;
  onCreateBudget: (budget: { totalBudget: number; categories: BudgetCategory[] }) => void;
}

const WeddingBudgetManager: React.FC<WeddingBudgetManagerProps> = ({
  client,
  onUpdateBudget,
  onCreateBudget,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editBudget, setEditBudget] = useState<{
    totalBudget: number;
    categories: BudgetCategory[];
  } | null>(null);

  const budget = client.budget;
  const vendors = client.vendors || [];

  // Computed values
  const totalSpent = useMemo(
    () => vendors.reduce((sum, v) => sum + (v.cost || 0), 0),
    [vendors]
  );

  const totalPaid = useMemo(
    () => vendors.filter((v) => v.isPaid).reduce((sum, v) => sum + (v.cost || 0), 0),
    [vendors]
  );

  const totalAllocated = useMemo(
    () => budget?.categories.reduce((sum, c) => sum + c.allocated, 0) || 0,
    [budget]
  );

  const remaining = budget ? budget.totalBudget - totalSpent : 0;
  const spentPercent = budget && budget.totalBudget > 0
    ? Math.min(100, Math.round((totalSpent / budget.totalBudget) * 100))
    : 0;

  // Category-level data
  const categoryData = useMemo(() => {
    if (!budget) return [];
    return budget.categories.map((cat) => {
      const catVendors = vendors.filter((v) => v.category === cat.category);
      const actual = catVendors.reduce((sum, v) => sum + (v.cost || 0), 0);
      const paid = catVendors.filter((v) => v.isPaid).reduce((sum, v) => sum + (v.cost || 0), 0);
      const difference = cat.allocated - actual;
      const percentUsed = cat.allocated > 0 ? Math.min(100, Math.round((actual / cat.allocated) * 100)) : 0;

      return {
        ...cat,
        actual,
        paid,
        difference,
        remainderToPay: actual - paid,
        percentUsed,
        vendors: catVendors,
        color: CATEGORY_COLORS[cat.category] || ROMANTIC_COLORS[0],
        icon: CATEGORY_ICONS[cat.category] || MoreHorizontal,
      };
    });
  }, [budget, vendors]);

  // Pie chart data
  const pieData = useMemo(
    () => categoryData.map((cat) => ({
      name: formatVendorCategory(cat.category),
      value: cat.allocated,
      color: cat.color,
    })),
    [categoryData]
  );

  // Comprehensive template data (19 categories with budget data)
  const templateData = useMemo(() => {
    return BUDGET_TEMPLATE.map((item) => {
      const budgetCat = budget?.categories.find((c) => c.category === item.vendorCategory);
      const catVendors = vendors.filter((v) => v.category === item.vendorCategory);
      const allocated = budgetCat?.allocated || 0;
      const spent = catVendors.reduce((sum, v) => sum + (v.cost || 0), 0);
      const remaining = allocated - spent;
      const percentUsed = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
      return { ...item, allocated, spent, remaining, percentUsed };
    });
  }, [budget, vendors]);

  // Handlers
  const handleOpenEdit = () => {
    if (budget) {
      const updatedCategories = budget.categories.map((cat) => {
        const catVendors = vendors.filter((v) => v.category === cat.category);
        const actual = catVendors.reduce((sum, v) => sum + (v.cost || 0), 0);
        return { ...cat, spent: actual };
      });
      setEditBudget({ totalBudget: budget.totalBudget, categories: updatedCategories });
    } else {
      setEditBudget({ totalBudget: 0, categories: [] });
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveBudget = () => {
    if (!editBudget) return;
    if (budget) {
      onUpdateBudget(editBudget);
    } else {
      onCreateBudget(editBudget);
    }
    setIsEditDialogOpen(false);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const addCategoryToEdit = () => {
    if (!editBudget) return;
    const existing = editBudget.categories.map((c) => c.category);
    const available = VENDOR_CATEGORIES.filter((c) => !existing.includes(c));
    if (available.length === 0) return;
    const newCat: BudgetCategory = {
      category: available[0],
      allocated: 0,
      spent: 0,
    };
    setEditBudget({ ...editBudget, categories: [...editBudget.categories, newCat] });
  };

  const removeCategoryFromEdit = (index: number) => {
    if (!editBudget) return;
    const cats = [...editBudget.categories];
    cats.splice(index, 1);
    setEditBudget({ ...editBudget, categories: cats });
  };

  const updateEditCategory = (index: number, field: keyof BudgetCategory, value: number | string) => {
    if (!editBudget) return;
    const cats = [...editBudget.categories];
    cats[index] = { ...cats[index], [field]: value };
    setEditBudget({ ...editBudget, categories: cats });
  };

  // Custom label for donut chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // ========================================================================
  // Empty State
  // ========================================================================

  if (!budget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-6">
            <Wallet className="h-12 w-12 text-rose-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-700 mb-2">
          Votre budget mariage
        </h3>
        <p className="text-sm text-gray-400 max-w-md text-center mb-6 leading-relaxed">
          Commencez à planifier le budget de votre mariage. Ajoutez des catégories,
          suivez vos dépenses et gardez le contrôle de vos finances.
        </p>
        <Button
          onClick={handleOpenEdit}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200 px-8"
        >
          <Heart className="mr-2 h-4 w-4" />
          Créer mon budget
        </Button>

        {/* Edit Dialog for empty state */}
        <BudgetEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          editBudget={editBudget}
          setEditBudget={setEditBudget}
          onSave={handleSaveBudget}
          onAddCategory={addCategoryToEdit}
          onRemoveCategory={removeCategoryFromEdit}
          onUpdateCategory={updateEditCategory}
        />
      </motion.div>
    );
  }

  // ========================================================================
  // Main Budget View
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-white border border-rose-100 p-6 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-bl-[120px] bg-gradient-to-br from-rose-100/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-[80px] bg-gradient-to-tr from-pink-100/30 to-transparent" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-800">Budget Mariage</h2>
                <p className="text-xs text-gray-400">Gérez vos finances en toute sérénité</p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Dépensé</span>
                <span className="font-semibold text-gray-700">
                  {spentPercent}% du budget
                </span>
              </div>
              <div className="h-3 bg-rose-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className={`h-full rounded-full ${
                    spentPercent > 90
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : spentPercent > 75
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-rose-400 to-pink-400'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatCurrency(totalSpent)} dépensé</span>
                <span>{formatCurrency(budget.totalBudget)} budget total</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleOpenEdit}
            className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier le budget
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Budget Total"
          value={formatCurrency(budget.totalBudget)}
          subtitle={`${budget.categories.length} catégories`}
          gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          delay={0}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Dépensé"
          value={formatCurrency(totalSpent)}
          trend={totalSpent > totalAllocated ? 'up' : 'neutral'}
          trendValue={spentPercent > 100 ? 'Dépassement !' : `${spentPercent}%`}
          gradient="bg-gradient-to-br from-violet-500 to-purple-500"
          delay={0.05}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Restant"
          value={formatCurrency(remaining)}
          trend={remaining >= 0 ? 'up' : 'down'}
          trendValue={remaining >= 0 ? 'Sous budget' : 'Dépassement'}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          delay={0.1}
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Payé"
          value={formatCurrency(totalPaid)}
          subtitle={`Reste ${formatCurrency(totalSpent - totalPaid)}`}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          delay={0.15}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Timeline */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-gray-700">
                Répartition par catégorie
              </h3>
              <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-200">
                {categoryData.length} catégories
              </Badge>
            </div>

            {categoryData.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-rose-100">
                <p className="text-gray-400 text-sm">Aucune catégorie de budget</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-rose-200 via-pink-200 to-violet-200 opacity-50" />

                <AnimatePresence>
                  {categoryData.map((cat, index) => {
                    const Icon = cat.icon;
                    const isExpanded = expandedCategories.has(cat.category);

                    return (
                      <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                        className="relative mb-3"
                      >
                        {/* Timeline Node */}
                        <div
                          className="absolute left-[11px] top-[20px] z-10 w-[18px] h-[18px] rounded-full border-[3px] border-white shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />

                        {/* Category Card */}
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="ml-10 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(cat.category)}
                            className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${cat.color}15` }}
                            >
                              <Icon className="h-4 w-4" style={{ color: cat.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-gray-800">
                                  {formatVendorCategory(cat.category)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {formatCurrency(cat.actual)} / {formatCurrency(cat.allocated)}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-300" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-300" />
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${cat.percentUsed}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                                  className={`h-full rounded-full ${
                                    cat.percentUsed > 90
                                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                                      : cat.percentUsed > 75
                                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                      : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                  }`}
                                />
                              </div>

                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-gray-400">{cat.percentUsed}% utilisé</span>
                                <span className={`text-[10px] font-medium ${
                                  cat.difference >= 0 ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                  {cat.difference >= 0 ? '+' : ''}{formatCurrency(cat.difference)}
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Expanded Vendor Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 border-t border-gray-50">
                                  {cat.vendors.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-3 text-center">
                                      Aucun prestataire dans cette catégorie
                                    </p>
                                  ) : (
                                    <div className="space-y-2 pt-3">
                                      {cat.vendors.map((vendor) => (
                                        <div
                                          key={vendor.id}
                                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${vendor.isPaid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                            <span className="text-xs font-medium text-gray-700">{vendor.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                              {formatCurrency(vendor.cost || 0)}
                                            </span>
                                            <Badge
                                              variant={vendor.isPaid ? 'default' : 'secondary'}
                                              className={`text-[10px] px-1.5 py-0 ${
                                                vendor.isPaid
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : 'bg-amber-100 text-amber-700'
                                              }`}
                                            >
                                              {vendor.isPaid ? 'Payé' : 'En attente'}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Payment Summary */}
                                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                      <p className="text-[10px] text-gray-400">Payé</p>
                                      <p className="text-xs font-semibold text-emerald-600">{formatCurrency(cat.paid)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-gray-400">Reste</p>
                                      <p className="text-xs font-semibold text-amber-600">{formatCurrency(cat.remainderToPay)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-gray-400">Écart</p>
                                      <p className={`text-xs font-semibold ${cat.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {cat.difference >= 0 ? '+' : ''}{formatCurrency(cat.difference)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Charts & Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm"
          >
            <h3 className="text-sm font-serif font-bold text-gray-700 mb-4">
              Répartition du budget
            </h3>
            {pieData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={renderCustomLabel}
                      animationBegin={300}
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #fecdd3',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-gray-400">Aucune donnée</p>
              </div>
            )}

            {/* Legend */}
            {pieData.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[11px] text-gray-500 truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Payment Milestones */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm"
          >
            <h3 className="text-sm font-serif font-bold text-gray-700 mb-4">
              Jalons de paiement
            </h3>

            <div className="space-y-4">
              {/* Total Budget Milestone */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">Budget Total</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(budget.totalBudget)}</p>
                  </div>
                </div>
              </div>

              {/* Spent Milestone */}
              <div className="relative ml-4 pl-4 border-l-2 border-rose-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">Total Dépensé</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(totalSpent)}</p>
                  </div>
                  <Badge variant="secondary" className="bg-violet-50 text-violet-600 text-[10px]">
                    {spentPercent}%
                  </Badge>
                </div>
              </div>

              {/* Paid Milestone */}
              <div className="relative ml-8 pl-4 border-l-2 border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">Total Payé</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                </div>
              </div>

              {/* Remaining Milestone */}
              <div className="relative ml-12 pl-4 border-l-2 border-amber-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    remaining >= 0
                      ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                      : 'bg-gradient-to-br from-red-400 to-red-500'
                  }`}>
                    {remaining >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      {remaining >= 0 ? 'Restant' : 'Dépassement'}
                    </p>
                    <p className={`text-lg font-bold ${remaining >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(remaining))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Summary Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm"
          >
            <h3 className="text-sm font-serif font-bold text-gray-700 mb-4">
              Résumé financier
            </h3>
            <div className="space-y-3">
              {categoryData.slice(0, 5).map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                      <span className="text-xs text-gray-600">{formatVendorCategory(cat.category)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-800">{formatCurrency(cat.actual)}</span>
                      <span className="text-[10px] text-gray-400">/ {formatCurrency(cat.allocated)}</span>
                    </div>
                  </div>
                );
              })}
              {categoryData.length > 5 && (
                <p className="text-[10px] text-gray-400 text-center">
                  +{categoryData.length - 5} autres catégories
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Comprehensive 19-Category Budget List */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-700">
                Détail des catégories
              </h3>
              <p className="text-xs text-gray-400">
                {templateData.filter((t) => t.allocated > 0).length} catégories actives sur {templateData.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-400">Alloué</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-gray-400">Dépensé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-gray-400">Restant</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templateData.map((item, index) => {
            const Icon = item.icon;
            const isOverBudget = item.remaining < 0;
            const isActive = item.allocated > 0 || item.spent > 0;

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.03, type: 'spring' as const, stiffness: 300, damping: 24 }}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  isActive
                    ? 'border-rose-100 bg-gradient-to-r from-white to-rose-50/30'
                    : 'border-gray-50 bg-gray-50/30 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                </div>

                {/* Label & Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate pr-2">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {item.percentUsed}%
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentUsed}%` }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.03 }}
                      className={`h-full rounded-full ${
                        item.percentUsed > 90
                          ? 'bg-gradient-to-r from-red-400 to-red-500'
                          : item.percentUsed > 75
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex-shrink-0 text-right min-w-[100px]">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-gray-400">Alloué</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrency(item.allocated)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-gray-400">Dépensé</span>
                    <span className="text-xs font-medium text-violet-600">
                      {formatCurrency(item.spent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-gray-400">Reste</span>
                    <span className={`text-xs font-bold ${
                      isOverBudget ? 'text-red-500' : item.remaining > 0 ? 'text-emerald-500' : 'text-gray-400'
                    }`}>
                      {isOverBudget ? '' : ''}{formatCurrency(item.remaining)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Template Total */}
        <div className="mt-4 pt-4 border-t border-rose-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total toutes catégories</span>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] text-gray-400">Alloué</p>
              <p className="text-sm font-bold text-gray-700">
                {formatCurrency(templateData.reduce((s, t) => s + t.allocated, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400">Dépensé</p>
              <p className="text-sm font-bold text-violet-600">
                {formatCurrency(templateData.reduce((s, t) => s + t.spent, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400">Restant</p>
              <p className={`text-sm font-bold ${
                templateData.reduce((s, t) => s + t.remaining, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(templateData.reduce((s, t) => s + t.remaining, 0))}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Budget Edit Dialog */}
      <BudgetEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editBudget={editBudget}
        setEditBudget={setEditBudget}
        onSave={handleSaveBudget}
        onAddCategory={addCategoryToEdit}
        onRemoveCategory={removeCategoryFromEdit}
        onUpdateCategory={updateEditCategory}
      />
    </div>
  );
};

// ============================================================================
// Budget Edit Dialog
// ============================================================================

interface BudgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBudget: { totalBudget: number; categories: BudgetCategory[] } | null;
  setEditBudget: (budget: { totalBudget: number; categories: BudgetCategory[] } | null) => void;
  onSave: () => void;
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
  onUpdateCategory: (index: number, field: keyof BudgetCategory, value: number | string) => void;
}

const BudgetEditDialog: React.FC<BudgetEditDialogProps> = ({
  open,
  onOpenChange,
  editBudget,
  setEditBudget,
  onSave,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
}) => {
  if (!editBudget) return null;

  const totalAllocated = editBudget.categories.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = editBudget.categories.reduce((s, c) => s + c.spent, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            💰 Budget : {formatCurrency(editBudget.totalBudget)}
          </DialogTitle>
          <DialogDescription>
            Modifiez le budget total et la répartition par catégorie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Budget Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex-1">
              <Label htmlFor="totalBudget">Budget Total</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  id="totalBudget"
                  value={editBudget.totalBudget}
                  onChange={(e) =>
                    setEditBudget({ ...editBudget, totalBudget: parseFloat(e.target.value) || 0 })
                  }
                  type="number"
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <Label>Total Alloué</Label>
              <div className="relative mt-1">
                <Input value={formatCurrency(totalAllocated)} readOnly className="bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">Répartition du budget</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddCategory}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {editBudget.categories.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader className="bg-rose-50/50">
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Alloué</TableHead>
                    <TableHead className="text-right">Dépensé</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editBudget.categories.map((category, index) => {
                    const diff = category.allocated - category.spent;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <select
                            value={category.category}
                            onChange={(e) => onUpdateCategory(index, 'category', e.target.value)}
                            className="text-sm border rounded px-2 py-1 bg-white"
                          >
                            {VENDOR_CATEGORIES.map((vc) => (
                              <option key={vc} value={vc}>
                                {formatVendorCategory(vc)}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={category.allocated}
                            onChange={(e) =>
                              onUpdateCategory(index, 'allocated', parseFloat(e.target.value) || 0)
                            }
                            className="w-[100px] ml-auto text-right h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={category.spent}
                            onChange={(e) =>
                              onUpdateCategory(index, 'spent', parseFloat(e.target.value) || 0)
                            }
                            className="w-[100px] ml-auto text-right h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => onRemoveCategory(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Totals Row */}
                  <TableRow className="font-medium bg-rose-50/30">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalAllocated)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSpent)}</TableCell>
                    <TableCell className="text-right">
                      <span className={totalAllocated - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {totalAllocated - totalSpent >= 0 ? '+' : ''}{formatCurrency(totalAllocated - totalSpent)}
                      </span>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border rounded-lg p-6 text-center">
              <p className="text-gray-400 text-sm">Aucune catégorie ajoutée</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onSave}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeddingBudgetManager;
