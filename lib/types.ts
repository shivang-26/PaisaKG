export type Role = 'Admin' | 'Member';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  geminiApiKey?: string;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  monthlyBudget?: number;
  currency: string;
  geminiApiKey?: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  joinedAt: string;
}

export interface ExpenseItem {
  name: string;
  qty?: number;
  price?: number;
}

export interface Expense {
  id: string;
  familyId: string;
  createdBy: string; // Member/User ID who created it
  createdByName: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryKey;
  merchant: string;
  expenseDate: string; // YYYY-MM-DD
  notes?: string;
  receiptImage?: string; // base64 or URL
  items?: ExpenseItem[];
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export type ExpenseCategoryKey =
  | 'Groceries'
  | 'Food'
  | 'Fuel'
  | 'Medical'
  | 'Shopping'
  | 'Utilities'
  | 'Education'
  | 'Travel'
  | 'Entertainment'
  | 'Others';

export interface CategoryInfo {
  key: ExpenseCategoryKey;
  name: string;
  iconName: string;
  color: string;
  bgLight: string;
}

export interface OCRItemResult {
  name: string;
  qty?: number;
  price?: number;
}

export interface OCRResult {
  merchant: string;
  totalAmount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategoryKey;
  tax?: number;
  receiptNumber?: string;
  items: OCRItemResult[];
  confidenceScore: number; // 0 to 100
  confidenceNotes?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE';
  data: any;
  timestamp: string;
}

export interface ActiveSessionInfo {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  familyId?: string;
  familyName?: string;
  role?: string;
  status: 'active' | 'left';
  lastActiveAt: string;
  leftAt?: string;
  deviceInfo?: string;
  totalExpensesCount?: number;
  totalAmountSpent?: number;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  category: 'info' | 'alert' | 'budget' | 'system';
  targetAudience: 'ALL' | 'ACTIVE_ONLY' | 'FAMILY' | 'USER';
  targetId?: string;
  actionUrl?: string;
  sentAt: string;
  sentBy: string;
}

