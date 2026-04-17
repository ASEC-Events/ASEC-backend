export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  department: string;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

export interface Finance {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: number;
  type: 'income' | 'expense';
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id: string;
  title: string;
  date: number;
  location: string;
  attendees: string[];
  description: string;
  createdAt: number;
  updatedAt: number;
}

export const COLLECTIONS = {
  STAFF: 'staff',
  FINANCE: 'finance',
  EVENTS: 'events',
} as const;
