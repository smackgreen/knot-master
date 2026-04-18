import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, formatVendorCategory } from "@/utils/formatters";
import { useTranslation } from "react-i18next";
import { VendorCategory } from "@/types";

// Define colors for different categories
const CATEGORY_COLORS = {
  venue: '#FFD700',      // Yellow
  catering: '#FF6B6B',   // Red
  photography: '#4BC0C0', // Teal
  florist: '#9966FF',    // Purple
  cake: '#FF9F40',       // Orange
  hair_makeup: '#36A2EB', // Blue
  music: '#FF6384',      // Pink
  attire: '#4CAF50',     // Green
  videography: '#9C27B0', // Deep Purple
  transportation: '#607D8B', // Blue Grey
  rentals: '#795548',    // Brown
  stationery: '#00BCD4', // Cyan
  gifts: '#FFEB3B',      // Yellow
  other: '#673AB7'       // Deep Purple
};

const BudgetOverview = () => {
  const { t } = useTranslation();
  const { clients, budgets, vendors } = useApp();
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  // Get all active clients with budgets
  const clientsWithBudgets = useMemo(() => {
    return clients.filter(client => client.budget && client.status === 'active');
  }, [clients]);

  // If no budget is selected, select the first one
  useMemo(() => {
    if (clientsWithBudgets.length > 0 && !selectedBudget) {
      setSelectedBudget(clientsWithBudgets[0].id);
    }
  }, [clientsWithBudgets, selectedBudget]);

  // Get the selected client
  const selectedClient = useMemo(() => {
    return clients.find(client => client.id === selectedBudget);
  }, [clients, selectedBudget]);

  // Get all vendors for the selected client
  const clientVendors = useMemo(() => {
    if (!selectedClient) return [];
    return vendors.filter(vendor => vendor.clientId === selectedClient.id);
  }, [vendors, selectedClient]);

  // Calculate budget data for the selected client
  const budgetData = useMemo(() => {

    if (!selectedClient || !selectedClient.budget) return null;

    const budget = selectedClient.budget;
    const categories = budget.categories.map(category => {
      // Find vendors in this category
      const categoryVendors = clientVendors.filter(vendor => vendor.category === category.category);

      // Calculate actual spent (from vendors)
      const actual = categoryVendors.reduce((sum, vendor) => sum + (vendor.cost || 0), 0);

      // Calculate amount paid
      const amountPaid = categoryVendors
        .filter(vendor => vendor.isPaid)
        .reduce((sum, vendor) => sum + (vendor.cost || 0), 0);

      // Calculate remainder to pay
      const remainderToPay = actual - amountPaid;

      // Calculate difference between estimated and actual
      const difference = category.allocated - actual;

      // Calculate percentage of budget used
      const percentUsed = category.allocated > 0
        ? Math.min(100, Math.round((actual / category.allocated) * 100))
        : 0;

      return {
        category: category.category,
        estimated: category.allocated,
        actual,
        difference,
        amountPaid,
        remainderToPay,
        percentUsed
      };
    });

    // Calculate totals
    const totalEstimated = categories.reduce((sum, cat) => sum + cat.estimated, 0);
    const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
    const totalDifference = totalEstimated - totalActual;
    const totalAmountPaid = categories.reduce((sum, cat) => sum + cat.amountPaid, 0);
    const totalRemainderToPay = categories.reduce((sum, cat) => sum + cat.remainderToPay, 0);
    const totalPercentUsed = totalEstimated > 0
      ? Math.min(100, Math.round((totalActual / totalEstimated) * 100))
      : 0;

    return {
      totalBudget: budget.totalBudget,
      categories,
      totalEstimated,
      totalActual,
      totalDifference,
      totalAmountPaid,
      totalRemainderToPay,
      totalPercentUsed
    };
  }, [selectedClient, clientVendors]);

  // Get color for progress bar based on percentage
  const getProgressColor = (percent: number, isOverBudget: boolean = false) => {
    if (isOverBudget || percent > 90) return "bg-red-500";
    if (percent > 75) return "bg-orange-500";
    return "bg-green-500";
  };

  // Get color for category
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#CCCCCC';
  };

  if (!budgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.budgetOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('dashboard.noBudgetsFound')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold">
            {t('dashboard.budget')}: {formatCurrency(budgetData.totalBudget)} €
          </h2>
          <span className="text-muted-foreground text-sm">{formatCurrency(budgetData.totalEstimated)} €</span>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {selectedClient?.name || "Budget"}
        </Badge>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t('clients.totalBudget')}</span>
              <span className="text-2xl font-bold mt-1">€ {formatCurrency(budgetData.totalBudget)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t('clients.spentSoFar')}</span>
              <span className="text-2xl font-bold mt-1">€ {formatCurrency(budgetData.totalActual)}</span>
              <span className="text-xs text-muted-foreground">
                {Math.round((budgetData.totalActual / budgetData.totalBudget) * 100)}% {t('clients.ofBudget')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-amber-500 h-2"
          style={{
            width: `${Math.min(100, Math.round((budgetData.totalActual / budgetData.totalBudget) * 100))}%`
          }}
        ></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Budget Table */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('clients.budgetBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium">{t('clients.category')}</TableHead>
                      <TableHead className="text-right font-medium">{t('clients.estimated')}</TableHead>
                      <TableHead className="text-right font-medium">{t('clients.actual')}</TableHead>
                      <TableHead className="text-right font-medium">{t('clients.difference')}</TableHead>
                      <TableHead className="text-right font-medium">{t('clients.amountPaid')}</TableHead>
                      <TableHead className="text-right font-medium">{t('clients.remainderToPay')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetData.categories.map((cat, index) => (
                      <TableRow key={index} className="border-b">
                        <TableCell className="font-medium">
                          {formatVendorCategory(cat.category as VendorCategory)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.estimated)} €</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.actual)} €</TableCell>
                        <TableCell className="text-right">
                          <span className={cat.difference >= 0 ? "text-green-600" : "text-red-600"}>
                            {cat.difference >= 0 ? "+" : ""}{formatCurrency(cat.difference)} €
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.amountPaid)} €</TableCell>
                        <TableCell className="text-right">
                          <span className={cat.remainderToPay > 0 ? "text-red-600 font-medium" : ""}>
                            {formatCurrency(cat.remainderToPay)} €
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/20 font-bold">
                      <TableCell>{t('common.total')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(budgetData.totalEstimated)} €</TableCell>
                      <TableCell className="text-right">{formatCurrency(budgetData.totalActual)} €</TableCell>
                      <TableCell className="text-right">
                        <span className={budgetData.totalDifference >= 0 ? "text-green-600" : "text-red-600"}>
                          {budgetData.totalDifference >= 0 ? "+" : ""}{formatCurrency(budgetData.totalDifference)} €
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(budgetData.totalAmountPaid)} €</TableCell>
                      <TableCell className="text-right">
                        <span className={budgetData.totalRemainderToPay > 0 ? "text-red-600 font-medium" : ""}>
                          {formatCurrency(budgetData.totalRemainderToPay)} €
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Budget Chart */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.estimation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData.categories.map(cat => ({
                        name: formatVendorCategory(cat.category as VendorCategory),
                        value: cat.estimated,
                        category: cat.category
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {budgetData.categories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.category)}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clients.budgetStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetData.categories.map((cat, index) => {
                  // Determine if over budget
                  const isOverBudget = cat.actual > cat.estimated;
                  // Calculate percentage for progress bar
                  const percentUsed = cat.estimated > 0
                    ? Math.min(100, Math.round((cat.actual / cat.estimated) * 100))
                    : 0;
                  // Get appropriate color
                  const barColor = getProgressColor(percentUsed, isOverBudget);

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{formatVendorCategory(cat.category as VendorCategory)}</span>
                        <span>{formatCurrency(cat.actual)} € / {formatCurrency(cat.estimated)} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${barColor} h-2.5 rounded-full`}
                          style={{
                            width: `${Math.min(100, percentUsed)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
