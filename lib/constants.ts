import { CategoryInfo, ExpenseCategoryKey } from './types';

export const CATEGORIES: Record<ExpenseCategoryKey, CategoryInfo> = {
  Groceries: {
    key: 'Groceries',
    name: 'Groceries',
    iconName: 'ShoppingBag',
    color: '#16A34A',
    bgLight: '#DCFCE7',
  },
  Food: {
    key: 'Food',
    name: 'Food & Dining',
    iconName: 'Utensils',
    color: '#EA580C',
    bgLight: '#FFEDD5',
  },
  Fuel: {
    key: 'Fuel',
    name: 'Fuel & Commute',
    iconName: 'Fuel',
    color: '#2563EB',
    bgLight: '#DBEAFE',
  },
  Medical: {
    key: 'Medical',
    name: 'Medical & Health',
    iconName: 'Activity',
    color: '#DC2626',
    bgLight: '#FEE2E2',
  },
  Shopping: {
    key: 'Shopping',
    name: 'Shopping',
    iconName: 'Shirt',
    color: '#9333EA',
    bgLight: '#F3E8FF',
  },
  Utilities: {
    key: 'Utilities',
    name: 'Bills & Utilities',
    iconName: 'Zap',
    color: '#D97706',
    bgLight: '#FEF3C7',
  },
  Education: {
    key: 'Education',
    name: 'Education',
    iconName: 'GraduationCap',
    color: '#0D9488',
    bgLight: '#CCFBF1',
  },
  Travel: {
    key: 'Travel',
    name: 'Travel & Vacation',
    iconName: 'Plane',
    color: '#0284C7',
    bgLight: '#E0F2FE',
  },
  Entertainment: {
    key: 'Entertainment',
    name: 'Entertainment',
    iconName: 'Film',
    color: '#DB2777',
    bgLight: '#FCE7F3',
  },
  Others: {
    key: 'Others',
    name: 'Others',
    iconName: 'MoreHorizontal',
    color: '#6B7280',
    bgLight: '#F3F4F6',
  },
};

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'AED', symbol: 'AED ', label: 'AED' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
];

export const DEFAULT_CURRENCY = '₹';

// Demo seed data for instant preview
export const DEFAULT_FAMILY_NAME = 'Sharma Family';
export const DEFAULT_INVITE_CODE = 'FAM-SH7890';
