
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, CheckCircle2, Clock, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UpcomingWeddings from "@/components/dashboard/UpcomingWeddings";
import TaskSummary from "@/components/dashboard/TaskSummary";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import RecentClients from "@/components/dashboard/RecentClients";

const Dashboard = () => {
  const { clients, tasks, isLoading } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  // Count stats - memoize these calculations
  const stats = useMemo(() => {
    const activeWeddings = clients.filter(client => client.status === 'active').length;
    const overdueTasksCount = tasks.filter(task =>
      task.status !== 'completed' && new Date(task.dueDate) < new Date()
    ).length;
    const completedTasksCount = tasks.filter(task => task.status === 'completed').length;

    return { activeWeddings, overdueTasksCount, completedTasksCount };
  }, [clients, tasks]);

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium text-muted-foreground">{t('common.loading')}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t('dashboard.loadingMessage')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-serif font-bold mb-6">{t('nav.dashboard')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-wedding-blush bg-opacity-20 flex items-center justify-center mr-4">
              <Users className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('dashboard.activeWeddings')}</p>
              <h2 className="text-2xl font-bold">{stats.activeWeddings}</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <Clock className="text-red-600 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('dashboard.tasksOverdue')}</p>
              <h2 className="text-2xl font-bold">{stats.overdueTasksCount}</h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <CheckCircle2 className="text-green-600 h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('tasks.completed')}</p>
              <h2 className="text-2xl font-bold">{stats.completedTasksCount}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="weddings">{t('dashboard.weddings')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('dashboard.tasks')}</TabsTrigger>
          <TabsTrigger value="budgets">{t('dashboard.budgets')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UpcomingWeddings limit={3} />
            <TaskSummary limit={5} />
          </div>
          <RecentClients limit={5} />
        </TabsContent>

        <TabsContent value="weddings" className="mt-6">
          <UpcomingWeddings />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskSummary />
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <BudgetOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
