
import React from "react";
import { Fragment } from "@/components/ui/fragment";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatVendorCategory, getPriorityBadge, getTaskStatusInfo, calculateDueAmount } from "@/utils/formatters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, ChevronLeft, Contact, CreditCard, Edit, FileText, Trash2, Users, DollarSign, UserPlus, LayoutGrid, Palette, Utensils, FileSignature, Plus, ChevronDown, Loader2, Clock, Sparkles } from "lucide-react";
import GuestList from "@/components/guests/GuestList";
import SeatingChartManager from "@/components/seating/SeatingChartManager";
import MealPlanningTool from "@/components/meal-planning/MealPlanningTool";
import WeddingDayTimeline from "@/components/timeline/WeddingDayTimeline";
import WeddingBudgetManager from "@/components/budget/WeddingBudgetManager";
import ContractCard from "@/components/contracts/ContractCard";
import AddContractDialog from "@/components/contracts/AddContractDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BudgetCategory, VendorCategory } from "@/types/index";

// Define VendorCategory values for use in the component
const vendorCategories: VendorCategory[] = [
  'venue',
  'catering',
  'photography',
  'videography',
  'florist',
  'music',
  'cake',
  'attire',
  'hair_makeup',
  'transportation',
  'rentals',
  'stationery',
  'gifts',
  'other'
];
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clients, deleteClient, createBudget, updateBudget, updateClient, addVendor, addTask } = useApp();
  const [isUpdateBudgetOpen, setIsUpdateBudgetOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  const [updatedBudget, setUpdatedBudget] = useState<{
    totalBudget: number;
    categories: BudgetCategory[];
  } | null>(null);
  const [editedClient, setEditedClient] = useState<{
    name: string;
    partnerName: string;
    email: string;
    phone: string;
    venue: string;
    notes: string;
  } | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "venue" as VendorCategory,
    contactName: "",
    email: "",
    phone: "",
    cost: 0,
    isPaid: false,
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "not_started" as "not_started" | "in_progress" | "completed" | "overdue",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: new Date().toISOString().split('T')[0],
  });

  const client = clients.find(c => c.id === id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h1 className="text-2xl font-bold mb-4">{t('clients.clientNotFound')}</h1>
        <Button onClick={() => navigate('/app/clients')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('common.backToClients')}
        </Button>
      </div>
    );
  }

  const handleDeleteClient = () => {
    deleteClient(client.id);
    navigate('/app/clients');
  };

  const handleEditClient = () => {
    setEditedClient({
      name: client.name,
      partnerName: client.partnerName,
      email: client.email,
      phone: client.phone,
      venue: client.venue,
      notes: client.notes || "",
    });
    setIsEditClientOpen(true);
  };

  const handleSaveClientChanges = () => {
    if (!editedClient) return;

    updateClient(client.id, editedClient);
    setIsEditClientOpen(false);
  };

  const handleOpenUpdateBudget = () => {
    if (client.budget) {
      // Create a copy of budget categories with updated spent values from vendors
      const updatedCategories = client.budget.categories.map(cat => {
        // Find vendors in this category
        const categoryVendors = client.vendors?.filter(v => v.category === cat.category) || [];
        // Calculate actual spent from vendors
        const actualSpent = categoryVendors.reduce((sum, vendor) => sum + (vendor.cost || 0), 0);

        // Return updated category with spent value from vendors
        return {
          ...cat,
          spent: actualSpent
        };
      });

      setUpdatedBudget({
        totalBudget: client.budget.totalBudget,
        categories: updatedCategories
      });
    } else {
      setUpdatedBudget({
        totalBudget: 0,
        categories: []
      });
    }
    setIsUpdateBudgetOpen(true);
  };

  const handleUpdateBudget = () => {
    if (!updatedBudget) return;

    // Make sure spent values are synced with vendor costs before saving
    const finalBudget = {
      ...updatedBudget,
      categories: updatedBudget.categories.map(cat => {
        // Find vendors in this category
        const categoryVendors = client.vendors?.filter(v => v.category === cat.category) || [];
        // Calculate actual spent from vendors
        const actualSpent = categoryVendors.reduce((sum, vendor) => sum + (vendor.cost || 0), 0);

        // Only update if the user hasn't manually changed the spent value
        // This allows users to override the calculated value if needed
        if (cat.spent === 0 || Math.abs(cat.spent - actualSpent) < 0.01) {
          return {
            ...cat,
            spent: actualSpent
          };
        }
        return cat;
      })
    };

    if (client.budget) {
      // Update existing budget
      updateBudget(client.budget.id, finalBudget);
    } else {
      // Create new budget
      createBudget(client.id, finalBudget);
    }

    setIsUpdateBudgetOpen(false);
  };

  const handleTotalBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!updatedBudget) return;

    const value = parseFloat(e.target.value) || 0;
    setUpdatedBudget({
      ...updatedBudget,
      totalBudget: value
    });
  };

  const handleCategoryChange = (index: number, field: keyof BudgetCategory, value: any) => {
    if (!updatedBudget) return;

    const updatedCategories = [...updatedBudget.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    };

    setUpdatedBudget({
      ...updatedBudget,
      categories: updatedCategories
    });
  };

  const handleOpenAddVendor = () => {
    setNewVendor({
      name: "",
      category: "venue" as VendorCategory,
      contactName: "",
      email: "",
      phone: "",
      cost: 0,
      isPaid: false,
    });
    setIsAddVendorOpen(true);
  };

  const handleAddVendor = () => {
    addVendor({
      ...newVendor,
      clientId: client.id,
    });
    setIsAddVendorOpen(false);
  };

  const handleOpenAddTask = () => {
    setNewTask({
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      dueDate: new Date().toISOString().split('T')[0],
    });
    setIsAddTaskOpen(true);
  };

  const handleAddTask = () => {
    addTask({
      ...newTask,
      clientId: client.id,
    });
    setIsAddTaskOpen(false);
  };



  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              onClick={() => navigate('/app/clients')}
              className="self-start -ml-4 mb-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('common.backToClients')}
            </Button>
            <h1 className="text-3xl font-serif font-bold">
              {client.name} & {client.partnerName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {formatDate(client.weddingDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/app/clients/${client.id}/design-suggestions`)}>
              <Palette className="mr-2 h-4 w-4" />
              {t('clients.designSuggestions')}
            </Button>
            <Button variant="outline" onClick={handleEditClient}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('clients.deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground">
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <FileText className="mr-2 h-4 w-4" />
            {t('clients.overview')}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Contact className="mr-2 h-4 w-4" />
            {t('vendors.title')}
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSign className="mr-2 h-4 w-4" />
            {t('clients.budget')}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Calendar className="mr-2 h-4 w-4" />
            {t('tasks.title')}
          </TabsTrigger>
          <TabsTrigger value="guests">
            <UserPlus className="mr-2 h-4 w-4" />
            {t('guests.title')}
          </TabsTrigger>
          <TabsTrigger value="seating">
            <LayoutGrid className="mr-2 h-4 w-4" />
            {t('clients.seatingChart')}
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="mr-2 h-4 w-4" />
            {t('timeline.title')}
          </TabsTrigger>
          <TabsTrigger value="meal-planning">
            <Utensils className="mr-2 h-4 w-4" />
            {t('clients.mealPlanning')}
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileSignature className="mr-2 h-4 w-4" />
            {t('contracts.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('clients.clientDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.clientName')}</dt>
                    <dd>{client.name}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.partnerName')}</dt>
                    <dd>{client.partnerName}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.email')}</dt>
                    <dd>{client.email}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.phone')}</dt>
                    <dd>{client.phone}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.clientSince')}</dt>
                    <dd>{formatDate(client.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('clients.weddingDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.weddingDate')}</dt>
                    <dd>{formatDate(client.weddingDate, 'EEEE, MMMM d, yyyy')}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.venue')}</dt>
                    <dd>{client.venue}</dd>
                  </div>
                  {client.budget && (
                    <div className="flex flex-col">
                      <dt className="text-muted-foreground mb-1">{t('clients.budget')}</dt>
                      <dd>{formatCurrency(client.budget.totalBudget)}</dd>
                    </div>
                  )}
                  {client.vendors && (
                    <div className="flex flex-col">
                      <dt className="text-muted-foreground mb-1">{t('clients.numberOfVendors')}</dt>
                      <dd>{client.vendors.length}</dd>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground mb-1">{t('clients.notes')}</dt>
                    <dd className="whitespace-pre-line">{client.notes || t('clients.noNotes')}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('clients.planningProgress')}</CardTitle>
                <CardDescription>{t('clients.planningProgressDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">{t('clients.totalBudget')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {client.budget ? formatCurrency(client.budget.totalBudget) : t('clients.notSet')}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">{t('clients.spentSoFar')}</p>
                    {client.budget ? (
                      (() => {
                        const totalSpent = client.vendors?.reduce((sum, vendor) => sum + (vendor.cost || 0), 0) || 0;
                        const percentOfBudget = Math.round((totalSpent / client.budget.totalBudget) * 100);
                        return (
                          <>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
                            <p className="text-xs text-muted-foreground">
                              {percentOfBudget}% {t('clients.ofBudget')}
                            </p>
                          </>
                        );
                      })()
                    ) : (
                      <p className="text-2xl font-bold mt-1">{t('common.notApplicable')}</p>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">{t('clients.pendingTasks')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {client.tasks ? client.tasks.filter(task => task.status !== 'completed').length : 0}
                    </p>
                    {client.tasks && client.tasks.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {Math.round((client.tasks.filter(t => t.status === 'completed').length / client.tasks.length) * 100)}% {t('clients.completed')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('vendors.title')}</CardTitle>
                <CardDescription>{t('vendors.manageVendors')}</CardDescription>
              </div>
              <Button onClick={handleOpenAddVendor}>
                <Contact className="mr-2 h-4 w-4" />
                {t('vendors.addVendor')}
              </Button>
            </CardHeader>
            <CardContent>
              {client.vendors && client.vendors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {client.vendors.map(vendor => (
                    <div key={vendor.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{vendor.name}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {formatVendorCategory(vendor.category)}
                        </span>
                      </div>
                      {vendor.contactName && (
                        <p className="text-sm">{vendor.contactName}</p>
                      )}
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        {vendor.email && <p>{vendor.email}</p>}
                        {vendor.phone && <p>{vendor.phone}</p>}
                      </div>
                      {vendor.cost && (
                        <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                          <span>{t('vendors.cost')}</span>
                          <span className="font-medium">
                            {formatCurrency(vendor.cost)}
                            {vendor.isPaid && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                {t('vendors.paid')}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('vendors.noVendorsYet')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <WeddingBudgetManager
            client={client}
            onUpdateBudget={(budgetData) => {
              if (client.budget) {
                updateBudget(client.budget.id, budgetData);
              }
            }}
            onCreateBudget={(budgetData) => {
              createBudget(client.id, budgetData);
            }}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('tasks.title')}</CardTitle>
                <CardDescription>{t('tasks.manageTasks')}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/app/tasks/wedding/${client.id}`)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('tasks.weddingPlanner', 'Wedding Planner')}
                </Button>
                <Button onClick={handleOpenAddTask}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('tasks.addTask')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.tasks && client.tasks.length > 0 ? (
                <div className="space-y-4">
                  {client.tasks.map(task => {
                    const statusInfo = getTaskStatusInfo(task.status, task.dueDate);
                    const priorityInfo = getPriorityBadge(task.priority);

                    return (
                      <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{t('tasks.due')}: {formatDate(task.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t('tasks.noTasksCreated')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests">
          <GuestList clientId={client.id} />
        </TabsContent>

        <TabsContent value="seating">
          <SeatingChartManager clientId={client.id} />
        </TabsContent>

        <TabsContent value="meal-planning">
          <MealPlanningTool clientId={client.id} />
        </TabsContent>

        <TabsContent value="timeline">
          <WeddingDayTimeline clientId={client.id} weddingDate={client.weddingDate} />
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('contracts.title')}</CardTitle>
                <CardDescription>{t('contracts.manageContracts')}</CardDescription>
              </div>
              <Button onClick={() => setIsAddContractOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('contracts.addContract')}
              </Button>
            </CardHeader>
            <CardContent>
              {client.contracts && client.contracts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {client.contracts.map(contract => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      client={client}
                      vendor={client.vendors?.find(v => v.id === contract.vendorId)}
                      onView={(id) => navigate(`/app/contracts/${id}`)}
                      onSign={(id) => navigate(`/app/contracts/${id}`)}
                      onSend={(id) => navigate(`/app/contracts/${id}`)}
                      onDelete={(id) => navigate(`/app/contracts/${id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('contracts.noContracts')}</h3>
                  <p className="text-muted-foreground mb-4">{t('contracts.noContractsDescription')}</p>
                  <Button onClick={() => setIsAddContractOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('contracts.createFirstContract')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('clients.editClient')}</DialogTitle>
            <DialogDescription>
              {t('clients.updateClientInfo')}
            </DialogDescription>
          </DialogHeader>

          {editedClient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('clients.clientName')}</Label>
                  <Input
                    id="name"
                    value={editedClient.name}
                    onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="partnerName">{t('clients.partnerName')}</Label>
                  <Input
                    id="partnerName"
                    value={editedClient.partnerName}
                    onChange={(e) => setEditedClient({...editedClient, partnerName: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">{t('clients.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedClient.email}
                    onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('clients.phone')}</Label>
                  <Input
                    id="phone"
                    value={editedClient.phone}
                    onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="venue">{t('clients.venue')}</Label>
                <Input
                  id="venue"
                  value={editedClient.venue}
                  onChange={(e) => setEditedClient({...editedClient, venue: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">{t('clients.notes')}</Label>
                <Input
                  id="notes"
                  value={editedClient.notes}
                  onChange={(e) => setEditedClient({...editedClient, notes: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveClientChanges}>{t('common.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateBudgetOpen} onOpenChange={setIsUpdateBudgetOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('clients.budget')}: {updatedBudget ? formatCurrency(updatedBudget.totalBudget) : '0'} €</DialogTitle>
            <DialogDescription>
              {t('clients.budgetDescription')}
            </DialogDescription>
          </DialogHeader>

          {updatedBudget && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="totalBudget">{t('clients.totalBudget')}</Label>
                  <div className="relative mt-1">
                    <Input
                      id="totalBudget"
                      value={updatedBudget.totalBudget}
                      onChange={handleTotalBudgetChange}
                      type="number"
                      min="0"
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>

                <div className="flex-1">
                  <Label>{t('clients.spentSoFar')}</Label>
                  <div className="relative mt-1">
                    <Input
                      value={updatedBudget.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0)}
                      readOnly
                      className="pl-8 bg-muted"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">{t('clients.budgetBreakdown')}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Find a category that doesn't exist yet
                      const existingCategories = updatedBudget.categories.map(c => c.category);
                      const availableCategories = vendorCategories.filter(c => !existingCategories.includes(c));

                      if (availableCategories.length > 0) {
                        const newCategory = {
                          category: availableCategories[0],
                          allocated: 0,
                          spent: 0
                        };

                        setUpdatedBudget({
                          ...updatedBudget,
                          categories: [...updatedBudget.categories, newCategory]
                        });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('common.add')} {t('clients.category')}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">{t('clients.category')}</TableHead>
                        <TableHead className="text-right">{t('clients.estimated')}</TableHead>
                        <TableHead className="text-right">{t('clients.actual')}</TableHead>
                        <TableHead className="text-right">{t('clients.difference')}</TableHead>
                        <TableHead className="text-right">{t('clients.amountPaid')}</TableHead>
                        <TableHead className="text-right">{t('clients.remainderToPay')}</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {updatedBudget.categories.map((category, index) => {
                        const estimated = category.allocated;
                        const actual = category.spent;
                        const difference = estimated - actual;

                        // For now, we'll assume amount paid is the same as actual
                        // In a real implementation, this would come from vendor payments
                        const amountPaid = client.vendors
                          ?.filter(v => v.category === category.category && v.isPaid)
                          .reduce((sum, vendor) => sum + (vendor.cost || 0), 0) || 0;

                        const remainderToPay = actual - amountPaid;

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <select
                                value={category.category}
                                onChange={(e) => {
                                  const updatedCategories = [...updatedBudget.categories];
                                  updatedCategories[index] = {
                                    ...updatedCategories[index],
                                    category: e.target.value as VendorCategory
                                  };
                                  setUpdatedBudget({
                                    ...updatedBudget,
                                    categories: updatedCategories
                                  });
                                }}
                                className="w-full border rounded p-1"
                              >
                                {vendorCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {formatVendorCategory(cat)}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="relative">
                                <Input
                                  value={estimated}
                                  onChange={(e) => handleCategoryChange(index, 'allocated', e.target.value)}
                                  type="number"
                                  min="0"
                                  className="w-full pl-6 text-right"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">€</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="relative">
                                <Input
                                  value={actual}
                                  onChange={(e) => handleCategoryChange(index, 'spent', e.target.value)}
                                  type="number"
                                  min="0"
                                  className="w-full pl-6 text-right"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">€</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={difference >= 0 ? "text-green-600" : "text-red-600"}>
                                {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(amountPaid)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(remainderToPay)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const updatedCategories = [...updatedBudget.categories];
                                  updatedCategories.splice(index, 1);
                                  setUpdatedBudget({
                                    ...updatedBudget,
                                    categories: updatedCategories
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Total row */}
                      <TableRow className="font-medium bg-gray-50">
                        <TableCell>{t('common.total')}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(updatedBudget.categories.reduce((sum, cat) => sum + cat.allocated, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(updatedBudget.categories.reduce((sum, cat) => sum + cat.spent, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const totalEstimated = updatedBudget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
                            const totalActual = updatedBudget.categories.reduce((sum, cat) => sum + cat.spent, 0);
                            const totalDifference = totalEstimated - totalActual;
                            return (
                              <span className={totalDifference >= 0 ? "text-green-600" : "text-red-600"}>
                                {totalDifference >= 0 ? "+" : ""}{formatCurrency(totalDifference)}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.vendors?.filter(v => v.isPaid).reduce((sum, vendor) => sum + (vendor.cost || 0), 0) || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const totalActual = updatedBudget.categories.reduce((sum, cat) => sum + cat.spent, 0);
                            const totalPaid = client.vendors?.filter(v => v.isPaid).reduce((sum, vendor) => sum + (vendor.cost || 0), 0) || 0;
                            return formatCurrency(totalActual - totalPaid);
                          })()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Budget Visualization */}
              {updatedBudget.categories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-4">{t('clients.estimation')}</h4>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={updatedBudget.categories.map(cat => ({
                              name: formatVendorCategory(cat.category),
                              value: cat.allocated,
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
                            {updatedBudget.categories.map((entry, index) => {
                              // Define colors for different categories
                              const COLORS = [
                                '#FFD700', // Gold - similar to the yellow in the reference image
                                '#FF6B6B', // Red
                                '#4BC0C0', // Teal
                                '#9966FF', // Purple
                                '#FF9F40', // Orange
                                '#36A2EB', // Blue
                                '#FF6384', // Pink
                                '#4CAF50', // Green
                                '#9C27B0', // Deep Purple
                                '#607D8B', // Blue Grey
                                '#795548', // Brown
                                '#00BCD4', // Cyan
                                '#FFEB3B', // Yellow
                                '#673AB7'  // Deep Purple
                              ];
                              return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                            })}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-4">{t('clients.budgetStatus')}</h4>
                    <div className="space-y-3">
                      {updatedBudget.categories.map((cat, index) => {
                        const percentUsed = cat.allocated > 0 ? Math.min(100, Math.round((cat.spent / cat.allocated) * 100)) : 0;

                        // Determine color based on percentage
                        let barColor = "bg-green-500";
                        if (percentUsed > 90) barColor = "bg-red-500";
                        else if (percentUsed > 75) barColor = "bg-orange-500";

                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{formatVendorCategory(cat.category)}</span>
                              <span>{formatCurrency(cat.spent)} / {formatCurrency(cat.allocated)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`${barColor} h-3 rounded-full`}
                                style={{ width: `${percentUsed}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateBudgetOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleUpdateBudget}>{t('common.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>
              Add a new vendor for this client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={newVendor.name}
                onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newVendor.category}
                onChange={(e) => setNewVendor({...newVendor, category: e.target.value as VendorCategory})}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="videography">Videography</option>
                <option value="florist">Florist</option>
                <option value="music">Music</option>
                <option value="cake">Cake</option>
                <option value="attire">Attire</option>
                <option value="hair_makeup">Hair & Makeup</option>
                <option value="transportation">Transportation</option>
                <option value="rentals">Rentals</option>
                <option value="stationery">Stationery</option>
                <option value="gifts">Gifts</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={newVendor.contactName}
                  onChange={(e) => setNewVendor({...newVendor, contactName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vendorEmail">Email</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorPhone">Phone</Label>
                <Input
                  id="vendorPhone"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={newVendor.cost}
                  onChange={(e) => setNewVendor({...newVendor, cost: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPaid"
                checked={newVendor.isPaid}
                onChange={(e) => setNewVendor({...newVendor, isPaid: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isPaid">Mark as paid</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVendorOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVendor}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Add a new task for this wedding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input
                id="taskTitle"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as "low" | "medium" | "high"})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value as "not_started" | "in_progress" | "completed" | "overdue"})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contract Dialog */}
      <AddContractDialog
        open={isAddContractOpen}
        onOpenChange={setIsAddContractOpen}
        clientId={client.id}
        onSuccess={(id) => navigate(`/app/contracts/${id}`)}
      />
    </div>
  );
};

export default ClientDetails;
