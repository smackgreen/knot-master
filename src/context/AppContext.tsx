import { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import {
  Client, Vendor, Task, Budget, Invoice, Quotation, Guest, GuestStatus,
  Table, SeatingChart, TableShape, DesignSuggestion, ColorScheme, DecorIdea,
  VisualizationProject, MealPlan, MealItem, MealType, CourseType,
  Contract, ContractTemplate, Signature, ContractStatus, ContractCategory
} from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import i18n from '../i18n';
import {
  addMealPlan as addMealPlanOperation,
  updateMealPlan as updateMealPlanOperation,
  deleteMealPlan as deleteMealPlanOperation,
  addMealItem as addMealItemOperation,
  updateMealItem as updateMealItemOperation,
  deleteMealItem as deleteMealItemOperation,
  fetchMealPlans,
  fetchMealItems
} from './meal-planning-operations';

interface AppContextType {
  clients: Client[];
  vendors: Vendor[];
  tasks: Task[];
  budgets: Budget[];
  invoices: Invoice[];
  quotations: Quotation[];
  guests: Guest[];
  tables: Table[];
  seatingCharts: SeatingChart[];
  designSuggestions: DesignSuggestion[];
  mealPlans: MealPlan[];
  contracts: Contract[];
  contractTemplates: ContractTemplate[];
  isLoading: boolean;
  getClientById: (id: string) => Client | undefined;
  getVendorById: (id: string) => Vendor | undefined;
  getVendorsByClientId: (clientId: string) => Vendor[];
  getTasksByClientId: (clientId: string) => Task[];
  getBudgetByClientId: (clientId: string) => Budget | undefined;
  getInvoicesByClientId: (clientId: string) => Invoice[];
  getQuotationsByClientId: (clientId: string) => Quotation[];
  getGuestsByClientId: (clientId: string) => Guest[];
  getTablesByClientId: (clientId: string) => Table[];
  getSeatingChartsByClientId: (clientId: string) => SeatingChart[];
  getDesignSuggestionsByClientId: (clientId: string) => DesignSuggestion[];
  getMealPlansByClientId: (clientId: string) => MealPlan[];
  getMealItemsByMealPlanId: (mealPlanId: string) => MealItem[];
  getTasksByStatus: (status: string) => Task[];
  getTasksByPriority: (priority: string) => Task[];
  getTasksByCategory: (category?: string) => Task[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (id: string, vendor: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createBudget: (clientId: string, budget: { totalBudget: number, categories: { category: string, allocated: number, spent: number }[] }) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  sendInvoice: (id: string) => void;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt'>) => Promise<void>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  sendQuotation: (id: string) => void;
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGuest: (id: string, guest: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTable: (id: string, table: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  createSeatingChart: (seatingChart: Omit<SeatingChart, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSeatingChart: (id: string, seatingChart: Partial<SeatingChart>) => Promise<void>;
  deleteSeatingChart: (id: string) => Promise<void>;
  assignGuestToTable: (guestId: string, tableId: string, seatPosition?: number) => Promise<void>;
  removeGuestFromTable: (guestId: string) => Promise<void>;
  autoAssignGuests: (clientId: string, strategy?: 'family' | 'random' | 'balanced') => Promise<void>;

  // Design Suggestions
  addDesignSuggestion: (suggestion: Omit<DesignSuggestion, 'id' | 'createdAt' | 'updatedAt' | 'colorSchemes' | 'decorIdeas' | 'visualizations'>) => Promise<string>;
  updateDesignSuggestion: (id: string, suggestion: Partial<DesignSuggestion>) => Promise<void>;
  deleteDesignSuggestion: (id: string) => Promise<void>;
  addColorScheme: (colorScheme: Omit<ColorScheme, 'id' | 'createdAt'>) => Promise<void>;
  deleteColorScheme: (id: string) => Promise<void>;
  addDecorIdea: (decorIdea: Omit<DecorIdea, 'id' | 'createdAt'>) => Promise<void>;
  deleteDecorIdea: (id: string) => Promise<void>;
  addVisualization: (visualization: Omit<VisualizationProject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVisualization: (id: string, visualization: Partial<VisualizationProject>) => Promise<void>;
  deleteVisualization: (id: string) => Promise<void>;

  // Meal Planning
  addMealPlan: (mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt' | 'mealItems'>) => Promise<string>;
  updateMealPlan: (mealPlan: MealPlan) => Promise<void>;
  deleteMealPlan: (id: string) => Promise<void>;
  addMealItem: (mealItem: Omit<MealItem, 'id' | 'createdAt'>) => Promise<void>;
  updateMealItem: (id: string, mealItem: Partial<MealItem>) => Promise<void>;
  deleteMealItem: (id: string) => Promise<void>;

  // Contract Management
  getContractsByClientId: (clientId: string) => Contract[];
  getContractsByVendorId: (vendorId: string) => Contract[];
  getContractById: (id: string) => Contract | undefined;
  getContractTemplateById: (id: string) => ContractTemplate | undefined;
  getContractTemplatesByCategory: (category: ContractCategory) => ContractTemplate[];
  addContractTemplate: (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContractTemplate: (id: string, template: Partial<ContractTemplate>) => Promise<void>;
  deleteContractTemplate: (id: string) => Promise<void>;
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  sendContract: (id: string) => Promise<void>;
  signContract: (id: string, signature: Signature, role: 'client' | 'vendor' | 'planner') => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Helper function to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const AppProvider = ({ children }: AppProviderProps) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [seatingCharts, setSeatingCharts] = useState<SeatingChart[]>([]);
  const [designSuggestions, setDesignSuggestions] = useState<DesignSuggestion[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get a client by ID
  const getClientById = (id: string) => {
    return clients.find(client => client.id === id);
  };

  // Get a vendor by ID
  const getVendorById = (id: string) => {
    return vendors.find(vendor => vendor.id === id);
  };

  // Get vendors by client ID
  const getVendorsByClientId = (clientId: string) => {
    return vendors.filter(vendor => vendor.clientId === clientId);
  };

  // Get tasks by client ID
  const getTasksByClientId = (clientId: string) => {
    return tasks.filter(task => task.clientId === clientId);
  };

  // Get budget by client ID
  const getBudgetByClientId = (clientId: string) => {
    return budgets.find(budget => budget.clientId === clientId);
  };

  // Get invoices by client ID
  const getInvoicesByClientId = (clientId: string) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  // Get quotations by client ID
  const getQuotationsByClientId = (clientId: string) => {
    return quotations.filter(quotation => quotation.clientId === clientId);
  };

  // Get guests by client ID
  const getGuestsByClientId = (clientId: string) => {
    return guests.filter(guest => guest.clientId === clientId);
  };

  // Get tables by client ID
  const getTablesByClientId = (clientId: string) => {
    return tables.filter(table => table.clientId === clientId);
  };

  // Get seating charts by client ID
  const getSeatingChartsByClientId = (clientId: string) => {
    return seatingCharts.filter(chart => chart.clientId === clientId);
  };

  // Get design suggestions by client ID
  const getDesignSuggestionsByClientId = (clientId: string) => {
    return designSuggestions.filter(suggestion => suggestion.clientId === clientId);
  };

  // Get meal plans by client ID
  const getMealPlansByClientId = (clientId: string) => {
    return mealPlans.filter(mealPlan => mealPlan.clientId === clientId);
  };

  // Get meal items by meal plan ID
  const getMealItemsByMealPlanId = (mealPlanId: string) => {
    console.log(`Getting meal items for meal plan ${mealPlanId}`);
    console.log(`Total meal items in state: ${mealItems.length}`);

    const filteredItems = mealItems.filter(mealItem => mealItem.mealPlanId === mealPlanId);
    console.log(`Found ${filteredItems.length} meal items for this meal plan`);
    console.log('Meal items:', filteredItems);

    return filteredItems;
  };

  // Get contracts by client ID
  const getContractsByClientId = (clientId: string) => {
    return contracts.filter(contract => contract.clientId === clientId);
  };

  // Get contracts by vendor ID
  const getContractsByVendorId = (vendorId: string) => {
    return contracts.filter(contract => contract.vendorId === vendorId);
  };

  // Get contract by ID
  const getContractById = (id: string) => {
    return contracts.find(contract => contract.id === id);
  };

  // Get contract template by ID
  const getContractTemplateById = (id: string) => {
    return contractTemplates.find(template => template.id === id);
  };

  // Get contract templates by category
  const getContractTemplatesByCategory = (category: ContractCategory) => {
    return contractTemplates.filter(template => template.category === category);
  };

  // Get tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // Get tasks by priority
  const getTasksByPriority = (priority: string) => {
    return tasks.filter(task => task.priority === priority);
  };

  // Get tasks by category
  const getTasksByCategory = (category?: string) => {
    if (!category) return tasks;
    return tasks.filter(task => task.category === category);
  };

  // Add a new client
  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('clients.loginToAdd'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: client.name,
          partner_name: client.partnerName,
          email: client.email,
          phone: client.phone,
          wedding_date: client.weddingDate,
          venue: client.venue,
          notes: client.notes,
          status: client.status || 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const newClient: Client = {
        id: data.id,
        name: data.name,
        partnerName: data.partner_name,
        email: data.email || '',
        phone: data.phone || '',
        weddingDate: data.wedding_date,
        venue: data.venue || '',
        notes: data.notes || '',
        status: data.status || 'active',
        createdAt: data.created_at,
      };

      setClients([...clients, newClient]);
      toast.success(i18n.t('clients.clientAdded'));
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error(i18n.t('clients.addClientError'));
    }
  };

  // Update an existing client
  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!user) {
      toast.error(i18n.t('clients.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.partnerName !== undefined) dbUpdates.partner_name = updates.partnerName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.weddingDate !== undefined) dbUpdates.wedding_date = updates.weddingDate;
      if (updates.venue !== undefined) dbUpdates.venue = updates.venue;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedClients = clients.map(client =>
        client.id === id ? { ...client, ...updates } : client
      );
      setClients(updatedClients);
      toast.success(i18n.t('clients.clientUpdated'));
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error(i18n.t('clients.updateClientError'));
    }
  };

  // Delete a client
  const deleteClient = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('clients.loginToDelete'));
      return;
    }

    try {
      // Delete the client (cascade will handle related records)
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setClients(clients.filter(client => client.id !== id));
      setVendors(vendors.filter(vendor => vendor.clientId !== id));
      setTasks(tasks.filter(task => task.clientId !== id));
      setBudgets(budgets.filter(budget => budget.clientId !== id));
      toast.success(i18n.t('clients.clientDeleted'));
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(i18n.t('clients.deleteClientError'));
    }
  };

  // Add a new vendor
  const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!user) {
      toast.error(i18n.t('vendors.loginToAdd'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          client_id: vendor.clientId,
          name: vendor.name,
          category: vendor.category,
          contact_name: vendor.contactName,
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website,
          notes: vendor.notes,
          cost: vendor.cost,
          is_paid: vendor.isPaid
        })
        .select()
        .single();

      if (error) throw error;

      const newVendor: Vendor = {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        category: data.category,
        contactName: data.contact_name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        notes: data.notes || '',
        cost: data.cost || 0,
        isPaid: data.is_paid || false,
      };

      setVendors([...vendors, newVendor]);
      toast.success(i18n.t('vendors.vendorAdded'));
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error(i18n.t('vendors.addError'));
    }
  };

  // Update an existing vendor
  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    if (!user) {
      toast.error(i18n.t('vendors.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
      if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;

      const { error } = await supabase
        .from('vendors')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedVendors = vendors.map(vendor =>
        vendor.id === id ? { ...vendor, ...updates } : vendor
      );
      setVendors(updatedVendors);
      toast.success(i18n.t('vendors.vendorUpdated'));
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error(i18n.t('vendors.updateError'));
    }
  };

  // Delete a vendor
  const deleteVendor = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('vendors.loginToDelete'));
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setVendors(vendors.filter(vendor => vendor.id !== id));
      toast.success(i18n.t('vendors.vendorDeleted'));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(i18n.t('vendors.deleteError'));
    }
  };

  // Add a new task
  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('tasks.loginToAdd'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          client_id: task.clientId,
          title: task.title,
          description: task.description,
          due_date: task.dueDate,
          status: task.status || 'not_started',
          priority: task.priority || 'medium',
          category: task.category || null
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        clientId: data.client_id,
        title: data.title,
        description: data.description || '',
        dueDate: data.due_date,
        status: data.status || 'not_started',
        priority: data.priority || 'medium',
        createdAt: data.created_at,
        category: data.category,
      };

      setTasks([...tasks, newTask]);
      toast.success(i18n.t('tasks.taskAdded'));
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error(i18n.t('tasks.addError'));
    }
  };

  // Update an existing task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) {
      toast.error(i18n.t('tasks.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.category !== undefined) dbUpdates.category = updates.category || null;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedTasks = tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
      toast.success(i18n.t('tasks.taskUpdated'));
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(i18n.t('tasks.updateError'));
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('tasks.loginToDelete'));
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setTasks(tasks.filter(task => task.id !== id));
      toast.success(i18n.t('tasks.taskDeleted'));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(i18n.t('tasks.deleteError'));
    }
  };

  // Create a new budget
  const createBudget = async (clientId: string, budget: { totalBudget: number, categories: { category: string, allocated: number, spent: number }[] }) => {
    if (!user) {
      toast.error(i18n.t('dashboard.loginToCreateBudget'));
      return;
    }

    try {
      // Insert the budget
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          client_id: clientId,
          total_budget: budget.totalBudget
        })
        .select()
        .single();

      if (error) throw error;

      // Insert budget categories if they exist
      if (budget.categories && budget.categories.length > 0) {
        const categoriesToInsert = budget.categories.map(category => ({
          budget_id: data.id,
          category: category.category,
          allocated: category.allocated,
          spent: category.spent
        }));

        const { error: categoriesError } = await supabase
          .from('budget_categories')
          .insert(categoriesToInsert);

        if (categoriesError) throw categoriesError;
      }

      // Create the new budget object
      const newBudget: Budget = {
        id: data.id,
        clientId: data.client_id,
        totalBudget: data.total_budget,
        spentSoFar: budget.categories.reduce((sum, cat) => sum + cat.spent, 0),
        categories: budget.categories
      };

      // Update local state
      setBudgets([...budgets, newBudget]);

      // Update the client with the new budget
      const updatedClients = clients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            budget: newBudget
          };
        }
        return client;
      });

      setClients(updatedClients);
      toast.success(i18n.t('clients.budgetCreated', 'Budget created successfully.'));
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error(i18n.t('dashboard.createBudgetError'));
    }
  };

  // Update a budget
  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!user) {
      toast.error(i18n.t('dashboard.loginToUpdateBudget'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.totalBudget !== undefined) dbUpdates.total_budget = updates.totalBudget;

      const { error } = await supabase
        .from('budgets')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // If we have categories to update
      if (updates.categories && updates.categories.length > 0) {
        // Update each category
        for (const category of updates.categories) {
          const { error: catError } = await supabase
            .from('budget_categories')
            .upsert({
              budget_id: id,
              category: category.category,
              allocated: category.allocated,
              spent: category.spent
            }, {
              onConflict: 'budget_id,category'
            });

          if (catError) throw catError;
        }
      }

      // Update local state
      const updatedBudgets = budgets.map(budget =>
        budget.id === id ? { ...budget, ...updates } : budget
      );
      setBudgets(updatedBudgets);
      toast.success(i18n.t('clients.budgetUpdated', 'Budget updated successfully.'));
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error(i18n.t('dashboard.updateBudgetError'));
    }
  };

  // Invoice operations
  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('invoices.loginToCreate'));
      return;
    }

    try {
      // Insert the invoice
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: invoice.clientId,
          number: invoice.invoiceNumber, // This maps to the 'number' column in the database
          issue_date: invoice.issueDate || new Date().toISOString().split('T')[0],
          due_date: invoice.dueDate,
          status: invoice.status || 'draft',
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          total: invoice.total || 0,
          notes: invoice.notes,
          custom_title: invoice.customTitle,
          legal_text: invoice.legalText
        })
        .select()
        .single();

      if (error) throw error;

      // Insert invoice items if they exist
      if (invoice.items && invoice.items.length > 0) {
        const itemsToInsert = invoice.items.map(item => ({
          invoice_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Fetch the complete invoice with items
      const { data: completeInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('id', data.id)
        .single();

      if (fetchError) throw fetchError;

      const newInvoice: Invoice = {
        id: completeInvoice.id,
        clientId: completeInvoice.client_id,
        invoiceNumber: completeInvoice.number,
        issueDate: completeInvoice.issue_date,
        dueDate: completeInvoice.due_date,
        status: completeInvoice.status,
        subtotal: completeInvoice.subtotal,
        tax: completeInvoice.tax,
        total: completeInvoice.total,
        notes: completeInvoice.notes,
        customTitle: completeInvoice.custom_title,
        legalText: completeInvoice.legal_text,
        createdAt: completeInvoice.created_at,
        items: completeInvoice.invoice_items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total
        }))
      };

      setInvoices([...invoices, newInvoice]);
      toast.success(i18n.t('invoices.invoiceAdded'));
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(i18n.t('invoices.createError'));
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!user) {
      toast.error(i18n.t('invoices.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.invoiceNumber !== undefined) dbUpdates.number = updates.invoiceNumber;
      if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.customTitle !== undefined) dbUpdates.custom_title = updates.customTitle;
      if (updates.legalText !== undefined) dbUpdates.legal_text = updates.legalText;

      // Update the invoice
      const { error } = await supabase
        .from('invoices')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update invoice items if they exist
      if (updates.items && updates.items.length > 0) {
        // First delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        if (deleteError) throw deleteError;

        // Then insert new items
        const itemsToInsert = updates.items.map(item => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }));

        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Fetch the updated invoice with items
      const { data: updatedInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update local state
      const processedInvoice = {
        id: updatedInvoice.id,
        clientId: updatedInvoice.client_id,
        invoiceNumber: updatedInvoice.number,
        issueDate: updatedInvoice.issue_date,
        dueDate: updatedInvoice.due_date,
        status: updatedInvoice.status,
        subtotal: updatedInvoice.subtotal,
        tax: updatedInvoice.tax,
        total: updatedInvoice.total,
        notes: updatedInvoice.notes,
        customTitle: updatedInvoice.custom_title,
        legalText: updatedInvoice.legal_text,
        createdAt: updatedInvoice.created_at,
        items: updatedInvoice.invoice_items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total
        }))
      };

      const updatedInvoices = invoices.map(invoice =>
        invoice.id === id ? processedInvoice : invoice
      );

      setInvoices(updatedInvoices);
      toast.success(i18n.t('invoices.invoiceUpdated'));
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(i18n.t('invoices.updateError'));
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('invoices.loginToDelete'));
      return;
    }

    try {
      // Delete invoice (cascade will handle invoice items)
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      toast.success(i18n.t('invoices.invoiceDeleted'));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(i18n.t('invoices.deleteError'));
    }
  };

  const sendInvoice = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('invoices.loginToSend'));
      return;
    }

    try {
      // Update the invoice status in the database
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedInvoices = invoices.map(invoice =>
        invoice.id === id ? { ...invoice, status: 'sent' as const } : invoice
      );
      setInvoices(updatedInvoices);
      toast.success(i18n.t('invoices.invoiceSent'));

      // In a real app, this would also send an email to the client
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(i18n.t('invoices.sendError'));
    }
  };

  // Quotation operations
  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('quotations.loginToCreate'));
      return;
    }

    try {
      // Insert the quotation
      const { data, error } = await supabase
        .from('quotations')
        .insert({
          user_id: user.id,
          client_id: quotation.clientId,
          number: quotation.quotationNumber, // This maps to the 'number' column in the database
          issue_date: quotation.issueDate || new Date().toISOString().split('T')[0],
          valid_until: quotation.validUntil,
          status: quotation.status || 'draft',
          subtotal: quotation.subtotal || 0,
          tax: quotation.tax || 0,
          total: quotation.total || 0,
          notes: quotation.notes,
          custom_title: quotation.customTitle,
          legal_text: quotation.legalText
        })
        .select()
        .single();

      if (error) throw error;

      // Insert quotation items if they exist
      if (quotation.items && quotation.items.length > 0) {
        const itemsToInsert = quotation.items.map(item => ({
          quotation_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Fetch the complete quotation with items
      const { data: completeQuotation, error: fetchError } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items(*)
        `)
        .eq('id', data.id)
        .single();

      if (fetchError) throw fetchError;

      const newQuotation: Quotation = {
        id: completeQuotation.id,
        clientId: completeQuotation.client_id,
        quotationNumber: completeQuotation.number,
        issueDate: completeQuotation.issue_date,
        validUntil: completeQuotation.valid_until,
        status: completeQuotation.status,
        subtotal: completeQuotation.subtotal,
        tax: completeQuotation.tax,
        total: completeQuotation.total,
        notes: completeQuotation.notes,
        customTitle: completeQuotation.custom_title,
        legalText: completeQuotation.legal_text,
        createdAt: completeQuotation.created_at,
        items: completeQuotation.quotation_items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total
        }))
      };

      setQuotations([...quotations, newQuotation]);
      toast.success(i18n.t('quotations.quotationAdded'));
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error(i18n.t('quotations.createError'));
    }
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    if (!user) {
      toast.error(i18n.t('quotations.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.quotationNumber !== undefined) dbUpdates.number = updates.quotationNumber;
      if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
      if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.customTitle !== undefined) dbUpdates.custom_title = updates.customTitle;
      if (updates.legalText !== undefined) dbUpdates.legal_text = updates.legalText;

      // Update the quotation
      const { error } = await supabase
        .from('quotations')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update quotation items if they exist
      if (updates.items && updates.items.length > 0) {
        // First delete existing items
        const { error: deleteError } = await supabase
          .from('quotation_items')
          .delete()
          .eq('quotation_id', id);

        if (deleteError) throw deleteError;

        // Then insert new items
        const itemsToInsert = updates.items.map(item => ({
          quotation_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }));

        const { error: insertError } = await supabase
          .from('quotation_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Fetch the updated quotation with items
      const { data: updatedQuotation, error: fetchError } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update local state
      const processedQuotation = {
        id: updatedQuotation.id,
        clientId: updatedQuotation.client_id,
        quotationNumber: updatedQuotation.number,
        issueDate: updatedQuotation.issue_date,
        validUntil: updatedQuotation.valid_until,
        status: updatedQuotation.status,
        subtotal: updatedQuotation.subtotal,
        tax: updatedQuotation.tax,
        total: updatedQuotation.total,
        notes: updatedQuotation.notes,
        customTitle: updatedQuotation.custom_title,
        legalText: updatedQuotation.legal_text,
        createdAt: updatedQuotation.created_at,
        items: updatedQuotation.quotation_items.map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total
        }))
      };

      const updatedQuotations = quotations.map(quotation =>
        quotation.id === id ? processedQuotation : quotation
      );

      setQuotations(updatedQuotations);
      toast.success(i18n.t('quotations.quotationUpdated'));
    } catch (error) {
      console.error('Error updating quotation:', error);
      toast.error(i18n.t('quotations.updateError'));
    }
  };

  const deleteQuotation = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('quotations.loginToDelete'));
      return;
    }

    try {
      // Delete quotation (cascade will handle quotation items)
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setQuotations(quotations.filter(quotation => quotation.id !== id));
      toast.success(i18n.t('quotations.quotationDeleted'));
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error(i18n.t('quotations.deleteError'));
    }
  };

  const sendQuotation = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('quotations.loginToSend'));
      return;
    }

    try {
      // Update the quotation status in the database
      const { error } = await supabase
        .from('quotations')
        .update({ status: 'sent' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedQuotations = quotations.map(quotation =>
        quotation.id === id ? { ...quotation, status: 'sent' as const } : quotation
      );
      setQuotations(updatedQuotations);
      toast.success(i18n.t('quotations.quotationSent'));

      // In a real app, this would also send an email to the client
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error(i18n.t('quotations.sendError'));
    }
  };

  // Add a new guest
  const addGuest = async (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error(i18n.t('guests.loginToAdd'));
      return;
    }

    try {
      // Convert children array to JSON if it exists
      const childrenJson = guest.children ? JSON.stringify(guest.children) : null;

      const { data, error } = await supabase
        .from('guests')
        .insert({
          user_id: user.id,
          client_id: guest.clientId,
          first_name: guest.firstName,
          last_name: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          address: guest.address,
          city: guest.city,
          state: guest.state,
          postal_code: guest.postalCode,
          country: guest.country || 'USA',
          status: guest.status || 'pending',
          rsvp_status: guest.rsvpStatus,
          meal_preference: guest.mealPreference,
          // New fields for couples and children
          is_couple: guest.isCouple || false,
          partner_first_name: guest.partnerFirstName,
          partner_last_name: guest.partnerLastName,
          partner_email: guest.partnerEmail,
          partner_meal_preference: guest.partnerMealPreference,
          has_children: guest.hasChildren || false,
          children: childrenJson,
          // Keep the old fields for backward compatibility
          plus_one: guest.isCouple || false,
          plus_one_name: guest.partnerFirstName && guest.partnerLastName
            ? `${guest.partnerFirstName} ${guest.partnerLastName}`
            : undefined,
          table_assignment: guest.tableAssignment,
          notes: guest.notes
        })
        .select()
        .single();

      if (error) throw error;

      // Parse children from JSON if it exists
      const children = data.children ? JSON.parse(data.children) : [];

      const newGuest: Guest = {
        id: data.id,
        clientId: data.client_id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postal_code || '',
        country: data.country || 'USA',
        status: data.status || 'pending',
        rsvpStatus: data.rsvp_status || '',
        mealPreference: data.meal_preference || '',
        // New fields for couples and children
        isCouple: data.is_couple || false,
        partnerFirstName: data.partner_first_name || '',
        partnerLastName: data.partner_last_name || '',
        partnerEmail: data.partner_email || '',
        partnerMealPreference: data.partner_meal_preference || '',
        hasChildren: data.has_children || false,
        children: children,
        // Keep the old fields for backward compatibility
        plusOne: data.plus_one || false,
        plusOneName: data.plus_one_name || '',
        tableAssignment: data.table_assignment || '',
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setGuests([...guests, newGuest]);
      toast.success(i18n.t('guests.guestAdded', 'Guest added successfully.'));
    } catch (error) {
      console.error('Error adding guest:', error);
      toast.error(i18n.t('guests.addError'));
    }
  };

  // Update an existing guest
  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    if (!user) {
      toast.error(i18n.t('guests.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.rsvpStatus !== undefined) dbUpdates.rsvp_status = updates.rsvpStatus;
      if (updates.mealPreference !== undefined) dbUpdates.meal_preference = updates.mealPreference;

      // New fields for couples
      if (updates.isCouple !== undefined) {
        dbUpdates.is_couple = updates.isCouple;
        // Keep plus_one in sync for backward compatibility
        dbUpdates.plus_one = updates.isCouple;
      }
      if (updates.partnerFirstName !== undefined) dbUpdates.partner_first_name = updates.partnerFirstName;
      if (updates.partnerLastName !== undefined) dbUpdates.partner_last_name = updates.partnerLastName;
      if (updates.partnerEmail !== undefined) dbUpdates.partner_email = updates.partnerEmail;
      if (updates.partnerMealPreference !== undefined) dbUpdates.partner_meal_preference = updates.partnerMealPreference;

      // Update plus_one_name for backward compatibility
      if (updates.partnerFirstName !== undefined || updates.partnerLastName !== undefined) {
        // Get the current guest to combine with updates
        const currentGuest = guests.find(g => g.id === id);
        if (currentGuest) {
          const firstName = updates.partnerFirstName !== undefined ? updates.partnerFirstName : currentGuest.partnerFirstName;
          const lastName = updates.partnerLastName !== undefined ? updates.partnerLastName : currentGuest.partnerLastName;
          if (firstName && lastName) {
            dbUpdates.plus_one_name = `${firstName} ${lastName}`;
          }
        }
      }

      // New fields for children
      if (updates.hasChildren !== undefined) dbUpdates.has_children = updates.hasChildren;
      if (updates.children !== undefined) dbUpdates.children = JSON.stringify(updates.children);

      // Other fields
      if (updates.tableAssignment !== undefined) dbUpdates.table_assignment = updates.tableAssignment;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('guests')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedGuests = guests.map(guest =>
        guest.id === id ? { ...guest, ...updates } : guest
      );
      setGuests(updatedGuests);
      toast.success(i18n.t('guests.guestUpdated', 'Guest updated successfully.'));
    } catch (error) {
      console.error('Error updating guest:', error);
      toast.error(i18n.t('guests.updateError'));
    }
  };

  // Delete a guest
  const deleteGuest = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('guests.loginToDelete'));
      return;
    }

    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setGuests(guests.filter(guest => guest.id !== id));
      toast.success(i18n.t('guests.guestDeleted', 'Guest deleted successfully.'));
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error(i18n.t('guests.deleteError'));
    }
  };

  // Add a new table
  const addTable = async (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToAddTable'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          user_id: user.id,
          client_id: table.clientId,
          name: table.name,
          shape: table.shape,
          width: table.width,
          height: table.height,
          position_x: table.positionX,
          position_y: table.positionY,
          capacity: table.capacity,
          rotation: table.rotation
        })
        .select()
        .single();

      if (error) throw error;

      const newTable: Table = {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        shape: data.shape,
        width: data.width,
        height: data.height,
        positionX: data.position_x,
        positionY: data.position_y,
        capacity: data.capacity,
        rotation: data.rotation,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setTables([...tables, newTable]);
      toast.success(i18n.t('seating.tableAdded', 'Table added successfully.'));
    } catch (error) {
      console.error('Error adding table:', error);
      toast.error(i18n.t('seating.addTableError'));
    }
  };

  // Update an existing table
  const updateTable = async (id: string, updates: Partial<Table>) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToUpdateTable'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.shape !== undefined) dbUpdates.shape = updates.shape;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.height !== undefined) dbUpdates.height = updates.height;
      if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
      if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
      if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
      if (updates.rotation !== undefined) dbUpdates.rotation = updates.rotation;

      const { error } = await supabase
        .from('tables')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedTables = tables.map(table =>
        table.id === id ? { ...table, ...updates } : table
      );
      setTables(updatedTables);
      toast.success(i18n.t('seating.tableUpdated', 'Table updated successfully.'));
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error(i18n.t('seating.updateTableError'));
    }
  };

  // Delete a table
  const deleteTable = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToDeleteTable'));
      return;
    }

    try {
      // First, remove table assignments from guests
      const guestsToUpdate = guests.filter(guest => guest.tableId === id);

      for (const guest of guestsToUpdate) {
        await updateGuest(guest.id, { tableId: undefined, seatPosition: undefined });
      }

      // Then delete the table
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setTables(tables.filter(table => table.id !== id));
      toast.success(i18n.t('seating.tableDeleted', 'Table deleted successfully.'));
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error(i18n.t('seating.deleteTableError'));
    }
  };

  // Create a new seating chart
  const createSeatingChart = async (seatingChart: Omit<SeatingChart, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToCreateChart'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seating_charts')
        .insert({
          user_id: user.id,
          client_id: seatingChart.clientId,
          name: seatingChart.name,
          width: seatingChart.width,
          height: seatingChart.height
        })
        .select()
        .single();

      if (error) throw error;

      const newSeatingChart: SeatingChart = {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        width: data.width,
        height: data.height,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSeatingCharts([...seatingCharts, newSeatingChart]);
      toast.success(i18n.t('seating.chartCreated', 'Seating chart created successfully.'));
    } catch (error) {
      console.error('Error creating seating chart:', error);
      toast.error(i18n.t('seating.createChartError'));
    }
  };

  // Update an existing seating chart
  const updateSeatingChart = async (id: string, updates: Partial<SeatingChart>) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToUpdateChart'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.height !== undefined) dbUpdates.height = updates.height;

      const { error } = await supabase
        .from('seating_charts')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedSeatingCharts = seatingCharts.map(chart =>
        chart.id === id ? { ...chart, ...updates } : chart
      );
      setSeatingCharts(updatedSeatingCharts);
      toast.success(i18n.t('seating.chartUpdated', 'Seating chart updated successfully.'));
    } catch (error) {
      console.error('Error updating seating chart:', error);
      toast.error(i18n.t('seating.updateChartError'));
    }
  };

  // Delete a seating chart
  const deleteSeatingChart = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToDeleteChart'));
      return;
    }

    try {
      const { error } = await supabase
        .from('seating_charts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSeatingCharts(seatingCharts.filter(chart => chart.id !== id));
      toast.success(i18n.t('seating.chartDeleted', 'Seating chart deleted successfully.'));
    } catch (error) {
      console.error('Error deleting seating chart:', error);
      toast.error(i18n.t('seating.deleteChartError'));
    }
  };

  // Assign a guest to a table
  const assignGuestToTable = async (guestId: string, tableId: string, seatPosition?: number) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToAssignGuest'));
      return;
    }

    try {
      // Update the guest with the table assignment
      const { error } = await supabase
        .from('guests')
        .update({
          table_id: tableId,
          seat_position: seatPosition,
          // Update the legacy field for backward compatibility
          table_assignment: tables.find(t => t.id === tableId)?.name || ''
        })
        .eq('id', guestId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedGuests = guests.map(guest => {
        if (guest.id === guestId) {
          const tableName = tables.find(t => t.id === tableId)?.name || '';
          return {
            ...guest,
            tableId,
            seatPosition,
            tableAssignment: tableName // Keep legacy field updated
          };
        }
        return guest;
      });

      setGuests(updatedGuests);
      toast.success(i18n.t('seating.guestAssigned'));
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      toast.error(i18n.t('seating.assignGuestError'));
    }
  };

  // Remove a guest from a table
  const removeGuestFromTable = async (guestId: string) => {
    if (!user) {
      toast.error(i18n.t('seating.loginToRemoveGuest'));
      return;
    }

    try {
      // Update the guest to remove table assignment
      const { error } = await supabase
        .from('guests')
        .update({
          table_id: null,
          seat_position: null,
          table_assignment: null // Update legacy field
        })
        .eq('id', guestId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedGuests = guests.map(guest => {
        if (guest.id === guestId) {
          return {
            ...guest,
            tableId: undefined,
            seatPosition: undefined,
            tableAssignment: undefined // Keep legacy field updated
          };
        }
        return guest;
      });

      setGuests(updatedGuests);
      toast.success(i18n.t('seating.guestRemoved'));
    } catch (error) {
      console.error('Error removing guest from table:', error);
      toast.error(i18n.t('seating.removeGuestError'));
    }
  };

  // Auto-assign guests to tables
  const autoAssignGuests = async (clientId: string, strategy: 'family' | 'random' | 'balanced' = 'family') => {
    if (!user) {
      toast.error(i18n.t('seating.loginToAutoAssign'));
      return;
    }

    try {
      const clientGuests = getGuestsByClientId(clientId);
      const clientTables = getTablesByClientId(clientId);

      if (clientTables.length === 0) {
        toast.error(i18n.t('seating.noTablesError'));
        return;
      }

      // Clear existing assignments
      for (const guest of clientGuests) {
        if (guest.tableId) {
          await removeGuestFromTable(guest.id);
        }
      }

      // Different assignment strategies
      if (strategy === 'family') {
        // Group by families (couples and their children)
        const families: Guest[][] = [];
        const assignedGuests = new Set<string>();

        // First, find all couples and create family groups
        for (const guest of clientGuests) {
          if (assignedGuests.has(guest.id)) continue;

          const family: Guest[] = [guest];
          assignedGuests.add(guest.id);

          // If this is a couple, add partner to the family
          if (guest.isCouple) {
            // Partner is part of the same guest record in our data model
            // We just mark them as assigned
          }

          // Add any children
          if (guest.hasChildren && guest.children && guest.children.length > 0) {
            // Children are part of the same guest record in our data model
            // We just mark them as assigned
          }

          families.push(family);
        }

        // Assign families to tables
        let tableIndex = 0;
        for (const family of families) {
          // Find a table with enough capacity
          let assigned = false;
          const familySize = family.reduce((size, guest) => {
            // Count the guest
            let count = 1;
            // Count partner if it's a couple
            if (guest.isCouple) count++;
            // Count children
            if (guest.hasChildren && guest.children) {
              count += guest.children.length;
            }
            return size + count;
          }, 0);

          // Try to find a table with enough capacity
          for (let i = 0; i < clientTables.length; i++) {
            const table = clientTables[i];
            const assignedToTable = clientGuests.filter(g => g.tableId === table.id);

            // Count people already at this table
            const peopleAtTable = assignedToTable.reduce((count, g) => {
              let c = 1;
              if (g.isCouple) c++;
              if (g.hasChildren && g.children) c += g.children.length;
              return count + c;
            }, 0);

            if (table.capacity - peopleAtTable >= familySize) {
              // Assign all family members to this table
              for (const guest of family) {
                await assignGuestToTable(guest.id, table.id);
              }
              assigned = true;
              break;
            }
          }

          // If no table has enough capacity, use round-robin
          if (!assigned) {
            for (const guest of family) {
              await assignGuestToTable(guest.id, clientTables[tableIndex].id);
              tableIndex = (tableIndex + 1) % clientTables.length;
            }
          }
        }
      } else if (strategy === 'random') {
        // Simple random assignment
        for (const guest of clientGuests) {
          const randomTable = clientTables[Math.floor(Math.random() * clientTables.length)];
          await assignGuestToTable(guest.id, randomTable.id);
        }
      } else if (strategy === 'balanced') {
        // Balanced assignment - distribute guests evenly
        const sortedTables = [...clientTables].sort((a, b) => b.capacity - a.capacity);

        // Assign guests one by one to the table with the most remaining capacity
        for (const guest of clientGuests) {
          // Calculate current occupancy for each table
          const tableOccupancy = sortedTables.map(table => {
            const assignedGuests = clientGuests.filter(g => g.tableId === table.id);
            return {
              table,
              occupancy: assignedGuests.length,
              remainingCapacity: table.capacity - assignedGuests.length
            };
          });

          // Sort by remaining capacity (descending)
          tableOccupancy.sort((a, b) => b.remainingCapacity - a.remainingCapacity);

          // Assign to table with most remaining capacity
          if (tableOccupancy[0].remainingCapacity > 0) {
            await assignGuestToTable(guest.id, tableOccupancy[0].table.id);
          } else {
            // If all tables are full, assign to the first table
            await assignGuestToTable(guest.id, sortedTables[0].id);
          }
        }
      }

      toast.success(i18n.t('seating.guestsAutoAssigned'));
    } catch (error) {
      console.error('Error auto-assigning guests:', error);
      toast.error(i18n.t('seating.autoAssignError'));
    }
  };



  // Use a ref to prevent duplicate fetches in React strict mode
  const isFetchingRef = useRef(false);

  // Fetch data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      // Clear data when user is not authenticated
      setClients([]);
      setVendors([]);
      setTasks([]);
      setBudgets([]);
      setInvoices([]);
      setQuotations([]);
      setGuests([]);
      setTables([]);
      setSeatingCharts([]);
      setIsLoading(false);
      return;
    }

    // If already fetching, don't fetch again
    if (isFetchingRef.current) {
      return;
    }

    const fetchData = async () => {
      // Set the fetching flag to prevent duplicate requests
      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        // Only fetch essential client data initially for faster loading
        // This is the most important data for the clients page
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);

        if (clientsError) throw clientsError;

        // Process and set the clients data immediately
        const processedClients = clientsData.map(client => ({
          id: client.id,
          name: client.name,
          partnerName: client.partner_name,
          email: client.email || '',
          phone: client.phone || '',
          weddingDate: client.wedding_date,
          venue: client.venue || '',
          notes: client.notes || '',
          status: client.status || 'active',
          createdAt: client.created_at,
        }));

        // Set clients data first so the UI can render
        setClients(processedClients);

        // Reduce loading indicator time
        setIsLoading(false);

        // Then fetch other data in the background
        // This allows the clients page to render quickly while other data loads

        // Fetch vendors (needed for client details)
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id);

        if (!vendorsError) {
          const processedVendors = vendorsData.map(vendor => ({
            id: vendor.id,
            clientId: vendor.client_id,
            name: vendor.name,
            category: vendor.category,
            contactName: vendor.contact_name || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            website: vendor.website || '',
            notes: vendor.notes || '',
            cost: vendor.cost || 0,
            isPaid: vendor.is_paid || false,
          }));
          setVendors(processedVendors);
        }

        // Fetch tasks (needed for client details)
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        if (!tasksError) {
          const processedTasks = tasksData.map(task => ({
            id: task.id,
            clientId: task.client_id,
            title: task.title,
            description: task.description || '',
            dueDate: task.due_date,
            status: task.status || 'not_started',
            priority: task.priority || 'medium',
            createdAt: task.created_at,
            category: task.category,
          }));
          setTasks(processedTasks);
        }

        // Fetch budgets (needed for client details)
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);

        if (!budgetsError) {
          // Fetch budget categories
          const { data: budgetCategoriesData, error: budgetCategoriesError } = await supabase
            .from('budget_categories')
            .select('*');

          if (!budgetCategoriesError) {
            const processedBudgets = budgetsData.map(budget => {
              // Get categories for this budget
              const budgetCategories = budgetCategoriesData
                .filter(category => category.budget_id === budget.id)
                .map(category => ({
                  id: category.id,
                  category: category.category,
                  allocated: category.allocated,
                  spent: category.spent
                }));

              return {
                id: budget.id,
                clientId: budget.client_id,
                totalBudget: budget.total_budget,
                categories: budgetCategories,
                createdAt: budget.created_at,
                updatedAt: budget.updated_at
              };
            });
            setBudgets(processedBudgets);
          }
        }

        // The rest of the data can be loaded on demand or when needed
        // This approach significantly reduces the initial load time

        // We'll load these in parallel to speed up background loading
        const loadSecondaryData = async () => {
          // Load invoices, quotations, guests, tables, etc. in parallel
          await Promise.allSettled([
            // Fetch invoices with items
            supabase
              .from('invoices')
              .select(`*, invoice_items(*)`)
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedInvoices = data.map(invoice => ({
                    id: invoice.id,
                    clientId: invoice.client_id,
                    invoiceNumber: invoice.number,
                    issueDate: invoice.issue_date,
                    dueDate: invoice.due_date,
                    status: invoice.status,
                    subtotal: invoice.subtotal,
                    tax: invoice.tax,
                    total: invoice.total,
                    notes: invoice.notes,
                    customTitle: invoice.custom_title,
                    legalText: invoice.legal_text,
                    createdAt: invoice.created_at,
                    items: invoice.invoice_items.map((item: any) => ({
                      id: item.id,
                      description: item.description,
                      quantity: item.quantity,
                      unitPrice: item.unit_price,
                      total: item.total
                    }))
                  }));
                  setInvoices(processedInvoices);
                }
              }),

            // Fetch quotations with items
            supabase
              .from('quotations')
              .select(`*, quotation_items(*)`)
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedQuotations = data.map(quotation => ({
                    id: quotation.id,
                    clientId: quotation.client_id,
                    quotationNumber: quotation.number,
                    issueDate: quotation.issue_date,
                    validUntil: quotation.valid_until,
                    status: quotation.status,
                    subtotal: quotation.subtotal,
                    tax: quotation.tax,
                    total: quotation.total,
                    notes: quotation.notes,
                    customTitle: quotation.custom_title,
                    legalText: quotation.legal_text,
                    createdAt: quotation.created_at,
                    items: quotation.quotation_items.map((item: any) => ({
                      id: item.id,
                      description: item.description,
                      quantity: item.quantity,
                      unitPrice: item.unit_price,
                      total: item.total
                    }))
                  }));
                  setQuotations(processedQuotations);
                }
              }),

            // Fetch guests
            supabase
              .from('guests')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedGuests = data.map(guest => {
                    // Parse children from JSON if it exists
                    const children = guest.children ? JSON.parse(guest.children) : [];

                    return {
                      id: guest.id,
                      clientId: guest.client_id,
                      firstName: guest.first_name,
                      lastName: guest.last_name,
                      email: guest.email || '',
                      phone: guest.phone || '',
                      address: guest.address || '',
                      city: guest.city || '',
                      state: guest.state || '',
                      postalCode: guest.postal_code || '',
                      country: guest.country || 'USA',
                      status: guest.status || 'pending',
                      rsvpStatus: guest.rsvp_status || '',
                      mealPreference: guest.meal_preference || '',
                      isCouple: guest.is_couple || false,
                      partnerFirstName: guest.partner_first_name || '',
                      partnerLastName: guest.partner_last_name || '',
                      partnerEmail: guest.partner_email || '',
                      partnerMealPreference: guest.partner_meal_preference || '',
                      hasChildren: guest.has_children || false,
                      children: children,
                      tableId: guest.table_id || undefined,
                      seatPosition: guest.seat_position || undefined,
                      plusOne: guest.plus_one || false,
                      plusOneName: guest.plus_one_name || '',
                      tableAssignment: guest.table_assignment || '',
                      notes: guest.notes || '',
                      createdAt: guest.created_at,
                      updatedAt: guest.updated_at
                    };
                  });
                  setGuests(processedGuests);
                }
              }),

            // Fetch tables and seating charts
            supabase
              .from('tables')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedTables = data.map(table => ({
                    id: table.id,
                    clientId: table.client_id,
                    name: table.name,
                    shape: table.shape,
                    width: table.width,
                    height: table.height,
                    positionX: table.position_x,
                    positionY: table.position_y,
                    capacity: table.capacity,
                    rotation: table.rotation,
                    createdAt: table.created_at,
                    updatedAt: table.updated_at
                  }));
                  setTables(processedTables);
                }
              }),

            // Fetch seating charts
            supabase
              .from('seating_charts')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedSeatingCharts = data.map(chart => ({
                    id: chart.id,
                    clientId: chart.client_id,
                    name: chart.name,
                    width: chart.width,
                    height: chart.height,
                    createdAt: chart.created_at,
                    updatedAt: chart.updated_at
                  }));
                  setSeatingCharts(processedSeatingCharts);
                }
              }),

            // Fetch meal plans
            supabase
              .from('meal_plans')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedMealPlans = data.map(plan => ({
                    id: plan.id,
                    clientId: plan.client_id,
                    name: plan.name,
                    eventDate: plan.event_date,
                    mealType: plan.meal_type,
                    guestCount: plan.guest_count,
                    budgetPerPerson: plan.budget_per_person,
                    location: plan.location || '',
                    season: plan.season || '',
                    culturalRequirements: plan.cultural_requirements || '',
                    preferences: plan.preferences || '',
                    notes: plan.notes || '',
                    createdAt: plan.created_at,
                    updatedAt: plan.updated_at
                  }));
                  setMealPlans(processedMealPlans);
                }
              }),

            // Fetch meal items
            supabase
              .from('meal_items')
              .select('*')
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedMealItems = data.map(item => {
                    // Create a base meal item with required fields
                    const mealItem: MealItem = {
                      id: item.id,
                      mealPlanId: item.meal_plan_id,
                      name: item.name,
                      description: item.description || '',
                      course: item.course,
                      isVegetarian: item.is_vegetarian,
                      isVegan: item.is_vegan,
                      isGlutenFree: item.is_gluten_free,
                      isDairyFree: item.is_dairy_free,
                      isNutFree: item.is_nut_free,
                      containsAlcohol: item.contains_alcohol,
                      estimatedCostPerPerson: item.estimated_cost_per_person,
                      notes: item.notes || '',
                      createdAt: item.created_at,
                      // Set default values for potentially missing fields
                      imageUrl: '',
                      seasonality: [],
                      region: ''
                    };

                    // Add optional fields if they exist in the database
                    if ('image_url' in item) mealItem.imageUrl = item.image_url || '';
                    if ('seasonality' in item) mealItem.seasonality = item.seasonality || [];
                    if ('region' in item) mealItem.region = item.region || '';

                    return mealItem;
                  });
                  setMealItems(processedMealItems);
                }
              }),

            // Fetch contract templates
            supabase
              .from('contract_templates')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedTemplates = data.map(template => ({
                    id: template.id,
                    name: template.name,
                    description: template.description || '',
                    content: template.content,
                    category: template.category,
                    createdAt: template.created_at,
                    updatedAt: template.updated_at
                  }));
                  setContractTemplates(processedTemplates);
                }
              }),

            // Fetch contracts
            supabase
              .from('contracts')
              .select('*')
              .eq('user_id', user.id)
              .then(({ data, error }) => {
                if (!error && data) {
                  const processedContracts = data.map(contract => ({
                    id: contract.id,
                    templateId: contract.template_id,
                    clientId: contract.client_id,
                    vendorId: contract.vendor_id,
                    name: contract.name,
                    content: contract.content,
                    status: contract.status,
                    clientSignature: contract.client_signature,
                    vendorSignature: contract.vendor_signature,
                    plannerSignature: contract.planner_signature,
                    sentAt: contract.sent_at,
                    expiresAt: contract.expires_at,
                    signedAt: contract.signed_at,
                    createdAt: contract.created_at,
                    updatedAt: contract.updated_at
                  }));
                  setContracts(processedContracts);
                }
              }),

            // Design suggestions and related data will be loaded on demand
            // when the user navigates to those pages
          ]);
        };

        // Start loading secondary data in the background
        loadSecondaryData();

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(i18n.t('dashboard.dataLoadingError'));
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Link related data to clients
  useEffect(() => {
    if (clients.length === 0) return;

    const updatedClients = clients.map(client => {
      const clientVendors = vendors.filter(vendor => vendor.clientId === client.id);
      const clientBudget = budgets.find(budget => budget.clientId === client.id);
      const clientTasks = tasks.filter(task => task.clientId === client.id);
      const clientGuests = guests.filter(guest => guest.clientId === client.id);
      const clientTables = tables.filter(table => table.clientId === client.id);
      const clientSeatingCharts = seatingCharts.filter(chart => chart.clientId === client.id);
      const clientMealPlans = mealPlans.filter(plan => plan.clientId === client.id);
      const clientContracts = contracts.filter(contract => contract.clientId === client.id);

      return {
        ...client,
        vendors: clientVendors,
        budget: clientBudget,
        tasks: clientTasks,
        guests: clientGuests,
        tables: clientTables,
        seatingCharts: clientSeatingCharts,
        mealPlans: clientMealPlans,
        contracts: clientContracts,
      };
    });

    setClients(updatedClients);
  }, [vendors, tasks, budgets, guests, tables, seatingCharts, mealPlans, contracts, clients.length]);

  // Add a new design suggestion
  const addDesignSuggestion = async (suggestion: Omit<DesignSuggestion, 'id' | 'createdAt' | 'updatedAt' | 'colorSchemes' | 'decorIdeas' | 'visualizations'>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToAdd'));
      return '';
    }

    try {
      console.log('Creating design suggestion in database:', suggestion);

      const { data, error } = await supabase
        .from('design_suggestions')
        .insert({
          user_id: user.id,
          client_id: suggestion.clientId,
          name: suggestion.name,
          theme: suggestion.theme,
          season: suggestion.season,
          preferences: suggestion.preferences
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating design suggestion:', error);
        throw error;
      }

      console.log('Design suggestion created in database:', data);

      const newSuggestion: DesignSuggestion = {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        theme: data.theme || '',
        season: data.season || '',
        preferences: data.preferences || '',
        colorSchemes: [],
        decorIdeas: [],
        visualizations: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('Adding new suggestion to local state:', newSuggestion);
      console.log('Current designSuggestions state:', designSuggestions);

      // Update the local state with the new suggestion
      setDesignSuggestions(prevSuggestions => {
        const updatedSuggestions = [...prevSuggestions, newSuggestion];
        console.log('Updated designSuggestions state:', updatedSuggestions);
        return updatedSuggestions;
      });

      toast.success(i18n.t('designSuggestions.addSuccess', 'Design suggestion added successfully.'));
      return data.id;
    } catch (error) {
      console.error('Error adding design suggestion:', error);
      toast.error(i18n.t('designSuggestions.addError'));
      return '';
    }
  };

  // Update an existing design suggestion
  const updateDesignSuggestion = async (id: string, updates: Partial<DesignSuggestion>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.season !== undefined) dbUpdates.season = updates.season;
      if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;

      const { error } = await supabase
        .from('design_suggestions')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedSuggestions = designSuggestions.map(suggestion =>
        suggestion.id === id ? { ...suggestion, ...updates } : suggestion
      );
      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.updateSuccess', 'Design suggestion updated successfully.'));
    } catch (error) {
      console.error('Error updating design suggestion:', error);
      toast.error(i18n.t('designSuggestions.updateError'));
    }
  };

  // Delete a design suggestion
  const deleteDesignSuggestion = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToDelete'));
      return;
    }

    try {
      const { error } = await supabase
        .from('design_suggestions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setDesignSuggestions(designSuggestions.filter(suggestion => suggestion.id !== id));
      toast.success(i18n.t('designSuggestions.deleteSuccess', 'Design suggestion deleted successfully.'));
    } catch (error) {
      console.error('Error deleting design suggestion:', error);
      toast.error(i18n.t('designSuggestions.deleteError'));
    }
  };

  // Add a new color scheme
  const addColorScheme = async (colorScheme: Omit<ColorScheme, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToAddColorScheme'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('color_schemes')
        .insert({
          suggestion_id: colorScheme.suggestionId,
          name: colorScheme.name,
          type: colorScheme.type,
          hex_value: colorScheme.hexValue
        })
        .select()
        .single();

      if (error) throw error;

      const newColorScheme: ColorScheme = {
        id: data.id,
        suggestionId: data.suggestion_id,
        name: data.name,
        type: data.type,
        hexValue: data.hex_value,
        createdAt: data.created_at
      };

      // Update the design suggestion with the new color scheme
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.id === colorScheme.suggestionId) {
          return {
            ...suggestion,
            colorSchemes: [...(suggestion.colorSchemes || []), newColorScheme]
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.colorSchemeAdded', 'Color scheme added successfully.'));
    } catch (error) {
      console.error('Error adding color scheme:', error);
      toast.error(i18n.t('designSuggestions.addColorSchemeError'));
    }
  };

  // Delete a color scheme
  const deleteColorScheme = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToDeleteColorScheme'));
      return;
    }

    try {
      const { error } = await supabase
        .from('color_schemes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.colorSchemes) {
          return {
            ...suggestion,
            colorSchemes: suggestion.colorSchemes.filter(scheme => scheme.id !== id)
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.colorSchemeDeleted', 'Color scheme deleted successfully.'));
    } catch (error) {
      console.error('Error deleting color scheme:', error);
      toast.error(i18n.t('designSuggestions.deleteColorSchemeError'));
    }
  };

  // Add a new decor idea
  const addDecorIdea = async (decorIdea: Omit<DecorIdea, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToAddDecorIdea'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('decor_ideas')
        .insert({
          suggestion_id: decorIdea.suggestionId,
          category: decorIdea.category,
          description: decorIdea.description,
          image_url: decorIdea.imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      const newDecorIdea: DecorIdea = {
        id: data.id,
        suggestionId: data.suggestion_id,
        category: data.category,
        description: data.description,
        imageUrl: data.image_url,
        createdAt: data.created_at
      };

      // Update the design suggestion with the new decor idea
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.id === decorIdea.suggestionId) {
          return {
            ...suggestion,
            decorIdeas: [...(suggestion.decorIdeas || []), newDecorIdea]
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.decorIdeaAdded', 'Decor idea added successfully.'));
    } catch (error) {
      console.error('Error adding decor idea:', error);
      toast.error(i18n.t('designSuggestions.addDecorIdeaError'));
    }
  };

  // Delete a decor idea
  const deleteDecorIdea = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToDeleteDecorIdea'));
      return;
    }

    try {
      const { error } = await supabase
        .from('decor_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.decorIdeas) {
          return {
            ...suggestion,
            decorIdeas: suggestion.decorIdeas.filter(idea => idea.id !== id)
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.decorIdeaDeleted', 'Decor idea deleted successfully.'));
    } catch (error) {
      console.error('Error deleting decor idea:', error);
      toast.error(i18n.t('designSuggestions.deleteDecorIdeaError'));
    }
  };

  // Add a new visualization
  const addVisualization = async (visualization: Omit<VisualizationProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToAddVisualization'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('visualization_projects')
        .insert({
          suggestion_id: visualization.suggestionId,
          name: visualization.name,
          venue_image_url: visualization.venueImageUrl,
          modified_image_url: visualization.modifiedImageUrl
        })
        .select()
        .single();

      if (error) throw error;

      const newVisualization: VisualizationProject = {
        id: data.id,
        suggestionId: data.suggestion_id,
        name: data.name,
        venueImageUrl: data.venue_image_url,
        modifiedImageUrl: data.modified_image_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Update the design suggestion with the new visualization
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.id === visualization.suggestionId) {
          return {
            ...suggestion,
            visualizations: [...(suggestion.visualizations || []), newVisualization]
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.visualizationAdded', 'Visualization added successfully.'));
    } catch (error) {
      console.error('Error adding visualization:', error);
      toast.error(i18n.t('designSuggestions.addVisualizationError'));
    }
  };

  // Update an existing visualization
  const updateVisualization = async (id: string, updates: Partial<VisualizationProject>) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToUpdateVisualization'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.venueImageUrl !== undefined) dbUpdates.venue_image_url = updates.venueImageUrl;
      if (updates.modifiedImageUrl !== undefined) dbUpdates.modified_image_url = updates.modifiedImageUrl;

      const { error } = await supabase
        .from('visualization_projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.visualizations) {
          return {
            ...suggestion,
            visualizations: suggestion.visualizations.map(viz =>
              viz.id === id ? { ...viz, ...updates } : viz
            )
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.visualizationUpdated', 'Visualization updated successfully.'));
    } catch (error) {
      console.error('Error updating visualization:', error);
      toast.error(i18n.t('designSuggestions.updateVisualizationError'));
    }
  };

  // Delete a visualization
  const deleteVisualization = async (id: string) => {
    if (!user) {
      toast.error(i18n.t('designSuggestions.loginToDeleteVisualization'));
      return;
    }

    try {
      const { error } = await supabase
        .from('visualization_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedSuggestions = designSuggestions.map(suggestion => {
        if (suggestion.visualizations) {
          return {
            ...suggestion,
            visualizations: suggestion.visualizations.filter(viz => viz.id !== id)
          };
        }
        return suggestion;
      });

      setDesignSuggestions(updatedSuggestions);
      toast.success(i18n.t('designSuggestions.visualizationDeleted', 'Visualization deleted successfully.'));
    } catch (error) {
      console.error('Error deleting visualization:', error);
      toast.error(i18n.t('designSuggestions.deleteVisualizationError'));
    }
  };

  // Add a new meal plan
  const addMealPlan = async (mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt' | 'mealItems'>): Promise<string> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToCreate'));
      throw new Error('User not logged in');
    }

    try {
      const mealPlanId = await addMealPlanOperation(supabase, user.id, mealPlan);

      // Fetch the created meal plan to update local state
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .single();

      if (error) throw error;

      const newMealPlan: MealPlan = {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        eventDate: data.event_date,
        mealType: data.meal_type,
        guestCount: data.guest_count,
        budgetPerPerson: data.budget_per_person,
        location: data.location || '',
        season: data.season || '',
        culturalRequirements: data.cultural_requirements || '',
        preferences: data.preferences || '',
        notes: data.notes || '',
        mealItems: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setMealPlans([...mealPlans, newMealPlan]);
      toast.success(i18n.t('mealPlanning.mealPlanCreated', 'Meal plan created successfully.'));

      return mealPlanId;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      toast.error(i18n.t('mealPlanning.createError'));
      throw error;
    }
  };

  // Update an existing meal plan
  const updateMealPlan = async (mealPlan: MealPlan): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToUpdate'));
      return;
    }

    try {
      await updateMealPlanOperation(supabase, user.id, mealPlan);

      // Update local state
      const updatedMealPlans = mealPlans.map(plan =>
        plan.id === mealPlan.id ? { ...plan, ...mealPlan } : plan
      );

      setMealPlans(updatedMealPlans);
      toast.success(i18n.t('mealPlanning.mealPlanUpdated', 'Meal plan updated successfully.'));
    } catch (error) {
      console.error('Error updating meal plan:', error);
      toast.error(i18n.t('mealPlanning.updateError'));
    }
  };

  // Delete a meal plan
  const deleteMealPlan = async (id: string): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToDelete'));
      return;
    }

    try {
      await deleteMealPlanOperation(supabase, user.id, id);

      // Update local state
      setMealPlans(mealPlans.filter(plan => plan.id !== id));
      setMealItems(mealItems.filter(item => item.mealPlanId !== id));

      toast.success(i18n.t('mealPlanning.mealPlanDeleted', 'Meal plan deleted successfully.'));
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error(i18n.t('mealPlanning.deleteError'));
    }
  };

  // Add a new meal item
  const addMealItem = async (mealItem: Omit<MealItem, 'id' | 'createdAt'>): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToAddItem'));
      return;
    }

    try {
      await addMealItemOperation(supabase, mealItem);

      // Fetch the created meal item to update local state
      const { data, error } = await supabase
        .from('meal_items')
        .select('*')
        .eq('meal_plan_id', mealItem.mealPlanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      // Create a base meal item with required fields
      const newMealItem: MealItem = {
        id: data.id,
        mealPlanId: data.meal_plan_id,
        name: data.name,
        description: data.description || '',
        course: data.course,
        isVegetarian: data.is_vegetarian,
        isVegan: data.is_vegan,
        isGlutenFree: data.is_gluten_free,
        isDairyFree: data.is_dairy_free,
        isNutFree: data.is_nut_free,
        containsAlcohol: data.contains_alcohol,
        estimatedCostPerPerson: data.estimated_cost_per_person,
        notes: data.notes || '',
        createdAt: data.created_at,
        // Set default values for potentially missing fields
        imageUrl: '',
        seasonality: [],
        region: ''
      };

      // Add optional fields if they exist in the database
      if ('image_url' in data) newMealItem.imageUrl = data.image_url || '';
      if ('seasonality' in data) newMealItem.seasonality = data.seasonality || [];
      if ('region' in data) newMealItem.region = data.region || '';

      // Update the meal items state with the new item
      console.log('Adding new meal item to state:', newMealItem);
      console.log('Current meal items state:', mealItems);

      setMealItems(prevItems => {
        const updatedItems = [...prevItems, newMealItem];
        console.log('Updated meal items state:', updatedItems);
        return updatedItems;
      });
    } catch (error) {
      console.error('Error adding meal item:', error);
      toast.error(i18n.t('mealPlanning.addItemError'));
    }
  };

  // Update an existing meal item
  const updateMealItem = async (id: string, updates: Partial<MealItem>): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToUpdateItem'));
      return;
    }

    try {
      await updateMealItemOperation(supabase, id, updates);

      // Update local state
      const updatedMealItems = mealItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );

      setMealItems(updatedMealItems);
      toast.success(i18n.t('mealPlanning.mealItemUpdated', 'Meal item updated successfully.'));
    } catch (error) {
      console.error('Error updating meal item:', error);
      toast.error(i18n.t('mealPlanning.updateItemError'));
    }
  };

  // Delete a meal item
  const deleteMealItem = async (id: string): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('mealPlanning.loginToDeleteItem'));
      return;
    }

    try {
      await deleteMealItemOperation(supabase, id);

      // Update local state
      setMealItems(mealItems.filter(item => item.id !== id));

      toast.success(i18n.t('mealPlanning.mealItemDeleted', 'Meal item deleted successfully.'));
    } catch (error) {
      console.error('Error deleting meal item:', error);
      toast.error(i18n.t('mealPlanning.deleteItemError'));
    }
  };

  // Add a new contract template
  const addContractTemplate = async (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToAddTemplate'));
      return '';
    }

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description || '',
          content: template.content,
          category: template.category
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate: ContractTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        content: data.content,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setContractTemplates([...contractTemplates, newTemplate]);
      toast.success(i18n.t('contracts.templateAddSuccess'));
      return newTemplate.id;
    } catch (error) {
      console.error('Error adding contract template:', error);
      toast.error(i18n.t('contracts.addTemplateError'));
      return '';
    }
  };

  // Update an existing contract template
  const updateContractTemplate = async (id: string, updates: Partial<ContractTemplate>): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToUpdateTemplate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.category !== undefined) dbUpdates.category = updates.category;

      const { error } = await supabase
        .from('contract_templates')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedTemplates = contractTemplates.map(template =>
        template.id === id ? { ...template, ...updates } : template
      );
      setContractTemplates(updatedTemplates);
      toast.success(i18n.t('contracts.templateUpdateSuccess'));
    } catch (error) {
      console.error('Error updating contract template:', error);
      toast.error(i18n.t('contracts.updateTemplateError'));
    }
  };

  // Delete a contract template
  const deleteContractTemplate = async (id: string): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToDeleteTemplate'));
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setContractTemplates(contractTemplates.filter(template => template.id !== id));
      toast.success(i18n.t('contracts.templateDeleteSuccess'));
    } catch (error) {
      console.error('Error deleting contract template:', error);
      toast.error(i18n.t('contracts.deleteTemplateError'));
    }
  };

  // Add a new contract
  const addContract = async (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToAdd'));
      return '';
    }

    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          template_id: contract.templateId,
          client_id: contract.clientId,
          vendor_id: contract.vendorId,
          name: contract.name,
          content: contract.content,
          status: contract.status || 'draft',
          client_signature: contract.clientSignature,
          vendor_signature: contract.vendorSignature,
          planner_signature: contract.plannerSignature,
          sent_at: contract.sentAt,
          expires_at: contract.expiresAt,
          signed_at: contract.signedAt
        })
        .select()
        .single();

      if (error) throw error;

      const newContract: Contract = {
        id: data.id,
        templateId: data.template_id,
        clientId: data.client_id,
        vendorId: data.vendor_id,
        name: data.name,
        content: data.content,
        status: data.status,
        clientSignature: data.client_signature,
        vendorSignature: data.vendor_signature,
        plannerSignature: data.planner_signature,
        sentAt: data.sent_at,
        expiresAt: data.expires_at,
        signedAt: data.signed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setContracts([...contracts, newContract]);
      toast.success(i18n.t('contracts.addSuccess'));
      return newContract.id;
    } catch (error) {
      console.error('Error adding contract:', error);
      toast.error(i18n.t('contracts.addError'));
      return '';
    }
  };

  // Update an existing contract
  const updateContract = async (id: string, updates: Partial<Contract>): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToUpdate'));
      return;
    }

    try {
      // Convert from frontend model to database model
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.clientSignature !== undefined) dbUpdates.client_signature = updates.clientSignature;
      if (updates.vendorSignature !== undefined) dbUpdates.vendor_signature = updates.vendorSignature;
      if (updates.plannerSignature !== undefined) dbUpdates.planner_signature = updates.plannerSignature;
      if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
      if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
      if (updates.signedAt !== undefined) dbUpdates.signed_at = updates.signedAt;

      const { error } = await supabase
        .from('contracts')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedContracts = contracts.map(contract =>
        contract.id === id ? { ...contract, ...updates } : contract
      );
      setContracts(updatedContracts);
      toast.success(i18n.t('contracts.updateSuccess'));
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error(i18n.t('contracts.updateError'));
    }
  };

  // Delete a contract
  const deleteContract = async (id: string): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToDelete'));
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setContracts(contracts.filter(contract => contract.id !== id));
      toast.success(i18n.t('contracts.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error(i18n.t('contracts.deleteError'));
    }
  };

  // Send a contract
  const sendContract = async (id: string): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToSend'));
      return;
    }

    try {
      const contract = contracts.find(c => c.id === id);
      if (!contract) {
        toast.error(i18n.t('contracts.notFound'));
        return;
      }

      // Update the contract status and sent date
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: now
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedContracts = contracts.map(c =>
        c.id === id ? { ...c, status: 'sent' as ContractStatus, sentAt: now } : c
      );
      setContracts(updatedContracts);
      toast.success(i18n.t('contracts.sendSuccess'));
    } catch (error) {
      console.error('Error sending contract:', error);
      toast.error(i18n.t('contracts.sendError'));
    }
  };

  // Sign a contract
  const signContract = async (id: string, signature: Signature, role: 'client' | 'vendor' | 'planner'): Promise<void> => {
    if (!user) {
      toast.error(i18n.t('contracts.loginToSign'));
      return;
    }

    try {
      const contract = contracts.find(c => c.id === id);
      if (!contract) {
        toast.error(i18n.t('contracts.notFound'));
        return;
      }

      // Prepare the update object based on the role
      const updates: any = {};
      if (role === 'client') {
        updates.client_signature = signature;
      } else if (role === 'vendor') {
        updates.vendor_signature = signature;
      } else if (role === 'planner') {
        updates.planner_signature = signature;
      }

      // Check if all required signatures are present
      const updatedContract = { ...contract };
      if (role === 'client') updatedContract.clientSignature = signature;
      if (role === 'vendor') updatedContract.vendorSignature = signature;
      if (role === 'planner') updatedContract.plannerSignature = signature;

      // If this is a client contract (no vendor), we only need client and planner signatures
      const isClientContract = !contract.vendorId;
      const allSigned = isClientContract
        ? (updatedContract.clientSignature && updatedContract.plannerSignature)
        : (updatedContract.clientSignature && updatedContract.vendorSignature && updatedContract.plannerSignature);

      // If all required signatures are present, update the status to 'signed'
      if (allSigned) {
        updates.status = 'signed';
        updates.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedContracts = contracts.map(c => {
        if (c.id === id) {
          const updated = { ...c };
          if (role === 'client') updated.clientSignature = signature;
          if (role === 'vendor') updated.vendorSignature = signature;
          if (role === 'planner') updated.plannerSignature = signature;
          if (allSigned) {
            updated.status = 'signed';
            updated.signedAt = new Date().toISOString();
          }
          return updated;
        }
        return c;
      });

      setContracts(updatedContracts);
      toast.success(i18n.t('contracts.signedBySuccess', { role }));
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error(i18n.t('contracts.signError'));
    }
  };

  return (
    <AppContext.Provider value={{
      clients,
      vendors,
      tasks,
      budgets,
      invoices,
      quotations,
      guests,
      tables,
      seatingCharts,
      designSuggestions,
      mealPlans,
      contracts,
      contractTemplates,
      isLoading,
      getClientById,
      getVendorById,
      getVendorsByClientId,
      getTasksByClientId,
      getBudgetByClientId,
      getInvoicesByClientId,
      getQuotationsByClientId,
      getGuestsByClientId,
      getTablesByClientId,
      getSeatingChartsByClientId,
      getDesignSuggestionsByClientId,
      getMealPlansByClientId,
      getMealItemsByMealPlanId,
      getTasksByStatus,
      getTasksByPriority,
      getTasksByCategory,
      addClient,
      updateClient,
      deleteClient,
      addVendor,
      updateVendor,
      deleteVendor,
      addTask,
      updateTask,
      deleteTask,
      createBudget,
      updateBudget,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      sendInvoice,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      sendQuotation,
      addGuest,
      updateGuest,
      deleteGuest,
      addTable,
      updateTable,
      deleteTable,
      createSeatingChart,
      updateSeatingChart,
      deleteSeatingChart,
      assignGuestToTable,
      removeGuestFromTable,
      autoAssignGuests,
      // Design Suggestions
      addDesignSuggestion,
      updateDesignSuggestion,
      deleteDesignSuggestion,
      addColorScheme,
      deleteColorScheme,
      addDecorIdea,
      deleteDecorIdea,
      addVisualization,
      updateVisualization,
      deleteVisualization,
      // Meal Planning
      addMealPlan,
      updateMealPlan,
      deleteMealPlan,
      addMealItem,
      updateMealItem,
      deleteMealItem,

      // Contract Management
      getContractsByClientId,
      getContractsByVendorId,
      getContractById,
      getContractTemplateById,
      getContractTemplatesByCategory,
      addContractTemplate,
      updateContractTemplate,
      deleteContractTemplate,
      addContract,
      updateContract,
      deleteContract,
      sendContract,
      signContract,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
