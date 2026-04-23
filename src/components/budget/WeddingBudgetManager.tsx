/**
 * WeddingBudgetManager
 *
 * Premium budget management with inline editing, collapsible subcategories,
 * CRUD operations, and a compact romantic design.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown, Wallet,
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, Check, X,
  Sparkles, Heart, Receipt, Gem, Music, Camera, Utensils,
  Car, Flower2, Shirt, Gift, Building, Palette, FileText,
  Truck, PartyPopper, MoreHorizontal, Film, Crown, Cake,
  Save, RotateCcw, Settings2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import { Budget, BudgetCategory, Client, VendorCategory } from '@/types';
import { formatCurrency } from '@/utils/formatters';

// ============================================================================
// Types
// ============================================================================

interface BudgetSubcategory {
  id: string;
  name: string;
  allocated: number;
}

interface BudgetCategoryFull {
  id: string;
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  vendorCategory: VendorCategory;
  allocated: number;
  subcategories: BudgetSubcategory[];
}

// ============================================================================
// Default Subcategories (AI-suggested)
// ============================================================================

const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  entertainment: ['DJ / Animation', 'Photobooth', 'Jeux & Activités', 'Spectacle'],
  beauty: ['Coiffure mariée', 'Maquillage mariée', 'Coiffure marié', 'Soins spa'],
  cake: ['Gâteau principal', 'Pièce montée', 'Candy bar', 'Livraison & installation'],
  catering: ['Cocktail dînatoire', 'Menu principal', 'Boissons', 'Service à table'],
  music: ['Musique cérémonie', 'DJ réception', 'Musiciens live', 'Sonorisation'],
  bride_attire: ['Robe de mariée', 'Voile & accessoires', 'Chaussures', 'Retouches'],
  groom_attire: ['Costume', 'Chemise & cravate', 'Chaussures', 'Accessoires'],
  favors: ['Dragées & cadeaux', 'Sac à cadeau', 'Personnalisation', 'Cartes de remerciement'],
  flowers: ['Bouquet mariée', 'Décoration ceremony', 'Centres de table', 'Arch de fleurs'],
  invitations: ['Faire-part', 'Menus', 'Marque-places', 'Papeterie divers'],
  jewelry: ['Alliances', 'Bague de fiançailles', 'Bijoux mariée', 'Montres'],
  officiant: ['Officiant', 'Témoins', 'Documents officiels', 'Cérémonie laïque'],
  photography: ['Photographe', 'Album photo', 'Tirages', 'Session engagement'],
  videography: ['Vidéaste', 'Montage', 'Drone', 'Film teaser'],
  planning: ['Wedding planner', 'Coordination jour J', 'Décoration', 'Réhéarsal'],
  rentals: ['Tentes & chapiteaux', 'Tables & chaises', 'Linge de table', 'Éclairage'],
  transport: ['Voiture mariés', 'Transport invités', 'Bus/navette', 'Parking'],
  venue: ['Location salle', 'Cérémonie', 'Réception', 'Hébergement'],
  other: ['Imprévus', 'Assurance', 'Tips & pourboires', 'Divers'],
};

// ============================================================================
// Template Definitions
// ============================================================================

const BUDGET_TEMPLATE: {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  vendorCategory: VendorCategory;
}[] = [
  { key: 'entertainment', label: 'Divertissement', icon: PartyPopper, color: '#e11d48', vendorCategory: 'other' },
  { key: 'beauty', label: 'Beauté et santé', icon: Sparkles, color: '#d946ef', vendorCategory: 'hair_makeup' },
  { key: 'cake', label: 'Gâteau', icon: Cake, color: '#f472b6', vendorCategory: 'cake' },
  { key: 'catering', label: 'Restauration', icon: Utensils, color: '#f59e0b', vendorCategory: 'catering' },
  { key: 'music', label: 'Musique de la cérémonie', icon: Music, color: '#a855f7', vendorCategory: 'music' },
  { key: 'bride_attire', label: 'Robe et tenue - Mariée', icon: Crown, color: '#ec4899', vendorCategory: 'attire' },
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
// Helpers
// ============================================================================

let _nextId = 1000;
function genId() { return String(_nextId++); }

function buildDefaultCategories(): BudgetCategoryFull[] {
  return BUDGET_TEMPLATE.map((t) => ({
    id: genId(),
    key: t.key,
    label: t.label,
    icon: t.icon,
    color: t.color,
    vendorCategory: t.vendorCategory,
    allocated: 0,
    subcategories: (DEFAULT_SUBCATEGORIES[t.key] || []).map((name) => ({
      id: genId(),
      name,
      allocated: 0,
    })),
  }));
}

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
  const budget = client.budget;
  const vendors = client.vendors || [];

  // Local state for categories (fully editable)
  const [categories, setCategories] = useState<BudgetCategoryFull[]>(() => buildDefaultCategories());
  const [totalBudget, setTotalBudget] = useState(budget?.totalBudget || 0);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Computed
  const totalSpent = useMemo(() => vendors.reduce((s, v) => s + (v.cost || 0), 0), [vendors]);
  const totalAllocated = useMemo(() => categories.reduce((s, c) => s + c.allocated, 0), [categories]);
  const remaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  // Pie chart data
  const pieData = useMemo(
    () => categories.filter((c) => c.allocated > 0).map((c) => ({
      name: c.label,
      value: c.allocated,
      color: c.color,
    })),
    [categories]
  );

  // Toggle category expand
  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Inline editing
  const startEdit = (id: string, field: string, value: string | number) => {
    setEditingId(id);
    setEditField(field);
    setEditValue(String(value));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const numVal = parseFloat(editValue) || 0;

    // Check if editing a subcategory allocated
    const cat = categories.find((c) =>
      c.subcategories.some((sc) => sc.id === editingId)
    );
    if (cat) {
      const sub = cat.subcategories.find((sc) => sc.id === editingId);
      if (sub && editField === 'allocated') {
        const oldSubAllocated = sub.allocated;
        const diff = numVal - oldSubAllocated;
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? {
                  ...c,
                  allocated: c.allocated + diff,
                  subcategories: c.subcategories.map((sc) =>
                    sc.id === editingId ? { ...sc, allocated: numVal } : sc
                  ),
                }
              : c
          )
        );
      } else if (sub && editField === 'name') {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? { ...c, subcategories: c.subcategories.map((sc) => sc.id === editingId ? { ...sc, name: editValue } : sc) }
              : c
          )
        );
      }
    } else {
      // Editing a category
      if (editField === 'allocated') {
        setCategories((prev) =>
          prev.map((c) => c.id === editingId ? { ...c, allocated: numVal } : c)
        );
      } else if (editField === 'label') {
        setCategories((prev) =>
          prev.map((c) => c.id === editingId ? { ...c, label: editValue } : c)
        );
    }
    }

    setEditingId(null);
    setEditField('');
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField('');
    setEditValue('');
  };

  // CRUD: Add subcategory
  const addSubcategory = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: [
                ...c.subcategories,
                { id: genId(), name: 'Nouvelle sous-catégorie', allocated: 0 },
              ],
            }
          : c
      )
    );
  };

  // CRUD: Delete subcategory
  const deleteSubcategory = (catId: string, subId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const sub = c.subcategories.find((s) => s.id === subId);
        const subAllocated = sub?.allocated || 0;
        return {
          ...c,
          allocated: c.allocated - subAllocated,
          subcategories: c.subcategories.filter((s) => s.id !== subId),
        };
      })
    );
  };

  // CRUD: Add new category
  const addNewCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: BudgetCategoryFull = {
      id: genId(),
      key: genId(),
      label: newCatName.trim(),
      icon: Star,
      color: ROMANTIC_COLORS[categories.length % ROMANTIC_COLORS.length],
      vendorCategory: 'other',
      allocated: 0,
      subcategories: [],
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName('');
    setIsAddCategoryOpen(false);
  };

  // CRUD: Delete category
  const deleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Save to backend
  const handleSave = () => {
    const budgetData = {
      totalBudget,
      categories: categories.map((c) => ({
        category: c.vendorCategory,
        allocated: c.allocated,
        spent: 0,
      })),
    };
    if (budget) {
      onUpdateBudget(budgetData);
    } else {
      onCreateBudget(budgetData);
    }
  };

  const handleReset = () => {
    setCategories(buildDefaultCategories());
    setTotalBudget(budget?.totalBudget || 0);
  };

  // Custom pie label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-4">
          <Wallet className="h-9 w-9 text-rose-400" />
        </div>
        <h3 className="text-lg font-serif font-bold text-gray-700 mb-2">Budget mariage</h3>
        <p className="text-sm text-gray-400 max-w-sm text-center mb-5">
          Planifiez le budget de votre mariage avec nos catégories pré-remplies.
        </p>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200"
        >
          <Heart className="mr-2 h-4 w-4" />
          Créer mon budget
        </Button>
      </motion.div>
    );
  }

  // ========================================================================
  // Main Budget View
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-800">Budget Mariage</h2>
            <p className="text-[11px] text-gray-400">{categories.length} catégories</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" /> Réinitialiser
                </Button>
              </TooltipTrigger>
              <TooltipContent>Réinitialiser toutes les catégories</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <Save className="h-3 w-3 mr-1" /> Enregistrer
          </Button>
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Budget', value: formatCurrency(totalBudget), icon: Wallet, bg: 'from-rose-500 to-pink-500' },
          { label: 'Alloué', value: formatCurrency(totalAllocated), icon: Receipt, bg: 'from-violet-500 to-purple-500' },
          { label: 'Dépensé', value: formatCurrency(totalSpent), icon: CreditCard, bg: 'from-amber-500 to-orange-500' },
          { label: 'Restant', value: formatCurrency(remaining), icon: remaining >= 0 ? TrendingUp : TrendingDown, bg: remaining >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-red-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-rose-100 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${stat.bg} flex items-center justify-center`}>
                <stat.icon className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-base font-bold text-gray-800">{stat.value}</p>
            {/* Editable total budget */}
            {stat.label === 'Budget' && (
              <button
                onClick={() => startEdit('__total__', 'totalBudget', totalBudget)}
                className="text-[10px] text-rose-400 hover:text-rose-600 mt-0.5"
              >
                Modifier
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Inline edit for total budget */}
      {editingId === '__total__' && editField === 'totalBudget' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-40 h-8 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { setTotalBudget(parseFloat(editValue) || 0); cancelEdit(); } if (e.key === 'Escape') cancelEdit(); }}
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setTotalBudget(parseFloat(editValue) || 0); cancelEdit(); }}>
            <Check className="h-3 w-3 text-emerald-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
            <X className="h-3 w-3 text-red-400" />
          </Button>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-rose-100 p-3 shadow-sm">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-gray-500">{spentPercent}% dépensé</span>
          <span className="text-gray-400">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
        </div>
        <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${spentPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-full rounded-full ${
              spentPercent > 90 ? 'bg-gradient-to-r from-red-400 to-red-500'
                : spentPercent > 75 ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                : 'bg-gradient-to-r from-rose-400 to-pink-400'
            }`}
          />
        </div>
      </div>

      {/* Main Content: Categories + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Categories List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-rose-50">
              <h3 className="text-sm font-serif font-bold text-gray-700">Catégories du budget</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddCategoryOpen(true)}
                className="h-7 text-xs text-rose-500 hover:text-rose-700"
              >
                <Plus className="h-3 w-3 mr-1" /> Catégorie
              </Button>
            </div>

            <div className="divide-y divide-gray-50">
              <AnimatePresence>
                {categories.map((cat, index) => {
                  const Icon = cat.icon;
                  const isExpanded = expandedCats.has(cat.id);
                  const subAllocated = cat.subcategories.reduce((s, sc) => s + sc.allocated, 0);
                  const percentUsed = cat.allocated > 0 ? Math.min(100, Math.round((subAllocated / cat.allocated) * 100)) : 0;

                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      {/* Category Row */}
                      <div className="group flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50/30 transition-colors">
                        {/* Expand toggle */}
                        <button onClick={() => toggleCat(cat.id)} className="flex-shrink-0">
                          {cat.subcategories.length > 0 ? (
                            isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <div className="w-3.5" />
                          )}
                        </button>

                        {/* Icon */}
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                        </div>

                        {/* Label (editable) */}
                        <div className="flex-1 min-w-0">
                          {editingId === cat.id && editField === 'label' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                onBlur={saveEdit}
                                className="h-6 text-xs"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              onDoubleClick={() => startEdit(cat.id, 'label', cat.label)}
                              className="text-xs font-medium text-gray-700 hover:text-rose-600 truncate"
                            >
                              {cat.label}
                            </button>
                          )}
                        </div>

                        {/* Allocated (editable) */}
                        <div className="flex-shrink-0 w-[90px] text-right">
                          {editingId === cat.id && editField === 'allocated' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                onBlur={saveEdit}
                                className="w-[70px] h-6 text-xs text-right"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(cat.id, 'allocated', cat.allocated)}
                              className="text-xs font-semibold text-gray-800 hover:text-rose-600"
                            >
                              {formatCurrency(cat.allocated)}
                            </button>
                          )}
                        </div>

                        {/* Mini progress */}
                        <div className="w-16 flex-shrink-0">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentUsed > 90 ? 'bg-red-400' : percentUsed > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => addSubcategory(cat.id)}
                                  className="p-1 rounded hover:bg-rose-100 text-gray-400 hover:text-rose-500"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ajouter sous-catégorie</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={() => startEdit(cat.id, 'label', cat.label)}
                            className="p-1 rounded hover:bg-rose-100 text-gray-400 hover:text-rose-500"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      <AnimatePresence>
                        {isExpanded && cat.subcategories.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden bg-gray-50/50"
                          >
                            {cat.subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="group/sub flex items-center gap-2 pl-12 pr-4 py-1.5 hover:bg-white/80 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color, opacity: 0.5 }} />
                                
                                {/* Sub name (editable) */}
                                <div className="flex-1 min-w-0">
                                  {editingId === sub.id && editField === 'name' ? (
                                    <Input
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                      onBlur={saveEdit}
                                      className="h-5 text-[11px]"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onDoubleClick={() => startEdit(sub.id, 'name', sub.name)}
                                      className="text-[11px] text-gray-600 hover:text-rose-600 truncate"
                                    >
                                      {sub.name}
                                    </button>
                                  )}
                                </div>

                                {/* Sub allocated (editable) */}
                                <div className="flex-shrink-0 w-[80px] text-right">
                                  {editingId === sub.id && editField === 'allocated' ? (
                                    <Input
                                      type="number"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                      onBlur={saveEdit}
                                      className="w-[70px] h-5 text-[11px] text-right"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onClick={() => startEdit(sub.id, 'allocated', sub.allocated)}
                                      className="text-[11px] font-medium text-gray-500 hover:text-rose-600"
                                    >
                                      {formatCurrency(sub.allocated)}
                                    </button>
                                  )}
                                </div>

                                {/* Sub actions */}
                                <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEdit(sub.id, 'name', sub.name)}
                                    className="p-0.5 rounded hover:bg-rose-100 text-gray-300 hover:text-rose-500"
                                  >
                                    <Pencil className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteSubcategory(cat.id, sub.id)}
                                    className="p-0.5 rounded hover:bg-red-100 text-gray-300 hover:text-red-500"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Subcategory total */}
                            <div className="flex items-center justify-between pl-12 pr-4 py-1.5 border-t border-gray-100">
                              <span className="text-[10px] text-gray-400 font-medium">Total sous-catégories</span>
                              <span className="text-[10px] font-semibold text-gray-500">{formatCurrency(subAllocated)}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer total */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50/30 border-t border-rose-100">
              <span className="text-xs font-medium text-gray-600">Total alloué</span>
              <span className="text-sm font-bold text-gray-800">{formatCurrency(totalAllocated)}</span>
            </div>
          </div>
        </div>

        {/* Right: Chart + Summary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Donut Chart */}
          <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-sm">
            <h3 className="text-xs font-serif font-bold text-gray-700 mb-3">Répartition</h3>
            {pieData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={renderCustomLabel}
                      animationBegin={200}
                      animationDuration={600}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #fecdd3', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-xs text-gray-400">Allouez des montants pour voir le graphique</p>
              </div>
            )}
          </div>

          {/* Quick Legend */}
          <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-sm">
            <h3 className="text-xs font-serif font-bold text-gray-700 mb-2">Catégories actives</h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {categories.filter((c) => c.allocated > 0).map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <Icon className="h-3 w-3" style={{ color: cat.color }} />
                    <span className="text-[11px] text-gray-600 truncate flex-1">{cat.label}</span>
                    <span className="text-[11px] font-medium text-gray-800">{formatCurrency(cat.allocated)}</span>
                  </div>
                );
              })}
              {categories.filter((c) => c.allocated > 0).length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-4">Aucune catégorie active</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-serif">Nouvelle catégorie</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle catégorie de budget personnalisée.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label className="text-xs">Nom de la catégorie</Label>
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex: Décoration"
              className="mt-1 h-9 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') addNewCategory(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddCategoryOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={addNewCategory} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ROMANTIC_COLORS = [
  '#e11d48', '#f472b6', '#ec4899', '#be185d',
  '#a855f7', '#8b5cf6', '#d946ef', '#f59e0b',
  '#fb923c', '#14b8a6', '#3b82f6', '#6366f1',
  '#78716c', '#64748b',
];

export default WeddingBudgetManager;
