export type IncomeEntryType =
  | 'salary'
  | 'extra_income'
  | 'recurring_income'
  | 'food_allowance'
  | 'meal_allowance'
  | 'other';

export type IncomeEntryStatus = 'planned' | 'received';

export type IncomeEntrySource = 'manual' | 'salary';

export interface IncomeEntryRecord {
  id: string;
  userId: string;
  type: IncomeEntryType;
  amount: number;
  entryDate: string;
  status: IncomeEntryStatus;
  source: IncomeEntrySource;
  notes: string | null;
}

export interface IncomeEntryInput {
  type: IncomeEntryType;
  amount: number;
  entryDate: string;
  status: IncomeEntryStatus;
  notes?: string | null;
}

export interface SalaryConfirmationInput {
  amount: number;
  entryDate: string;
}
