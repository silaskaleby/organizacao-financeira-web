export type BillStatus = 'pending' | 'paid';

export interface BillEntryRecord {
  id: string;
  userId: string;
  name: string;
  plannedAmount: number;
  paidAmount: number | null;
  dueDate: string;
  paidDate: string | null;
  status: BillStatus;
  isRecurring: boolean;
  recurrenceSourceId: string | null;
  isCancelled: boolean;
  createdAt: string;
}

export interface RecurringBillTemplateRecord {
  id: string;
  userId: string;
  name: string;
  plannedAmount: number;
  dueDay: number;
  isActive: boolean;
  createdAt: string;
}

export interface BillInput {
  name: string;
  plannedAmount: number;
  dueDate: string;
  isRecurring: boolean;
}

export interface BillOccurrenceInput {
  name: string;
  plannedAmount: number;
  dueDate: string;
}

export interface PayBillInput {
  paidAmount: number;
  paidDate: string;
}

export interface RecurringBillTemplateInput {
  name: string;
  plannedAmount: number;
  dueDay: number;
}

export interface BillsFlowSummary {
  plannedTotal: number;
  pendingTotal: number;
  paidTotal: number;
  pendingCount: number;
  paidCount: number;
  previousPlannedTotal?: number;
  previousPaidTotal?: number;
}
