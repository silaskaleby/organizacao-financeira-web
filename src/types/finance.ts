import type { LucideIcon } from 'lucide-react';
import type { BillStatus } from './bill';
import type { ExpenseCategory, ExpensePaymentMethod } from './expense';
import type { IncomeEntrySource, IncomeEntryStatus, IncomeEntryType } from './income';
import type { ReserveInvestmentType as ReserveInvestmentTypeValue } from './reserveInvestment';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface UserProfile {
  todayLabel: string;
  name: string;
  motto: string;
  selectedMonth: string;
  selectedYear: number;
}

export interface SummaryCardData {
  id: string;
  title: string;
  value: number;
  previousLabel: string;
  previousValue: number;
  previousAvailable?: boolean;
  secondaryLabel?: string;
  secondaryValue?: number;
  trend: TrendDirection;
  icon: LucideIcon;
  tone: 'income' | 'expense' | 'benefit' | 'debit' | 'credit';
}

export interface GoalCardData {
  title: string;
  headline: string;
  target: number;
  reservedThisMonth: number;
  totalReserved: number;
  missing: number;
  reached?: boolean;
}

export interface RemainingToSpendData {
  available: number;
  used: number;
}

export interface BillsFlowData {
  name: string;
  planned: number;
  real: number;
  pending?: number;
}

export interface CategoryAllocationData {
  category: string;
  amount: number;
}

export interface IncomeEntry {
  id: string;
  type: string;
  typeValue?: IncomeEntryType;
  amount: number;
  percentage: number | null;
  percentageLabel?: string;
  chipTone: string;
  status?: IncomeEntryStatus;
  statusLabel?: string;
  source?: IncomeEntrySource;
  entryDate?: string;
  notes?: string | null;
  includedInBalance?: boolean;
  confirmAvailable?: boolean;
  confirmUnavailableReason?: string;
}

export interface ExpenseEntry {
  id: string;
  category: string;
  categoryValue?: ExpenseCategory;
  description?: string;
  paymentMethod: string;
  paymentMethodValue?: ExpensePaymentMethod;
  amount: number;
  date: string;
  expenseDate?: string;
  essential: boolean;
}

export interface BillEntry {
  id: string;
  name: string;
  planned: number;
  real: number;
  dueDate?: string;
  paidDate: string;
  status: BillStatus;
  recurring: boolean;
  recurrenceSourceId?: string | null;
  dueDay?: number;
  subtitle?: string;
}

export interface ReserveInvestmentEntry {
  id: string;
  name: string;
  typeValue?: ReserveInvestmentTypeValue;
  type: string;
  amount: number;
  date: string;
  entryDate?: string;
}

export interface ReserveInvestmentType {
  name: string;
  tone: string;
}
