import { supabase } from '../lib/supabase';
import type { ExpensePaymentMethod } from '../types/expense';
import type { IncomeEntryRecord } from '../types/income';
import type { UserSettingsProfile } from '../types/profile';
import {
  eachMonthBetween,
  getMonthRange,
  getPeriodFromDate,
  getPeriodKey,
  type FinancePeriod,
} from '../utils/financeDates';

export interface MonthlyBalanceSummary {
  openingBalance: number;
  receivedIncomeTotal: number;
  benefitsReceivedTotal: number;
  foodAllowanceReceivedTotal: number;
  mealAllowanceReceivedTotal: number;
  effectiveExpensesTotal: number;
  debitTotal: number;
  creditTotal: number;
  benefitsUsedTotal: number;
  foodAllowanceUsedTotal: number;
  mealAllowanceUsedTotal: number;
  foodAllowanceBalance: number;
  mealAllowanceBalance: number;
  paidBillsTotal: number;
  reserveInvestmentTotal: number;
  closingBalance: number;
}

interface IncomeRow {
  type: IncomeEntryRecord['type'];
  amount: number | string;
  entry_date: string;
  status: IncomeEntryRecord['status'];
}

interface ExpenseRow {
  amount: number | string;
  expense_date: string;
  payment_method: ExpensePaymentMethod;
}

interface BillRow {
  status: 'pending' | 'paid';
  paid_amount: number | string | null;
  paid_date: string | null;
  is_cancelled: boolean;
}

interface ReserveInvestmentRow {
  amount: number | string;
  entry_date: string;
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
};

export const emptyMonthlyBalanceSummary = (): MonthlyBalanceSummary => ({
  openingBalance: 0,
  receivedIncomeTotal: 0,
  benefitsReceivedTotal: 0,
  foodAllowanceReceivedTotal: 0,
  mealAllowanceReceivedTotal: 0,
  effectiveExpensesTotal: 0,
  debitTotal: 0,
  creditTotal: 0,
  benefitsUsedTotal: 0,
  foodAllowanceUsedTotal: 0,
  mealAllowanceUsedTotal: 0,
  foodAllowanceBalance: 0,
  mealAllowanceBalance: 0,
  paidBillsTotal: 0,
  reserveInvestmentTotal: 0,
  closingBalance: 0,
});

const addByMonth = (map: Map<string, number>, key: string, amount: number) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

export async function calculateMonthlyBalance(
  userId: string,
  profile: UserSettingsProfile,
  controlStart: FinancePeriod,
  selectedPeriod: FinancePeriod,
) {
  const client = requireSupabase();
  const selectedRange = getMonthRange(selectedPeriod);
  const startDate = getMonthRange(controlStart).start;
  const endDate = selectedRange.end;

  const [incomeResult, expensesResult, billsResult, reservesResult] = await Promise.all([
    client
      .from('income_entries')
      .select('type,amount,entry_date,status')
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate),
    client
      .from('expense_entries')
      .select('payment_method,amount,expense_date')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate),
    client
      .from('bills')
      .select('status,paid_amount,paid_date,is_cancelled')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .eq('is_cancelled', false)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate),
    client
      .from('reserve_investment_entries')
      .select('amount,entry_date')
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate),
  ]);

  if (incomeResult.error) throw incomeResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (billsResult.error) throw billsResult.error;
  if (reservesResult.error) throw reservesResult.error;

  const incomeByMonth = new Map<string, number>();
  const benefitsByMonth = new Map<string, number>();
  const foodAllowanceReceivedByMonth = new Map<string, number>();
  const mealAllowanceReceivedByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();
  const debitByMonth = new Map<string, number>();
  const creditByMonth = new Map<string, number>();
  const foodAllowanceUsedByMonth = new Map<string, number>();
  const mealAllowanceUsedByMonth = new Map<string, number>();
  const billsByMonth = new Map<string, number>();
  const reservesByMonth = new Map<string, number>();

  for (const row of (incomeResult.data ?? []) as IncomeRow[]) {
    if (row.status !== 'received') continue;
    const key = getPeriodKey(getPeriodFromDate(row.entry_date));
    const amount = Number(row.amount);

    if (row.type === 'food_allowance') {
      addByMonth(benefitsByMonth, key, amount);
      addByMonth(foodAllowanceReceivedByMonth, key, amount);
    } else if (row.type === 'meal_allowance') {
      addByMonth(benefitsByMonth, key, amount);
      addByMonth(mealAllowanceReceivedByMonth, key, amount);
    } else {
      addByMonth(incomeByMonth, key, amount);
    }
  }

  for (const row of (expensesResult.data ?? []) as ExpenseRow[]) {
    const key = getPeriodKey(getPeriodFromDate(row.expense_date));
    const amount = Number(row.amount);

    if (row.payment_method === 'pix_cash' || row.payment_method === 'debit' || row.payment_method === 'past_credit') {
      addByMonth(expensesByMonth, key, amount);
    }
    if (row.payment_method === 'debit') addByMonth(debitByMonth, key, amount);
    if (row.payment_method === 'credit') addByMonth(creditByMonth, key, amount);
    if (row.payment_method === 'food_allowance') addByMonth(foodAllowanceUsedByMonth, key, amount);
    if (row.payment_method === 'meal_allowance') addByMonth(mealAllowanceUsedByMonth, key, amount);
  }

  for (const row of (billsResult.data ?? []) as BillRow[]) {
    if (row.is_cancelled || row.status !== 'paid' || !row.paid_date || row.paid_amount === null) continue;
    const key = getPeriodKey(getPeriodFromDate(row.paid_date));
    addByMonth(billsByMonth, key, Number(row.paid_amount));
  }

  for (const row of (reservesResult.data ?? []) as ReserveInvestmentRow[]) {
    const key = getPeriodKey(getPeriodFromDate(row.entry_date));
    addByMonth(reservesByMonth, key, Number(row.amount));
  }

  let openingBalance = profile.initialBalance;
  let foodAllowanceBalance = 0;
  let mealAllowanceBalance = 0;
  let selectedSummary = emptyMonthlyBalanceSummary();

  for (const period of eachMonthBetween(controlStart, selectedPeriod)) {
    const key = getPeriodKey(period);
    const receivedIncomeTotal = incomeByMonth.get(key) ?? 0;
    const benefitsReceivedTotal = benefitsByMonth.get(key) ?? 0;
    const foodAllowanceReceivedTotal = foodAllowanceReceivedByMonth.get(key) ?? 0;
    const mealAllowanceReceivedTotal = mealAllowanceReceivedByMonth.get(key) ?? 0;
    const effectiveExpensesTotal = expensesByMonth.get(key) ?? 0;
    const foodAllowanceUsedTotal = foodAllowanceUsedByMonth.get(key) ?? 0;
    const mealAllowanceUsedTotal = mealAllowanceUsedByMonth.get(key) ?? 0;
    const benefitsUsedTotal = foodAllowanceUsedTotal + mealAllowanceUsedTotal;
    const paidBillsTotal = billsByMonth.get(key) ?? 0;
    const reserveInvestmentTotal = reservesByMonth.get(key) ?? 0;
    const closingBalance =
      openingBalance + receivedIncomeTotal - effectiveExpensesTotal - paidBillsTotal - reserveInvestmentTotal;

    foodAllowanceBalance += foodAllowanceReceivedTotal - foodAllowanceUsedTotal;
    mealAllowanceBalance += mealAllowanceReceivedTotal - mealAllowanceUsedTotal;

    if (getPeriodKey(period) === getPeriodKey(selectedPeriod)) {
      selectedSummary = {
        openingBalance,
        receivedIncomeTotal,
        benefitsReceivedTotal,
        foodAllowanceReceivedTotal,
        mealAllowanceReceivedTotal,
        effectiveExpensesTotal,
        debitTotal: debitByMonth.get(key) ?? 0,
        creditTotal: creditByMonth.get(key) ?? 0,
        benefitsUsedTotal,
        foodAllowanceUsedTotal,
        mealAllowanceUsedTotal,
        foodAllowanceBalance,
        mealAllowanceBalance,
        paidBillsTotal,
        reserveInvestmentTotal,
        closingBalance,
      };
    }

    openingBalance = closingBalance;
  }

  return selectedSummary;
}
