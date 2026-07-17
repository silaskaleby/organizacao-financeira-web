import { expenseCategoryLabels } from '../components/expenses/expenseLabels';
import type { BillsFlowSummary } from '../types/bill';
import type { BillEntryRecord } from '../types/bill';
import type { ExpenseEntryRecord } from '../types/expense';
import type {
  BillsFlowData,
  CategoryAllocationData,
  GoalCardData,
  RemainingToSpendData,
  TrendDirection,
} from '../types/finance';
import type { UserSettingsProfile } from '../types/profile';
import type { ReserveInvestmentType, ReserveInvestmentTypeSummary } from '../types/reserveInvestment';
import { getPreviousMonth, isPeriodBefore, type FinancePeriod } from '../utils/financeDates';
import type { MonthlyBalanceSummary } from './balanceService';

export interface DashboardMetrics {
  totalIncome: number;
  previousMonthIncome: number;
  effectiveExpenses: number;
  previousMonthEffectiveExpenses: number;
  debitTotal: number;
  previousMonthDebitTotal: number;
  creditTotal: number;
  previousMonthCreditTotal: number;
  receivedBenefits: number;
  previousMonthReceivedBenefits: number;
  usedBenefits: number;
  previousMonthUsedBenefits: number;
  paidBills: number;
  previousMonthPaidBills: number;
  reserveInvestmentContributions: number;
  openingBalance: number;
  closingBalance: number;
  hasPreviousFinancialMonth: boolean;
  remainingToSpend: RemainingToSpendData;
  billsFlowSummary: BillsFlowSummary;
  billsFlow: BillsFlowData[];
  categoryAllocation: CategoryAllocationData[];
  mainGoalProgress: GoalCardData;
  emergencyReserveProgress: GoalCardData;
  monthlyInvestedTotal: number;
  cumulativeInvestedTotal: number;
}

const getTrend = (current: number, previous: number): TrendDirection => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

const getReserveSummary = (
  summaries: ReserveInvestmentTypeSummary[],
  type: ReserveInvestmentType,
) => summaries.find((summary) => summary.type === type);

const buildGoalCard = (
  title: string,
  headline: string,
  target: number,
  initialAmount: number,
  type: ReserveInvestmentType,
  summaries: ReserveInvestmentTypeSummary[],
): GoalCardData => {
  const summary = getReserveSummary(summaries, type);
  const totalReserved = initialAmount + (summary?.totalAmount ?? 0);
  const missing = Math.max(target - totalReserved, 0);

  return {
    title,
    headline,
    target,
    reservedThisMonth: summary?.monthlyAmount ?? 0,
    totalReserved,
    missing,
    reached: target > 0 && totalReserved >= target,
  };
};

const buildBillsFlowSummary = (
  billEntries: BillEntryRecord[],
  previousBillEntries: BillEntryRecord[],
): BillsFlowSummary => {
  const current = billEntries.reduce(
    (summary, bill) => {
      summary.plannedTotal += bill.plannedAmount;
      if (bill.status === 'paid') {
        summary.paidTotal += bill.paidAmount ?? 0;
        summary.paidCount += 1;
      } else {
        summary.pendingTotal += bill.plannedAmount;
        summary.pendingCount += 1;
      }
      return summary;
    },
    { plannedTotal: 0, pendingTotal: 0, paidTotal: 0, pendingCount: 0, paidCount: 0 },
  );
  const previous = previousBillEntries.reduce(
    (summary, bill) => {
      summary.plannedTotal += bill.plannedAmount;
      if (bill.status === 'paid') summary.paidTotal += bill.paidAmount ?? 0;
      return summary;
    },
    { plannedTotal: 0, paidTotal: 0 },
  );

  return {
    ...current,
    previousPlannedTotal: previous.plannedTotal,
    previousPaidTotal: previous.paidTotal,
  };
};

const buildBillsFlowData = (billEntries: BillEntryRecord[], summary: BillsFlowSummary): BillsFlowData[] => {
  if (billEntries.length === 0) return [];

  return [
    { name: 'Planejado', planned: summary.plannedTotal, real: 0, pending: 0 },
    { name: 'Pago', planned: 0, real: summary.paidTotal, pending: 0 },
    { name: 'Pendente', planned: 0, real: 0, pending: summary.pendingTotal },
  ];
};

const buildCategoryAllocation = (expenseEntries: ExpenseEntryRecord[]): CategoryAllocationData[] => {
  const totals = new Map<string, number>();
  for (const entry of expenseEntries) {
    const label = expenseCategoryLabels[entry.category];
    totals.set(label, (totals.get(label) ?? 0) + entry.amount);
  }

  return Array.from(totals, ([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount);
};

export const buildDashboardMetrics = ({
  profile,
  selectedPeriod,
  controlStart,
  balance,
  previousBalance,
  billEntries,
  previousBillEntries,
  expenseEntries,
  reserveInvestmentSummaries,
  monthlyInvestedTotal,
  cumulativeInvestedTotal,
}: {
  profile: UserSettingsProfile;
  selectedPeriod: FinancePeriod;
  controlStart: FinancePeriod;
  balance: MonthlyBalanceSummary;
  previousBalance: MonthlyBalanceSummary;
  billEntries: BillEntryRecord[];
  previousBillEntries: BillEntryRecord[];
  expenseEntries: ExpenseEntryRecord[];
  reserveInvestmentSummaries: ReserveInvestmentTypeSummary[];
  monthlyInvestedTotal: number;
  cumulativeInvestedTotal: number;
}): DashboardMetrics => {
  const previousPeriod = getPreviousMonth(selectedPeriod);
  const hasPreviousFinancialMonth = !isPeriodBefore(previousPeriod, controlStart);
  const effectiveExpenses = balance.effectiveExpensesTotal + balance.paidBillsTotal;
  const previousMonthEffectiveExpenses =
    previousBalance.effectiveExpensesTotal + previousBalance.paidBillsTotal;
  const billsFlowSummary = buildBillsFlowSummary(billEntries, previousBillEntries);
  const reserveInvestmentContributions = balance.reserveInvestmentTotal;

  return {
    totalIncome: balance.receivedIncomeTotal,
    previousMonthIncome: hasPreviousFinancialMonth ? previousBalance.receivedIncomeTotal : 0,
    effectiveExpenses,
    previousMonthEffectiveExpenses: hasPreviousFinancialMonth ? previousMonthEffectiveExpenses : 0,
    debitTotal: balance.debitTotal,
    previousMonthDebitTotal: hasPreviousFinancialMonth ? previousBalance.debitTotal : 0,
    creditTotal: balance.creditTotal,
    previousMonthCreditTotal: hasPreviousFinancialMonth ? previousBalance.creditTotal : 0,
    receivedBenefits: balance.benefitsReceivedTotal,
    previousMonthReceivedBenefits: hasPreviousFinancialMonth ? previousBalance.benefitsReceivedTotal : 0,
    usedBenefits: balance.benefitsUsedTotal,
    previousMonthUsedBenefits: hasPreviousFinancialMonth ? previousBalance.benefitsUsedTotal : 0,
    paidBills: balance.paidBillsTotal,
    previousMonthPaidBills: hasPreviousFinancialMonth ? previousBalance.paidBillsTotal : 0,
    reserveInvestmentContributions,
    openingBalance: balance.openingBalance,
    closingBalance: balance.closingBalance,
    hasPreviousFinancialMonth,
    remainingToSpend: {
      available: balance.closingBalance,
      used: effectiveExpenses + reserveInvestmentContributions,
    },
    billsFlowSummary,
    billsFlow: buildBillsFlowData(billEntries, billsFlowSummary),
    categoryAllocation: buildCategoryAllocation(expenseEntries),
    mainGoalProgress: buildGoalCard(
      'Meta principal',
      profile.mainGoalName || 'Meta principal',
      profile.mainGoalTargetAmount,
      profile.mainGoalInitialAmount,
      'main_goal',
      reserveInvestmentSummaries,
    ),
    emergencyReserveProgress: buildGoalCard(
      'Reserva de emergencia',
      'Meta geral',
      profile.emergencyReserveTargetAmount,
      profile.emergencyReserveInitialAmount,
      'emergency_reserve',
      reserveInvestmentSummaries,
    ),
    monthlyInvestedTotal,
    cumulativeInvestedTotal,
  };
};

export const getMetricTrend = (current: number, previous: number, hasPreviousFinancialMonth: boolean) =>
  hasPreviousFinancialMonth ? getTrend(current, previous) : 'flat';
