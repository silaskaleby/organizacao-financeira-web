export type ReserveInvestmentType =
  | 'main_goal'
  | 'emergency_reserve'
  | 'fixed_income'
  | 'variable_income'
  | 'physical_investment'
  | 'crypto'
  | 'currency_fund';

export interface ReserveInvestmentEntryRecord {
  id: string;
  userId: string;
  name: string;
  type: ReserveInvestmentType;
  amount: number;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReserveInvestmentEntryInput {
  type: ReserveInvestmentType;
  amount: number;
  entryDate: string;
  name?: string | null;
}

export interface ReserveInvestmentTypeSummary {
  type: ReserveInvestmentType;
  label: string;
  tone: string;
  description: string;
  monthlyAmount: number;
  totalAmount: number;
}

export interface MonthlyInvestmentTypeTotal {
  type: ReserveInvestmentType;
  label: string;
  tone: string;
  description: string;
  amount: number;
}

export interface InvestmentHistoryItem {
  key: string;
  label: string;
  monthlyAmount: number;
  cumulativeAmount: number;
}

export interface InvestmentOverview {
  monthlyInvestmentsByType: MonthlyInvestmentTypeTotal[];
  monthlyInvestedTotal: number;
  cumulativeInvestedTotal: number;
  investmentHistory: InvestmentHistoryItem[];
}
