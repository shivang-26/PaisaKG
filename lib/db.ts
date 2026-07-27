import Dexie, { Table } from 'dexie';
import { Expense, Family, FamilyMember, SyncQueueItem, UserProfile } from './types';
import { DEFAULT_FAMILY_NAME, DEFAULT_INVITE_CODE } from './constants';

export class FamilyExpenseTrackerDB extends Dexie {
  users!: Table<UserProfile, string>;
  families!: Table<Family, string>;
  family_members!: Table<FamilyMember, string>;
  expenses!: Table<Expense, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super('FamilyExpenseTrackerDB');
    this.version(1).stores({
      users: 'id, email',
      families: 'id, inviteCode',
      family_members: 'id, familyId, userId',
      expenses: 'id, familyId, createdBy, category, expenseDate',
      sync_queue: 'id, timestamp',
    });
  }
}

export const db = new FamilyExpenseTrackerDB();

// Helper to seed initial family and expenses if needed
export async function seedInitialData() {
  // Production fresh start - no mock data pre-populated
  return;
}
