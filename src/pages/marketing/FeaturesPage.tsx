import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  ChevronRight,
  Heart,
  Shield,
  Zap,
  Check,
  Star,
  Quote,
  Play,
  Globe,
  FileSignature,
  FolderOpen,
  Package,
  BarChart3,
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

// ─── Feature Data ────────────────────────────────────────────────────────────
const featureDetails = [
  {
    key: "clientManagement",
    icon: Users,
    gradient: "from-rose-400 to-pink-500",
    accentColor: "rose",
    mockupType: "clients" as const,
  },
  {
    key: "weddingTimelines",
    icon: Calendar,
    gradient: "from-violet-400 to-purple-500",
    accentColor: "violet",
    mockupType: "timeline" as const,
  },
  {
    key: "taskTracking",
    icon: CheckSquare,
    gradient: "from-blue-400 to-indigo-500",
    accentColor: "blue",
    mockupType: "tasks" as const,
  },
  {
    key: "budgetTracking",
    icon: CreditCard,
    gradient: "from-emerald-400 to-green-500",
    accentColor: "emerald",
    mockupType: "budget" as const,
  },
  {
    key: "vendorManagement",
    icon: Contact,
    gradient: "from-amber-400 to-orange-500",
    accentColor: "amber",
    mockupType: "vendors" as const,
  },
  {
    key: "invoicesQuotations",
    icon: FileText,
    gradient: "from-teal-400 to-cyan-500",
    accentColor: "teal",
    mockupType: "invoices" as const,
  },
  {
    key: "guestManagement",
    icon: UserPlus,
    gradient: "from-cyan-400 to-teal-500",
    accentColor: "cyan",
    mockupType: "guests" as const,
  },
  {
    key: "seatingCharts",
    icon: LayoutGrid,
    gradient: "from-fuchsia-400 to-pink-500",
    accentColor: "fuchsia",
    mockupType: "seating" as const,
  },
  {
    key: "mealPlanning",
    icon: Utensils,
    gradient: "from-orange-400 to-red-500",
    accentColor: "orange",
    mockupType: "meals" as const,
    badge: "AI",
  },
  {
    key: "designSuggestions",
    icon: Palette,
    gradient: "from-indigo-400 to-violet-500",
    accentColor: "indigo",
    mockupType: "design" as const,
    badge: "AI",
  },
  {
    key: "contractsSignatures",
    icon: FileSignature,
    gradient: "from-pink-400 to-rose-500",
    accentColor: "pink",
    mockupType: "contracts" as const,
  },
  {
    key: "documentManagement",
    icon: FolderOpen,
    gradient: "from-sky-400 to-blue-500",
    accentColor: "sky",
    mockupType: "documents" as const,
  },
  {
    key: "resourceManagement",
    icon: Package,
    gradient: "from-lime-400 to-emerald-500",
    accentColor: "lime",
    mockupType: "resources" as const,
  },
  {
    key: "analyticsReporting",
    icon: BarChart3,
    gradient: "from-purple-400 to-indigo-500",
    accentColor: "purple",
    mockupType: "analytics" as const,
  },
  {
    key: "calendarScheduling",
    icon: Calendar,
    gradient: "from-teal-400 to-cyan-500",
    accentColor: "teal",
    mockupType: "calendar" as const,
  },
];

// ─── Feature Mockup Components ───────────────────────────────────────────────
const FeatureMockup = ({ type, gradient }: { type: string; gradient: string }) => {
  const mockups: Record<string, React.ReactNode> = {
    clients: (
      <div className="space-y-3">
        {[
          { name: "Sarah & James", date: "Jun 15, 2024", status: "On Track", statusColor: "bg-emerald-50 text-emerald-600" },
          { name: "Emma & Liam", date: "Jul 22, 2024", status: "Planning", statusColor: "bg-blue-50 text-blue-600" },
          { name: "Olivia & Noah", date: "Aug 8, 2024", status: "In Review", statusColor: "bg-amber-50 text-amber-600" },
        ].map((client) => (
          <div key={client.name} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/60 border border-white/80">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-medium`}>
                {client.name.split(" & ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{client.name}</p>
                <p className="text-[11px] text-gray-400">{client.date}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${client.statusColor}`}>{client.status}</span>
          </div>
        ))}
      </div>
    ),
    timeline: (
      <div className="space-y-2">
        {[
          { time: "2:00 PM", event: "Bridal Party Prep", color: "bg-rose-400" },
          { time: "4:30 PM", event: "Ceremony Begins", color: "bg-violet-400" },
          { time: "6:00 PM", event: "Cocktail Hour", color: "bg-blue-400" },
          { time: "7:30 PM", event: "Reception Dinner", color: "bg-emerald-400" },
          { time: "9:00 PM", event: "First Dance", color: "bg-amber-400" },
        ].map((item, i) => (
          <div key={item.time} className="flex items-center gap-3 py-2">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              {i < 4 && <div className="w-0.5 h-6 bg-gray-200" />}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.event}</span>
              <span className="text-[11px] text-gray-400 font-mono">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    ),
    tasks: (
      <div className="space-y-2">
        {[
          { task: "Book photographer", done: true, priority: "High" },
          { task: "Finalize guest list", done: true, priority: "Medium" },
          { task: "Order wedding cake", done: false, priority: "High" },
          { task: "Send invitations", done: false, priority: "Medium" },
          { task: "Plan rehearsal dinner", done: false, priority: "Low" },
        ].map((item) => (
          <div key={item.task} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/60">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.done ? "bg-emerald-400 border-emerald-400" : "border-gray-300"}`}>
              {item.done && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm flex-1 ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.task}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              item.priority === "High" ? "bg-rose-50 text-rose-500" : item.priority === "Medium" ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400"
            }`}>{item.priority}</span>
          </div>
        ))}
      </div>
    ),
    budget: (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Budget Overview</span>
          <span className="text-xs text-emerald-500 font-medium">68% used</span>
        </div>
        {[
          { category: "Venue", budget: "$12,000", spent: "$10,500", percent: 87, color: "from-rose-400 to-pink-500" },
          { category: "Catering", budget: "$8,000", spent: "$5,200", percent: 65, color: "from-violet-400 to-purple-500" },
          { category: "Photography", budget: "$4,000", spent: "$2,800", percent: 70, color: "from-blue-400 to-indigo-500" },
          { category: "Flowers", budget: "$3,000", spent: "$1,200", percent: 40, color: "from-emerald-400 to-green-500" },
        ].map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{item.category}</span>
              <span className="text-gray-400">{item.spent} / {item.budget}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
    vendors: (
      <div className="space-y-2">
        {[
          { name: "Bella Photography", service: "Photographer", rating: 4.9, color: "from-rose-400 to-pink-500" },
          { name: "Garden Blooms", service: "Florist", rating: 4.8, color: "from-emerald-400 to-green-500" },
          { name: "Sweet Layers", service: "Cake Designer", rating: 5.0, color: "from-amber-400 to-orange-500" },
        ].map((vendor) => (
          <div key={vendor.name} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/60 border border-white/80">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vendor.color} flex items-center justify-center text-white text-xs font-bold`}>
              {vendor.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
              <p className="text-[11px] text-gray-400">{vendor.service}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-600">{vendor.rating}</span>
            </div>
          </div>
        ))}
      </div>
    ),
    invoices: (
      <div className="space-y-2">
        {[
          { id: "INV-001", client: "Sarah & James", amount: "$2,400", status: "Paid", statusColor: "bg-emerald-50 text-emerald-600" },
          { id: "INV-002", client: "Emma & Liam", amount: "$1,800", status: "Pending", statusColor: "bg-amber-50 text-amber-600" },
          { id: "QUO-001", client: "Olivia & Noah", amount: "$3,200", status: "Draft", statusColor: "bg-gray-50 text-gray-500" },
        ].map((inv) => (
          <div key={inv.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/60 border border-white/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{inv.id}</p>
                <p className="text-[11px] text-gray-400">{inv.client}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{inv.amount}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${inv.statusColor}`}>{inv.status}</span>
            </div>
          </div>
        ))}
      </div>
    ),
    guests: (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Total", value: "142", color: "text-gray-800" },
            { label: "Attending", value: "98", color: "text-emerald-500" },
            { label: "Pending", value: "44", color: "text-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-2 rounded-lg bg-white/60">
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
        {["Mr. & Mrs. Johnson — 2 guests", "Dr. Williams — +1 pending", "The Martinez Family — 4 guests"].map((guest, i) => (
          <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/60">
            <div className={`w-2 h-2 rounded-full ${["bg-emerald-400", "bg-amber-400", "bg-blue-400"][i]}`} />
            <span className="text-xs text-gray-600">{guest}</span>
          </div>
        ))}
      </div>
    ),
    seating: (
      <div className="space-y-3">
        <div className="relative bg-white/40 rounded-xl p-4 border border-white/80">
          <div className="grid grid-cols-4 gap-3 place-items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-[9px] text-gray-400">T{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] text-gray-400">8 tables · 96 guests</span>
          </div>
        </div>
      </div>
    ),
    meals: (
      <div className="space-y-2">
        {[
          { course: "Appetizer", item: "Truffle Bruschetta", count: 120, color: "from-orange-400 to-red-500" },
          { course: "Main", item: "Herb-Crusted Salmon", count: 85, color: "from-emerald-400 to-green-500" },
          { course: "Dessert", item: "Vanilla Crème Brûlée", count: 142, color: "from-amber-400 to-orange-500" },
        ].map((meal) => (
          <div key={meal.course} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/60 border border-white/80">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meal.color} flex items-center justify-center`}>
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{meal.item}</p>
              <p className="text-[11px] text-gray-400">{meal.course} · {meal.count} servings</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-violet-50/60">
          <Sparkles className="h-3 w-3 text-violet-500" />
          <span className="text-[11px] text-violet-600 font-medium">AI-recommended based on guest preferences</span>
        </div>
      </div>
    ),
    design: (
      <div className="space-y-3">
        <div className="flex gap-2">
          {["#D4487D", "#8B5CF6", "#F59E0B", "#10B981", "#3B82F6"].map((color) => (
            <div key={color} className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Rustic Garden", "Modern Minimal", "Bohemian Chic", "Classic Elegance"].map((style, i) => (
            <div key={style} className="py-2 px-3 rounded-lg bg-white/60 border border-white/80 text-center">
              <p className="text-xs font-medium text-gray-700">{style}</p>
              <p className="text-[10px] text-gray-400">{85 - i * 10}% match</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-violet-50/60">
          <Sparkles className="h-3 w-3 text-violet-500" />
          <span className="text-[11px] text-violet-600 font-medium">AI-curated for your wedding theme</span>
        </div>
      </div>
    ),
    contracts: (
      <div className="space-y-2">
        {[
          { title: "Service Agreement", status: "Signed", statusColor: "bg-emerald-50 text-emerald-600", progress: 100 },
          { title: "Venue Contract", status: "Pending", statusColor: "bg-amber-50 text-amber-600", progress: 60 },
          { title: "Photography Deal", status: "Draft", statusColor: "bg-gray-50 text-gray-500", progress: 20 },
        ].map((contract) => (
          <div key={contract.title} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/60 border border-white/80">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <FileSignature className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{contract.title}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-1.5 rounded-full" style={{ width: `${contract.progress}%` }} />
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${contract.statusColor}`}>{contract.status}</span>
          </div>
        ))}
      </div>
    ),
    documents: (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: "Total", value: "24", icon: "📄" },
            { label: "Signed", value: "18", icon: "✅" },
            { label: "Pending", value: "6", icon: "⏳" },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-2 rounded-lg bg-white/60 border border-white/80">
              <span className="text-sm">{stat.icon}</span>
              <p className="text-sm font-bold text-gray-800">{stat.value}</p>
              <p className="text-[10px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
        {["Budget_Overview.pdf", "Floor_Plan_v2.pdf", "Vendor_Contract.pdf"].map((doc, i) => (
          <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/60">
            <FolderOpen className="h-4 w-4 text-sky-500" />
            <span className="text-xs text-gray-600 flex-1">{doc}</span>
            <span className="text-[10px] text-gray-400">{["2.4 MB", "1.1 MB", "856 KB"][i]}</span>
          </div>
        ))}
      </div>
    ),
    resources: (
      <div className="space-y-2">
        {[
          { category: "Staff", items: 12, available: 8, icon: "👥", color: "from-lime-400 to-emerald-500" },
          { category: "Equipment", items: 24, available: 18, icon: "🎬", color: "from-emerald-400 to-green-500" },
          { category: "Vehicles", items: 6, available: 4, icon: "🚗", color: "from-teal-400 to-cyan-500" },
          { category: "Inventory", items: 45, available: 32, icon: "📦", color: "from-cyan-400 to-blue-500" },
        ].map((res) => (
          <div key={res.category} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/60">
            <span className="text-lg">{res.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-700">{res.category}</span>
                <span className="text-[10px] text-gray-400">{res.available}/{res.items} available</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div className={`bg-gradient-to-r ${res.color} h-1.5 rounded-full`} style={{ width: `${(res.available / res.items) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    analytics: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Revenue", value: "$48.2K", change: "+23%", positive: true },
            { label: "Clients", value: "24", change: "+12%", positive: true },
            { label: "Conversion", value: "68%", change: "+5%", positive: true },
            { label: "Avg. Budget", value: "$8.4K", change: "-2%", positive: false },
          ].map((stat) => (
            <div key={stat.label} className="py-2 px-3 rounded-lg bg-white/60 border border-white/80">
              <p className="text-[10px] text-gray-400">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-sm font-bold text-gray-800">{stat.value}</p>
                <span className={`text-[10px] font-medium ${stat.positive ? "text-emerald-500" : "text-red-400"}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1.5 h-16 px-2">
          {[35, 50, 40, 65, 55, 80, 70, 90, 60, 85, 75, 95].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-purple-400 to-indigo-300 opacity-80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
    calendar: (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">May 2024</span>
          <div className="flex gap-1">
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px]">◀</div>
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px]">▶</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d} className="text-[9px] text-gray-400 font-medium">{d}</span>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2;
            const isToday = day === 15;
            const hasEvent = [5, 12, 15, 22, 28].includes(day);
            return (
              <div key={i} className={`w-5 h-5 rounded text-[9px] flex items-center justify-center ${
                day < 1 || day > 31 ? "text-gray-200" :
                isToday ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold rounded-full" :
                hasEvent ? "text-gray-700 font-medium" : "text-gray-500"
              }`}>
                {day >= 1 && day <= 31 ? day : ""}
                {hasEvent && !isToday && <div className="absolute -mt-3 w-1 h-1 rounded-full bg-teal-400" />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-teal-50/60">
          <Calendar className="h-3 w-3 text-teal-500" />
          <span className="text-[10px] text-teal-600 font-medium">3 events this week · Google Calendar synced</span>
        </div>
      </div>
    ),
  };

  return <>{mockups[type] || null}</>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FeaturesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["marketing"]);

  return (
    <div className="features-page">
      {/* ═══ HERO ═══ */}
      <FeaturesHero navigate={navigate} t={t} />

      {/* ═══ FEATURE DETAIL SECTIONS ═══ */}
      <FeatureSections t={t} />

      {/* ═══ FINAL CTA ═══ */}
      <FeaturesCTA navigate={navigate} t={t} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const FeaturesHero = ({ navigate, t }: { navigate: any; t: any }) => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f8] via-[#faf5ff] to-[#f0f9ff]" />

      {/* Decorative blobs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 animate-blob"
        style={{
          background: "radial-gradient(circle, rgba(212,131,159,0.3) 0%, transparent 70%)",
          top: "5%",
          right: "10%",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 animate-blob delay-300"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
          bottom: "10%",
          left: "5%",
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
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-gray-700">
            {t("marketing:featuresBadge", "Powerful Features")}
          </span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] tracking-tight mb-6">
          <span className="block text-gray-900">
            {t("marketing:featuresPage.heroTitle", "Everything you need")}
          </span>
          <span className="block text-gradient">
            {t("marketing:featuresPage.heroTitleHighlight", "to plan the perfect wedding")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          {t(
            "marketing:featuresPageDescription",
            "Discover all the powerful tools and features that Knot To It offers to help you manage your wedding planning business."
          )}
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/signup")}
            className="group relative px-8 py-4 bg-gradient-to-r from-rose-400 to-violet-500 text-white rounded-2xl font-medium text-base shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t("marketing:startFreeTrial", "Start Free Trial")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <Link
            to="/pricing"
            className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-medium text-base border border-gray-200 hover:border-rose-200 hover:bg-white hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            {t("marketing:viewPricing", "View Pricing")}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE DETAIL SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const FeatureSections = ({ t }: { t: any }) => {
  return (
    <section className="relative">
      {featureDetails.map((feature, index) => (
        <FeatureDetailCard
          key={feature.key}
          feature={feature}
          index={index}
          t={t}
        />
      ))}
    </section>
  );
};

const FeatureDetailCard = ({
  feature,
  index,
  t,
}: {
  feature: (typeof featureDetails)[number];
  index: number;
  t: any;
}) => {
  const { ref, isVisible } = useScrollReveal();
  const isEven = index % 2 === 0;

  return (
    <section
      id={feature.key}
      ref={ref}
      className={`relative py-20 md:py-28 overflow-hidden ${
        index % 2 === 0 ? "bg-white" : "bg-gradient-to-b from-gray-50/80 to-white"
      }`}
    >
      {/* Background decoration */}
      {isEven && (
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-50/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      )}
      {!isEven && (
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-50/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
      )}

      <div className="relative max-w-7xl mx-auto px-6">
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          } ${isEven ? "" : "direction-rtl"}`}
        >
          {/* Text side */}
          <div className={isEven ? "lg:order-1" : "lg:order-2"}>
            {/* Icon + Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-sm`}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              {feature.badge && (
                <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
                  {feature.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 leading-tight">
              {t(`marketing:features.${feature.key}.title`)}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-500 leading-relaxed mb-6">
              {t(`marketing:features.${feature.key}.description`)}
            </p>

            {/* Full description as bullet points */}
            <div className="space-y-3 mb-8">
              {t(`marketing:features.${feature.key}.fullDescription`)
                .split(". ")
                .filter((s: string) => s.trim().length > 0)
                .map((sentence: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-600 text-sm leading-relaxed">
                      {sentence.endsWith(".") ? sentence : sentence + "."}
                    </span>
                  </div>
                ))}
            </div>

            {/* CTA */}
            <Link
              to="/pricing"
              className="group inline-flex items-center gap-2 text-sm font-medium text-violet-500 hover:text-violet-600 transition-colors"
            >
              {t("marketing:viewPricingPlans", "View Pricing Plans")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mockup side */}
          <div className={isEven ? "lg:order-2" : "lg:order-1"}>
            <div className="relative">
              {/* Glow */}
              <div className={`absolute -inset-6 bg-gradient-to-r from-rose-100/60 via-violet-100/60 to-blue-100/60 rounded-3xl blur-2xl opacity-40`} />

              {/* Card */}
              <div className="relative glass rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white/60">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-gray-50 rounded-lg text-xs text-gray-400 font-mono">
                      app.knottoit.com/{feature.key.toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* Mockup content */}
                <div className="p-6 bg-gradient-to-br from-white to-gray-50/30">
                  <FeatureMockup type={feature.mockupType} gradient={feature.gradient} />
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
// FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

const FeaturesCTA = ({ navigate, t }: { navigate: any; t: any }) => {
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
          {t("marketing:readyToStart", "Ready to plan your dream wedding?")}
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t(
            "marketing:choosePlan",
            "Choose a plan that works for you and get started today."
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
            to="/pricing"
            className="px-8 py-4 text-white/80 hover:text-white rounded-2xl font-medium text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300"
          >
            {t("marketing:viewPricing", "View Pricing")}
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

export default FeaturesPage;
