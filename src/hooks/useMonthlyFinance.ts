import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateMonthlyBalance,
  emptyMonthlyBalanceSummary,
  type MonthlyBalanceSummary,
} from '../services/balanceService';
import {
  cancelRecurringBillMonth,
  createBill,
  deleteStandaloneBill,
  ensureRecurringBillOccurrences,
  fetchBills,
  fetchRecurringBillTemplate,
  payBill,
  stopRepeatingAfterCurrentMonth,
  updateBillOccurrence,
  updateRecurringBillSeries,
} from '../services/billService';
import {
  createExpenseEntry,
  deleteExpenseEntry,
  fetchExpenseEntries,
  updateExpenseEntry,
} from '../services/expenseService';
import {
  confirmSalaryIncomeEntry,
  createManualIncomeEntry,
  deleteManualIncomeEntry,
  ensureMonthlySalaryEntry,
  fetchIncomeEntries,
  updateManualIncomeEntry,
} from '../services/incomeService';
import {
  buildReserveInvestmentSummaries,
  buildInvestmentOverview,
  createReserveInvestmentEntry,
  createEmptyInvestmentOverview,
  deleteReserveInvestmentEntry,
  fetchReserveInvestmentEntries,
  fetchReserveInvestmentEntriesThrough,
  updateReserveInvestmentEntry,
} from '../services/reserveInvestmentService';
import { reserveInvestmentTypeOptions } from '../data/reserveInvestmentCatalog';
import type { ExpenseEntryInput, ExpenseEntryRecord } from '../types/expense';
import type { IncomeEntryInput, IncomeEntryRecord, SalaryConfirmationInput } from '../types/income';
import type { UserSettingsProfile } from '../types/profile';
import type {
  ReserveInvestmentEntryInput,
  ReserveInvestmentEntryRecord,
  InvestmentOverview,
  ReserveInvestmentTypeSummary,
} from '../types/reserveInvestment';
import type {
  BillEntryRecord,
  BillInput,
  BillOccurrenceInput,
  PayBillInput,
  RecurringBillTemplateInput,
} from '../types/bill';
import {
  getPeriodFromDate,
  getPreviousMonth,
  isDateInPeriod,
  isPeriodBefore,
  type FinancePeriod,
} from '../utils/financeDates';

interface UseMonthlyFinanceArgs {
  userId: string;
  profile: UserSettingsProfile;
  period: FinancePeriod;
}

export function useMonthlyFinance({ userId, profile, period }: UseMonthlyFinanceArgs) {
  const controlStart = useMemo(() => getPeriodFromDate(profile.createdAt), [profile.createdAt]);
  const isBeforeControlStart = isPeriodBefore(period, controlStart);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntryRecord[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntryRecord[]>([]);
  const [billEntries, setBillEntries] = useState<BillEntryRecord[]>([]);
  const [previousBillEntries, setPreviousBillEntries] = useState<BillEntryRecord[]>([]);
  const [reserveInvestmentEntries, setReserveInvestmentEntries] = useState<ReserveInvestmentEntryRecord[]>([]);
  const [reserveInvestmentSummaries, setReserveInvestmentSummaries] = useState<ReserveInvestmentTypeSummary[]>(() =>
    buildReserveInvestmentSummaries([], [], reserveInvestmentTypeOptions),
  );
  const [investmentOverview, setInvestmentOverview] = useState<InvestmentOverview>(() => createEmptyInvestmentOverview());
  const [balance, setBalance] = useState<MonthlyBalanceSummary>(() => emptyMonthlyBalanceSummary());
  const [previousBalance, setPreviousBalance] = useState<MonthlyBalanceSummary>(() => emptyMonthlyBalanceSummary());
  const [loading, setLoading] = useState(true);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadMonth = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const canUpdate = () => mountedRef.current && requestIdRef.current === requestId;

    if (!mountedRef.current) return;

    setError('');
    setLoading(true);
    setSalaryLoading(false);
    setIncomeEntries([]);
    setExpenseEntries([]);
    setBillEntries([]);
    setPreviousBillEntries([]);
    setReserveInvestmentEntries([]);
    setReserveInvestmentSummaries(buildReserveInvestmentSummaries([], [], reserveInvestmentTypeOptions));
    setInvestmentOverview(createEmptyInvestmentOverview());

    if (isBeforeControlStart) {
      if (canUpdate()) {
        setBalance(emptyMonthlyBalanceSummary());
        setPreviousBalance(emptyMonthlyBalanceSummary());
        setLoading(false);
      }
      return;
    }

    try {
      setSalaryLoading(true);
      await ensureMonthlySalaryEntry(userId, profile, period, controlStart);
      await ensureRecurringBillOccurrences(userId, period, controlStart);
      if (!canUpdate()) return;
      setSalaryLoading(false);

      const previousPeriod = getPreviousMonth(period);
      const shouldLoadPrevious = !isPeriodBefore(previousPeriod, controlStart);
      const [
        entries,
        expenses,
        bills,
        previousBills,
        reserves,
        accumulatedReserves,
        balanceSummary,
        previousBalanceSummary,
      ] = await Promise.all([
        fetchIncomeEntries(userId, period),
        fetchExpenseEntries(userId, period),
        fetchBills(userId, period),
        shouldLoadPrevious ? fetchBills(userId, previousPeriod) : Promise.resolve([]),
        fetchReserveInvestmentEntries(userId, period),
        fetchReserveInvestmentEntriesThrough(userId, period, controlStart),
        calculateMonthlyBalance(userId, profile, controlStart, period),
        shouldLoadPrevious
          ? calculateMonthlyBalance(userId, profile, controlStart, previousPeriod)
          : Promise.resolve(emptyMonthlyBalanceSummary()),
      ]);

      if (!canUpdate()) return;
      setIncomeEntries(entries);
      setExpenseEntries(expenses);
      setBillEntries(bills);
      setPreviousBillEntries(previousBills);
      setReserveInvestmentEntries(reserves);
      setReserveInvestmentSummaries(
        buildReserveInvestmentSummaries(reserves, accumulatedReserves, reserveInvestmentTypeOptions),
      );
      setInvestmentOverview(buildInvestmentOverview(reserves, accumulatedReserves, controlStart, period));
      setBalance(balanceSummary);
      setPreviousBalance(previousBalanceSummary);
    } catch {
      if (canUpdate()) {
        setIncomeEntries([]);
        setExpenseEntries([]);
        setBillEntries([]);
        setPreviousBillEntries([]);
        setReserveInvestmentEntries([]);
        setReserveInvestmentSummaries(buildReserveInvestmentSummaries([], [], reserveInvestmentTypeOptions));
        setInvestmentOverview(createEmptyInvestmentOverview());
        setBalance(emptyMonthlyBalanceSummary());
        setPreviousBalance(emptyMonthlyBalanceSummary());
        setError('Não foi possível carregar os dados financeiros deste mês.');
      }
    } finally {
      if (canUpdate()) {
        setSalaryLoading(false);
        setLoading(false);
      }
    }
  }, [controlStart, isBeforeControlStart, period, profile, userId]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const assertValidDate = useCallback((date: string, kind: 'entradas' | 'gastos' | 'contas' | 'reservas e investimentos') => {
    if (!isDateInPeriod(date, period)) {
      throw new Error('A data precisa estar dentro do mês selecionado.');
    }
    if (isBeforeControlStart) {
      throw new Error(`Não é possível lançar ${kind} antes do início do controle financeiro.`);
    }
  }, [isBeforeControlStart, period]);

  const createIncome = useCallback(async (input: IncomeEntryInput) => {
    assertValidDate(input.entryDate, 'entradas');
    await createManualIncomeEntry(userId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const updateIncome = useCallback(async (entryId: string, input: IncomeEntryInput) => {
    assertValidDate(input.entryDate, 'entradas');
    await updateManualIncomeEntry(userId, entryId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const deleteIncome = useCallback(async (entryId: string) => {
    await deleteManualIncomeEntry(userId, entryId);
    await loadMonth();
  }, [loadMonth, userId]);

  const confirmSalary = useCallback(async (entryId: string, input: SalaryConfirmationInput) => {
    assertValidDate(input.entryDate, 'entradas');
    await confirmSalaryIncomeEntry(userId, entryId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const createExpense = useCallback(async (input: ExpenseEntryInput) => {
    assertValidDate(input.expenseDate, 'gastos');
    await createExpenseEntry(userId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const updateExpense = useCallback(async (entryId: string, input: ExpenseEntryInput) => {
    assertValidDate(input.expenseDate, 'gastos');
    await updateExpenseEntry(userId, entryId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const deleteExpense = useCallback(async (entryId: string) => {
    await deleteExpenseEntry(userId, entryId);
    await loadMonth();
  }, [loadMonth, userId]);

  const createBillEntry = useCallback(async (input: BillInput) => {
    assertValidDate(input.dueDate, 'contas');
    await createBill(userId, input, period);
    await loadMonth();
  }, [assertValidDate, loadMonth, period, userId]);

  const updateBillEntry = useCallback(async (billId: string, input: BillOccurrenceInput) => {
    assertValidDate(input.dueDate, 'contas');
    await updateBillOccurrence(userId, billId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const payBillEntry = useCallback(async (billId: string, input: PayBillInput) => {
    if (!input.paidDate) throw new Error('Informe a data do pagamento.');
    if (isPeriodBefore(getPeriodFromDate(input.paidDate), controlStart)) {
      throw new Error('A data do pagamento não pode ser anterior ao início do controle financeiro.');
    }
    await payBill(userId, billId, input);
    await loadMonth();
  }, [controlStart, loadMonth, userId]);

  const deleteBillEntry = useCallback(async (billId: string) => {
    await deleteStandaloneBill(userId, billId);
    await loadMonth();
  }, [loadMonth, userId]);

  const getRecurringBillTemplate = useCallback(async (templateId: string) => {
    return fetchRecurringBillTemplate(userId, templateId);
  }, [userId]);

  const updateRecurringBill = useCallback(async (
    templateId: string,
    fromDueDate: string,
    input: RecurringBillTemplateInput,
  ) => {
    await updateRecurringBillSeries(userId, templateId, fromDueDate, input);
    await loadMonth();
  }, [loadMonth, userId]);

  const cancelBillMonth = useCallback(async (billId: string) => {
    await cancelRecurringBillMonth(userId, billId);
    await loadMonth();
  }, [loadMonth, userId]);

  const stopRecurringBill = useCallback(async (templateId: string, currentDueDate: string) => {
    await stopRepeatingAfterCurrentMonth(userId, templateId, currentDueDate);
    await loadMonth();
  }, [loadMonth, userId]);

  const createReserveInvestment = useCallback(async (input: ReserveInvestmentEntryInput) => {
    assertValidDate(input.entryDate, 'reservas e investimentos');
    await createReserveInvestmentEntry(userId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const updateReserveInvestment = useCallback(async (entryId: string, input: ReserveInvestmentEntryInput) => {
    assertValidDate(input.entryDate, 'reservas e investimentos');
    await updateReserveInvestmentEntry(userId, entryId, input);
    await loadMonth();
  }, [assertValidDate, loadMonth, userId]);

  const deleteReserveInvestment = useCallback(async (entryId: string) => {
    await deleteReserveInvestmentEntry(userId, entryId);
    await loadMonth();
  }, [loadMonth, userId]);

  return {
    controlStart,
    isBeforeControlStart,
    incomeEntries,
    expenseEntries,
    billEntries,
    previousBillEntries,
    reserveInvestmentEntries,
    reserveInvestmentSummaries,
    investmentOverview,
    balance,
    previousBalance,
    loading,
    salaryLoading,
    error,
    reload: loadMonth,
    createIncome,
    updateIncome,
    deleteIncome,
    confirmSalary,
    createExpense,
    updateExpense,
    deleteExpense,
    createBill: createBillEntry,
    updateBill: updateBillEntry,
    payBill: payBillEntry,
    deleteBill: deleteBillEntry,
    getRecurringBillTemplate,
    updateRecurringBill,
    cancelBillMonth,
    stopRecurringBill,
    createReserveInvestment,
    updateReserveInvestment,
    deleteReserveInvestment,
  };
}
