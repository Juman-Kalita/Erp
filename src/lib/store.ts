// localStorage-based data store replacing Supabase

export type AppRole = 'admin' | 'manager';

// Fixed business unit IDs
export const BU_IDS = {
  tek: 'bu-tek-001',
  strategies: 'bu-strategies-001',
} as const;

function genId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function getList<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function setList<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string;
  email: string;
  role: AppRole;
}

const USERS_KEY = 'solvix_users';
const SESSION_KEY = 'solvix_session';

function getUsers(): (LocalUser & { password: string })[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  // Seed default admin
  const defaults = [{ id: genId(), email: 'admin@solvix.com', password: 'admin123', role: 'admin' as AppRole }];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
  return defaults;
}

export const auth = {
  getSession(): LocalUser | null {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'); } catch { return null; }
  },
  signIn(email: string, password: string): { user: LocalUser | null; error: string | null } {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { user: null, error: 'Invalid email or password' };
    const user: LocalUser = { id: found.id, email: found.email, role: found.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { user, error: null };
  },
  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },
  changePassword(userId: string, newPassword: string): { error: string | null } {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { error: 'User not found' };
    users[idx].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { error: null };
  },
};

// ── Generic CRUD helpers ──────────────────────────────────────────────────────

function listByBu<T extends { id: string; business_unit_id: string }>(key: string, buId: string): T[] {
  return getList<T>(key).filter(r => r.business_unit_id === buId);
}

function insert<T extends { id: string }>(key: string, record: Omit<T, 'id' | 'created_at' | 'updated_at'>): T {
  const list = getList<T>(key);
  const item = { ...record, id: genId(), created_at: now(), updated_at: now() } as unknown as T;
  list.push(item);
  setList(key, list);
  return item;
}

function update<T extends { id: string }>(key: string, id: string, patch: Partial<T>): { error: string | null } {
  const list = getList<T>(key);
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return { error: 'Not found' };
  list[idx] = { ...list[idx], ...patch, updated_at: now() } as T;
  setList(key, list);
  return { error: null };
}

function remove(key: string, id: string) {
  setList(key, getList<{ id: string }>(key).filter(r => r.id !== id));
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string; business_unit_id: string; brand_name: string; email: string;
  phone: string; location: string; category: string; status: string;
  notes: string | null; created_at: string; updated_at: string;
}

export const leads = {
  list: (buId: string) => listByBu<Lead>('solvix_leads', buId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  insert: (data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => insert<Lead>('solvix_leads', data),
  update: (id: string, patch: Partial<Lead>) => update<Lead>('solvix_leads', id, patch),
  delete: (id: string) => remove('solvix_leads', id),
};

// ── Clients ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string; business_unit_id: string; brand_name: string; email: string;
  phone: string; location: string; category: string; billing_label: string;
  onboarded_at: string; notes: string | null; created_at: string; updated_at: string;
}

export const clients = {
  list: (buId: string) => listByBu<Client>('solvix_clients', buId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  listAll: () => getList<Client>('solvix_clients'),
  insert: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => insert<Client>('solvix_clients', data),
  update: (id: string, patch: Partial<Client>) => update<Client>('solvix_clients', id, patch),
  delete: (id: string) => remove('solvix_clients', id),
};

// ── Team Members ──────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string; business_unit_id: string; name: string; designation: string;
  email: string; phone: string | null; employment_label: string;
  joined_at: string; photo_url: string | null; created_at: string; updated_at: string;
}

export const teamMembers = {
  list: (buId: string) => listByBu<TeamMember>('solvix_team', buId).sort((a, b) => a.name.localeCompare(b.name)),
  insert: (data: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) => insert<TeamMember>('solvix_team', data),
  update: (id: string, patch: Partial<TeamMember>) => update<TeamMember>('solvix_team', id, patch),
  delete: (id: string) => remove('solvix_team', id),
};

// ── Projects ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string; business_unit_id: string; name: string; company_name: string;
  contact_person: string; contact_email: string; contact_phone: string | null;
  status_label: string | null; billing_label: string | null;
  start_date: string | null; deadline: string | null; description: string | null;
  created_at: string; updated_at: string;
}

export const projects = {
  list: (buId: string) => listByBu<Project>('solvix_projects', buId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  insert: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => insert<Project>('solvix_projects', data),
  update: (id: string, patch: Partial<Project>) => update<Project>('solvix_projects', id, patch),
  delete: (id: string) => remove('solvix_projects', id),
};

// ── Expense Tools ─────────────────────────────────────────────────────────────

export interface ExpenseTool {
  id: string; business_unit_id: string; name: string; amount: number;
  billing_cycle: string; start_date: string; end_date: string;
  category: string | null; notes: string | null; created_at: string; updated_at: string;
}

export const expenseTools = {
  list: (buId: string) => listByBu<ExpenseTool>('solvix_expenses', buId).sort((a, b) => a.end_date.localeCompare(b.end_date)),
  listAll: () => getList<ExpenseTool>('solvix_expenses'),
  insert: (data: Omit<ExpenseTool, 'id' | 'created_at' | 'updated_at'>) => insert<ExpenseTool>('solvix_expenses', data),
  update: (id: string, patch: Partial<ExpenseTool>) => update<ExpenseTool>('solvix_expenses', id, patch),
  delete: (id: string) => remove('solvix_expenses', id),
};

// ── Assets ────────────────────────────────────────────────────────────────────

export interface Asset {
  id: string; business_unit_id: string; name: string; use_purpose: string;
  price: number; purchase_date: string | null; condition: string | null;
  assigned_to: string | null; notes: string | null; created_at: string; updated_at: string;
}

export const assets = {
  list: (buId: string) => listByBu<Asset>('solvix_assets', buId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  listAll: () => getList<Asset>('solvix_assets'),
  insert: (data: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => insert<Asset>('solvix_assets', data),
  update: (id: string, patch: Partial<Asset>) => update<Asset>('solvix_assets', id, patch),
  delete: (id: string) => remove('solvix_assets', id),
};

// ── Buy List ──────────────────────────────────────────────────────────────────

export interface BuyItem {
  id: string; business_unit_id: string; name: string; estimated_price: number;
  purpose: string; priority: string; requested_by: string | null;
  status: string; created_at: string; updated_at: string;
}

export const buyList = {
  list: (buId: string) => listByBu<BuyItem>('solvix_buylist', buId),
  insert: (data: Omit<BuyItem, 'id' | 'created_at' | 'updated_at'>) => insert<BuyItem>('solvix_buylist', data),
  update: (id: string, patch: Partial<BuyItem>) => update<BuyItem>('solvix_buylist', id, patch),
  delete: (id: string) => remove('solvix_buylist', id),
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string; business_unit_id: string; client_id: string; invoice_number: string;
  invoice_date: string; due_date: string; subtotal: number; tax_percent: number;
  discount: number; total: number; status: string; notes: string | null;
  created_at: string; updated_at: string;
}

export interface InvoiceItem {
  id: string; invoice_id: string; description: string;
  quantity: number; rate: number; amount: number; created_at: string;
}

export const invoices = {
  list: (buId: string) => {
    const invList = listByBu<Invoice>('solvix_invoices', buId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const allClients = getList<Client>('solvix_clients');
    return invList.map(inv => ({
      ...inv,
      clients: allClients.find(c => c.id === inv.client_id) ?? null,
    }));
  },
  listAll: () => getList<Invoice>('solvix_invoices'),
  insert: (data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Invoice => insert<Invoice>('solvix_invoices', data),
  update: (id: string, patch: Partial<Invoice>) => update<Invoice>('solvix_invoices', id, patch),
  delete: (id: string) => {
    remove('solvix_invoices', id);
    setList('solvix_invoice_items', getList<InvoiceItem>('solvix_invoice_items').filter(i => i.invoice_id !== id));
  },
  insertItems: (items: Omit<InvoiceItem, 'id' | 'created_at'>[]) => {
    const list = getList<InvoiceItem>('solvix_invoice_items');
    const newItems = items.map(i => ({ ...i, id: genId(), created_at: now() }));
    setList('solvix_invoice_items', [...list, ...newItems]);
  },
  deleteItems: (invoiceId: string) => {
    setList('solvix_invoice_items', getList<InvoiceItem>('solvix_invoice_items').filter(i => i.invoice_id !== invoiceId));
  },
};

// ── Invoice Reminders ─────────────────────────────────────────────────────────

export const invoiceReminders = {
  insert: (data: { invoice_id: string; sent_to_email: string; message: string }) => {
    const list = getList<typeof data & { id: string; sent_at: string }>('solvix_reminders');
    list.push({ ...data, id: genId(), sent_at: now() });
    setList('solvix_reminders', list);
  },
};
