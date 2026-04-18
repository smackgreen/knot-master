
import { Budget, Client, Task, Vendor } from "../types";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Current date and time
const now = new Date();

// Mock clients data
export const mockClients: Client[] = [
  {
    id: "c1",
    name: "Emma Johnson",
    partnerName: "Michael Johnson",
    email: "emma.j@example.com",
    phone: "(555) 123-4567",
    weddingDate: new Date(now.getFullYear(), now.getMonth() + 2, 15).toISOString(),
    venue: "Crystal Lake Resort",
    notes: "Outdoor ceremony, indoor reception",
    status: "active",
    createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
  },
  {
    id: "c2",
    name: "Sophia Martinez",
    partnerName: "Daniel Martinez",
    email: "sophia.m@example.com",
    phone: "(555) 234-5678",
    weddingDate: new Date(now.getFullYear(), now.getMonth() + 1, 8).toISOString(),
    venue: "Grand Ballroom Hotel",
    notes: "Evening ceremony, 150 guests",
    status: "active",
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(),
  },
  {
    id: "c3",
    name: "Olivia Wilson",
    partnerName: "James Wilson",
    email: "olivia.w@example.com",
    phone: "(555) 345-6789",
    weddingDate: new Date(now.getFullYear(), now.getMonth() + 4, 22).toISOString(),
    venue: "Sunset Beach Resort",
    notes: "Beach ceremony at sunset",
    status: "active",
    createdAt: new Date(now.getFullYear(), now.getMonth() - 3, 5).toISOString(),
  },
  {
    id: "c4",
    name: "Isabella Thomas",
    partnerName: "Alexander Thomas",
    email: "isabella.t@example.com",
    phone: "(555) 456-7890",
    weddingDate: new Date(now.getFullYear() - 1, 11, 12).toISOString(),
    venue: "Mountain View Lodge",
    notes: "Winter themed wedding",
    status: "completed",
    createdAt: new Date(now.getFullYear() - 1, 5, 15).toISOString(),
  },
  {
    id: "c5",
    name: "Ava Brown",
    partnerName: "William Brown",
    email: "ava.b@example.com",
    phone: "(555) 567-8901",
    weddingDate: new Date(now.getFullYear(), now.getMonth() + 3, 17).toISOString(),
    venue: "Rosewood Manor",
    notes: "Traditional ceremony, modern reception",
    status: "active",
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 28).toISOString(),
  },
];

// Mock vendors data
export const mockVendors: Vendor[] = [
  {
    id: "v1",
    clientId: "c1",
    name: "Elegant Blooms",
    category: "florist",
    contactName: "Laura Chen",
    email: "info@elegantblooms.com",
    phone: "(555) 111-2222",
    website: "www.elegantblooms.com",
    notes: "Specializes in seasonal arrangements",
    cost: 2500,
    isPaid: false,
  },
  {
    id: "v2",
    clientId: "c1",
    name: "Divine Catering",
    category: "catering",
    contactName: "Robert Davis",
    email: "info@divinecatering.com",
    phone: "(555) 222-3333",
    website: "www.divinecatering.com",
    notes: "Farm to table menu",
    cost: 8500,
    isPaid: true,
  },
  {
    id: "v3",
    clientId: "c1",
    name: "Moments Photography",
    category: "photography",
    contactName: "Sarah Johnson",
    email: "sarah@momentsphotos.com",
    phone: "(555) 333-4444",
    website: "www.momentsphotos.com",
    notes: "Documentary style photography",
    cost: 3500,
    isPaid: true,
  },
  {
    id: "v4",
    clientId: "c2",
    name: "Harmony DJ Services",
    category: "music",
    contactName: "David Kim",
    email: "david@harmonydj.com",
    phone: "(555) 444-5555",
    website: "www.harmonydj.com",
    notes: "DJ and live music combo",
    cost: 1800,
    isPaid: true,
  },
  {
    id: "v5",
    clientId: "c2",
    name: "Sweet Creations",
    category: "cake",
    contactName: "Maria Lopez",
    email: "maria@sweetcreations.com",
    phone: "(555) 555-6666",
    website: "www.sweetcreations.com",
    notes: "Gluten-free options available",
    cost: 850,
    isPaid: false,
  },
];

// Mock budgets data
export const mockBudgets: Budget[] = [
  {
    id: "b1",
    clientId: "c1",
    totalBudget: 35000,
    spentSoFar: 14500,
    categories: [
      { category: "venue", allocated: 15000, spent: 7500 },
      { category: "catering", allocated: 10000, spent: 8500 },
      { category: "photography", allocated: 4000, spent: 3500 },
      { category: "florist", allocated: 3000, spent: 0 },
      { category: "music", allocated: 2000, spent: 0 },
      { category: "cake", allocated: 1000, spent: 0 },
    ],
  },
  {
    id: "b2",
    clientId: "c2",
    totalBudget: 25000,
    spentSoFar: 2650,
    categories: [
      { category: "venue", allocated: 12000, spent: 0 },
      { category: "catering", allocated: 7500, spent: 0 },
      { category: "music", allocated: 2000, spent: 1800 },
      { category: "cake", allocated: 800, spent: 850 },
      { category: "photography", allocated: 2700, spent: 0 },
    ],
  },
];

// Mock tasks data
export const mockTasks: Task[] = [
  {
    id: "t1",
    clientId: "c1",
    title: "Book florist",
    description: "Finalize flower arrangements and sign contract",
    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString(),
    status: "in_progress",
    priority: "high",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10).toISOString(),
    category: "florist",
  },
  {
    id: "t2",
    clientId: "c1",
    title: "Order invitations",
    description: "Approve design and send to printer",
    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString(),
    status: "not_started",
    priority: "medium",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(),
    category: "stationery",
  },
  {
    id: "t3",
    clientId: "c2",
    title: "Schedule cake tasting",
    description: "Contact Sweet Creations to set up tasting appointment",
    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString(),
    status: "not_started",
    priority: "medium",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(),
    category: "cake",
  },
  {
    id: "t4",
    clientId: "c2",
    title: "Book photographer",
    description: "Review portfolios and make final decision",
    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(),
    status: "overdue",
    priority: "high",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20).toISOString(),
    category: "photography",
  },
  {
    id: "t5",
    clientId: "c3",
    title: "Venue walkthrough",
    description: "Meet with venue coordinator to discuss layout",
    dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10).toISOString(),
    status: "not_started",
    priority: "high",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString(),
    category: "venue",
  },
  {
    id: "t6",
    clientId: "c1",
    title: "Select menu options",
    description: "Choose appetizers, main courses, and desserts",
    dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString(),
    status: "not_started",
    priority: "medium",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15).toISOString(),
    category: "catering",
  },
  {
    id: "t7",
    clientId: "c3",
    title: "Book DJ",
    description: "Finalize song list and special requests",
    dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 12).toISOString(),
    status: "not_started",
    priority: "medium",
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8).toISOString(),
    category: "music",
  },
];

// Insert mock data into clients
mockClients.forEach(client => {
  const clientVendors = mockVendors.filter(vendor => vendor.clientId === client.id);
  const clientBudget = mockBudgets.find(budget => budget.clientId === client.id);
  const clientTasks = mockTasks.filter(task => task.clientId === client.id);
  
  client.vendors = clientVendors;
  client.budget = clientBudget;
  client.tasks = clientTasks;
});
