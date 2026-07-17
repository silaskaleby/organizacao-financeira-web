import { BadgeDollarSign, CreditCard, Landmark, ReceiptText, RotateCcw, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BillsFlowChart } from '../charts/BillsFlowChart';
import { CategoryAllocationChart } from '../charts/CategoryAllocationChart';
import { RemainingToSpendChart } from '../charts/RemainingToSpendChart';
import { BillFormModal } from '../bills/BillFormModal';
import { CancelRecurringBillDialog } from '../bills/CancelRecurringBillDialog';
import { DeleteBillDialog } from '../bills/DeleteBillDialog';
import { PayBillModal } from '../bills/PayBillModal';
import { RecurrenceSettingsModal } from '../bills/RecurrenceSettingsModal';
import { StopRepeatingBillDialog } from '../bills/StopRepeatingBillDialog';
import { DeleteExpenseDialog } from '../expenses/DeleteExpenseDialog';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import {
  expenseCategoryLabels,
  paymentMethodLabels,
} from '../expenses/expenseLabels';
import { ConfirmDeleteDialog } from '../income/ConfirmDeleteDialog';
import { IncomeEntryModal } from '../income/IncomeEntryModal';
import { getIncomeTone, incomeStatusLabels, incomeTypeLabels } from '../income/incomeLabels';
import { SalaryConfirmationModal } from '../income/SalaryConfirmationModal';
import { CollapsibleCharts } from '../mobile/CollapsibleCharts';
import { MobileFinanceLists } from '../mobile/MobileFinanceLists';
import { MobileSummary } from '../mobile/MobileSummary';
import { UpcomingBills } from '../mobile/UpcomingBills';
import { DeleteReserveInvestmentDialog } from '../reserves/DeleteReserveInvestmentDialog';
import { ReserveInvestmentFormModal } from '../reserves/ReserveInvestmentFormModal';
import { BillsTable } from '../tables/BillsTable';
import { ExpenseTable } from '../tables/ExpenseTable';
import { IncomeTable } from '../tables/IncomeTable';
import { ReserveInvestmentTable } from '../tables/ReserveInvestmentTable';
import {
  reserveInvestmentTypeConfig,
  reserveInvestmentTypeOptions,
} from '../../data/reserveInvestmentCatalog';
import { useMonthlyFinance } from '../../hooks/useMonthlyFinance';
import {
  buildDashboardMetrics,
  getMetricTrend,
  type DashboardMetrics,
} from '../../services/dashboardMetricsService';
import type { BillEntryRecord, RecurringBillTemplateRecord } from '../../types/bill';
import type { ExpenseEntryRecord } from '../../types/expense';
import type {
  BillEntry,
  ExpenseEntry,
  IncomeEntry,
  ReserveInvestmentEntry,
  SummaryCardData,
} from '../../types/finance';
import type { IncomeEntryRecord } from '../../types/income';
import type { UserSettingsProfile } from '../../types/profile';
import type { ReserveInvestmentEntryRecord } from '../../types/reserveInvestment';
import { formatCurrency } from '../../utils/formatters';
import {
  comparePeriods,
  formatDateBR,
  getAvailableYears,
  getCurrentPeriod,
  getMonthLabel,
  getPeriodFromDate,
  getTodayLabel,
  isPeriodBefore,
  monthNames,
  toDateString,
  type FinancePeriod,
} from '../../utils/financeDates';
import { DashboardHeader } from './DashboardHeader';
import { EmergencyReserveCard } from './EmergencyReserveCard';
import { MainGoalCard } from './MainGoalCard';
import { MonthNavigator } from './MonthNavigator';
import { SummaryCards } from './SummaryCards';
import { YearSelector } from './YearSelector';

interface FinanceDashboardProps {
  profile: UserSettingsProfile;
  userId: string;
  onOpenSettings: () => void;
  onSignOut: () => void;
  signingOut?: boolean;
}

type IncomeModalState =
  | { type: 'create' }
  | { type: 'edit'; entry: IncomeEntryRecord }
  | { type: 'confirm-salary'; entry: IncomeEntryRecord }
  | { type: 'delete'; entry: IncomeEntryRecord }
  | null;

type ExpenseModalState =
  | { type: 'create' }
  | { type: 'edit'; entry: ExpenseEntryRecord }
  | { type: 'delete'; entry: ExpenseEntryRecord }
  | null;

type BillModalState =
  | { type: 'create' }
  | { type: 'edit'; entry: BillEntryRecord }
  | { type: 'pay'; entry: BillEntryRecord }
  | { type: 'delete'; entry: BillEntryRecord }
  | { type: 'edit-series'; entry: BillEntryRecord; template: RecurringBillTemplateRecord }
  | { type: 'cancel-month'; entry: BillEntryRecord }
  | { type: 'stop-repeating'; entry: BillEntryRecord }
  | null;

type ReserveInvestmentModalState =
  | { type: 'create' }
  | { type: 'edit'; entry: ReserveInvestmentEntryRecord }
  | { type: 'delete'; entry: ReserveInvestmentEntryRecord }
  | null;

const getTodayDateString = () => {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
};

const getManualDefaultStatus = (period: FinancePeriod) =>
  comparePeriods(period, getCurrentPeriod()) > 0 ? 'planned' : 'received';

const createSummaryCards = (metrics: DashboardMetrics): SummaryCardData[] => {
  const previousLabel = metrics.hasPreviousFinancialMonth ? 'Mes anterior' : 'Sem mes anterior';

  return [
    {
      id: 'income',
      title: 'Total | Entradas',
      value: metrics.totalIncome,
      previousLabel,
      previousValue: metrics.previousMonthIncome,
      previousAvailable: metrics.hasPreviousFinancialMonth,
      trend: getMetricTrend(metrics.totalIncome, metrics.previousMonthIncome, metrics.hasPreviousFinancialMonth),
      icon: BadgeDollarSign,
      tone: 'income',
    },
    {
      id: 'expenses',
      title: 'Total | Saídas',
      value: metrics.effectiveExpenses,
      previousLabel,
      previousValue: metrics.previousMonthEffectiveExpenses,
      previousAvailable: metrics.hasPreviousFinancialMonth,
      trend: getMetricTrend(
        metrics.effectiveExpenses,
        metrics.previousMonthEffectiveExpenses,
        metrics.hasPreviousFinancialMonth,
      ),
      icon: ReceiptText,
      tone: 'expense',
    },
    {
      id: 'benefits',
      title: 'Total | VA/VR',
      value: metrics.receivedBenefits,
      previousLabel,
      previousValue: metrics.previousMonthReceivedBenefits,
      previousAvailable: metrics.hasPreviousFinancialMonth,
      secondaryLabel: 'Usado este mes',
      secondaryValue: metrics.usedBenefits,
      trend: getMetricTrend(
        metrics.receivedBenefits,
        metrics.previousMonthReceivedBenefits,
        metrics.hasPreviousFinancialMonth,
      ),
      icon: Utensils,
      tone: 'benefit',
    },
    {
      id: 'debit',
      title: 'Total | Débito',
      value: metrics.debitTotal,
      previousLabel,
      previousValue: metrics.previousMonthDebitTotal,
      previousAvailable: metrics.hasPreviousFinancialMonth,
      trend: getMetricTrend(metrics.debitTotal, metrics.previousMonthDebitTotal, metrics.hasPreviousFinancialMonth),
      icon: Landmark,
      tone: 'debit',
    },
    {
      id: 'credit',
      title: 'Total | Crédito',
      value: metrics.creditTotal,
      previousLabel,
      previousValue: metrics.previousMonthCreditTotal,
      previousAvailable: metrics.hasPreviousFinancialMonth,
      trend: getMetricTrend(metrics.creditTotal, metrics.previousMonthCreditTotal, metrics.hasPreviousFinancialMonth),
      icon: CreditCard,
      tone: 'credit',
    },
  ];
};

export function FinanceDashboard({
  profile,
  userId,
  onOpenSettings,
  onSignOut,
  signingOut = false,
}: FinanceDashboardProps) {
  const controlStart = useMemo(() => getPeriodFromDate(profile.createdAt), [profile.createdAt]);
  const [selectedPeriod, setSelectedPeriod] = useState<FinancePeriod>(() => {
    const current = getCurrentPeriod();
    return isPeriodBefore(current, controlStart) ? controlStart : current;
  });
  const [incomeModal, setIncomeModal] = useState<IncomeModalState>(null);
  const [expenseModal, setExpenseModal] = useState<ExpenseModalState>(null);
  const [billModal, setBillModal] = useState<BillModalState>(null);
  const [reserveInvestmentModal, setReserveInvestmentModal] = useState<ReserveInvestmentModalState>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isPeriodBefore(selectedPeriod, controlStart)) {
      setSelectedPeriod(controlStart);
    }
  }, [controlStart, selectedPeriod]);

  const monthlyFinance = useMonthlyFinance({ userId, profile, period: selectedPeriod });
  const dashboardMetrics = useMemo(
    () => buildDashboardMetrics({
      profile,
      selectedPeriod,
      controlStart,
      balance: monthlyFinance.balance,
      previousBalance: monthlyFinance.previousBalance,
      billEntries: monthlyFinance.billEntries,
      previousBillEntries: monthlyFinance.previousBillEntries,
      expenseEntries: monthlyFinance.expenseEntries,
      reserveInvestmentSummaries: monthlyFinance.reserveInvestmentSummaries,
      monthlyInvestedTotal: monthlyFinance.investmentOverview.monthlyInvestedTotal,
      cumulativeInvestedTotal: monthlyFinance.investmentOverview.cumulativeInvestedTotal,
    }),
    [
      controlStart,
      monthlyFinance.balance,
      monthlyFinance.billEntries,
      monthlyFinance.expenseEntries,
      monthlyFinance.investmentOverview.cumulativeInvestedTotal,
      monthlyFinance.investmentOverview.monthlyInvestedTotal,
      monthlyFinance.previousBalance,
      monthlyFinance.previousBillEntries,
      monthlyFinance.reserveInvestmentSummaries,
      profile,
      selectedPeriod,
    ],
  );
  const selectedMonthLabel = getMonthLabel(selectedPeriod);
  const years = useMemo(() => getAvailableYears(controlStart), [controlStart]);
  const disabledMonths = useMemo(() => {
    const disabled = new Set<number>();
    if (selectedPeriod.year === controlStart.year) {
      for (let month = 1; month < controlStart.month; month += 1) {
        disabled.add(month);
      }
    }
    return disabled;
  }, [controlStart, selectedPeriod.year]);

  const displayProfile = useMemo(
    () => ({
      todayLabel: getTodayLabel(),
      name: profile.displayName || 'Usuario',
      motto: `Dados reais de ${selectedMonthLabel.toLowerCase()} de ${selectedPeriod.year}.`,
      selectedMonth: selectedMonthLabel,
      selectedYear: selectedPeriod.year,
    }),
    [profile.displayName, selectedMonthLabel, selectedPeriod.year],
  );

  const todayDate = getTodayDateString();

  const displayIncomeEntries: IncomeEntry[] = monthlyFinance.incomeEntries.map((entry) => {
    const isBenefit = entry.type === 'food_allowance' || entry.type === 'meal_allowance';
    const includedInBalance = entry.status === 'received' && !isBenefit;
    const canConfirmSalary = entry.source === 'salary' && entry.status === 'planned' && todayDate >= entry.entryDate;
    const percentage =
      entry.status === 'received' && !isBenefit && dashboardMetrics.totalIncome > 0
        ? (entry.amount / dashboardMetrics.totalIncome) * 100
        : null;

    return {
      id: entry.id,
      type: incomeTypeLabels[entry.type],
      typeValue: entry.type,
      amount: entry.amount,
      percentage,
      percentageLabel:
        entry.status === 'planned'
          ? 'Planejada'
          : isBenefit
            ? 'Benefício'
            : dashboardMetrics.totalIncome > 0
              ? undefined
              : '-',
      chipTone: getIncomeTone(entry.type),
      status: entry.status,
      statusLabel: incomeStatusLabels[entry.status],
      source: entry.source,
      entryDate: entry.entryDate,
      notes: entry.notes,
      includedInBalance,
      confirmAvailable: canConfirmSalary,
      confirmUnavailableReason: canConfirmSalary
        ? undefined
        : `Disponível para confirmação a partir de ${formatDateBR(entry.entryDate)}.`,
    };
  });

  const displayExpenseEntries: ExpenseEntry[] = monthlyFinance.expenseEntries.map((entry) => ({
    id: entry.id,
    category: expenseCategoryLabels[entry.category],
    categoryValue: entry.category,
    description: entry.description ?? undefined,
    paymentMethod: paymentMethodLabels[entry.paymentMethod],
    paymentMethodValue: entry.paymentMethod,
    amount: entry.amount,
    date: formatDateBR(entry.expenseDate),
    expenseDate: entry.expenseDate,
    essential: entry.isEssential,
  }));

  const displayBillEntries: BillEntry[] = monthlyFinance.billEntries.map((entry) => {
    const dueDay = Number(entry.dueDate.slice(8, 10));
    return {
      id: entry.id,
      name: entry.name,
      planned: entry.plannedAmount,
      real: entry.paidAmount ?? 0,
      dueDate: formatDateBR(entry.dueDate),
      paidDate: entry.paidDate ? formatDateBR(entry.paidDate) : '-',
      status: entry.status,
      recurring: entry.isRecurring,
      recurrenceSourceId: entry.recurrenceSourceId,
      dueDay,
      subtitle: entry.isRecurring ? `Recorrente • todo dia ${dueDay}` : 'Avulsa',
    };
  });

  const reserveInvestmentTypes = reserveInvestmentTypeOptions.map((type) => ({
    name: type.label,
    tone: type.tone,
  }));

  const displayReserveInvestmentEntries: ReserveInvestmentEntry[] = monthlyFinance.reserveInvestmentEntries.map((entry) => {
    const config = reserveInvestmentTypeConfig[entry.type];
    return {
      id: entry.id,
      name: entry.name === 'Aporte' ? '' : entry.name,
      typeValue: entry.type,
      type: config.label,
      amount: entry.amount,
      date: formatDateBR(entry.entryDate),
      entryDate: entry.entryDate,
    };
  });

  const summaryCards = useMemo(() => createSummaryCards(dashboardMetrics), [dashboardMetrics]);

  const findIncomeRecord = (entry: IncomeEntry) =>
    monthlyFinance.incomeEntries.find((record) => record.id === entry.id) ?? null;

  const findExpenseRecord = (entry: ExpenseEntry) =>
    monthlyFinance.expenseEntries.find((record) => record.id === entry.id) ?? null;

  const findBillRecord = (entry: BillEntry) =>
    monthlyFinance.billEntries.find((record) => record.id === entry.id) ?? null;

  const findReserveInvestmentRecord = (entry: ReserveInvestmentEntry) =>
    monthlyFinance.reserveInvestmentEntries.find((record) => record.id === entry.id) ?? null;

  const closeModal = () => {
    setIncomeModal(null);
    setExpenseModal(null);
    setBillModal(null);
    setReserveInvestmentModal(null);
  };

  const handleSuccess = async (message: string) => {
    closeModal();
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const monthLocked = monthlyFinance.isBeforeControlStart;
  const controlStartMessage = `Seu controle financeiro começou em ${getMonthLabel(controlStart).toLowerCase()} de ${controlStart.year}.`;
  const openingBalanceLabel = comparePeriods(selectedPeriod, controlStart) === 0 ? 'Saldo inicial' : 'Saldo anterior';
  const dataLoading = monthlyFinance.loading || monthlyFinance.salaryLoading;

  const openSeriesEditModal = async (bill: BillEntry) => {
    if (!bill.recurrenceSourceId) return;
    const record = findBillRecord(bill);
    if (!record) return;
    try {
      const template = await monthlyFinance.getRecurringBillTemplate(bill.recurrenceSourceId);
      setBillModal({ type: 'edit-series', entry: record, template });
    } catch {
      setToast('Não foi possível carregar a repetição.');
      window.setTimeout(() => setToast(''), 2600);
    }
  };

  return (
    <main className="app-shell">
      <section className="finance-board" aria-label={`Painel financeiro de ${selectedMonthLabel} de ${selectedPeriod.year}`}>
        {toast ? <p className="dashboard-toast form-message form-message-success">{toast}</p> : null}
        {monthlyFinance.error ? (
          <div className="dashboard-error" role="alert">
            <span>{monthlyFinance.error}</span>
            <button type="button" onClick={monthlyFinance.reload}>
              <RotateCcw size={15} />
              Tentar novamente
            </button>
          </div>
        ) : null}
        {monthLocked ? <p className="dashboard-info">{controlStartMessage}</p> : null}

        <div className="dashboard-top">
          <aside className="dashboard-sidebar" aria-label="Resumo pessoal, metas e reservas">
            <DashboardHeader
              profile={displayProfile}
              onOpenSettings={onOpenSettings}
              onSignOut={onSignOut}
              signingOut={signingOut}
            />
            <EmergencyReserveCard reserve={dashboardMetrics.emergencyReserveProgress} />
            <MainGoalCard goal={dashboardMetrics.mainGoalProgress} />
          </aside>

          <div className="dashboard-main">
            <SummaryCards cards={summaryCards} creditUsed={dashboardMetrics.creditTotal} />

            <div className="balance-strip" aria-label="Saldo mensal">
              <div>
                <span>{openingBalanceLabel}</span>
                <strong>{formatCurrency(dashboardMetrics.openingBalance)}</strong>
              </div>
              <div>
                <span>Entradas recebidas</span>
                <strong>{formatCurrency(dashboardMetrics.totalIncome)}</strong>
              </div>
              <div>
                <span>Saldo disponível</span>
                <strong className={dashboardMetrics.closingBalance < 0 ? 'negative-balance' : undefined}>
                  {formatCurrency(dashboardMetrics.closingBalance)}
                </strong>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-panel chart-panel-large">
                <RemainingToSpendChart data={dashboardMetrics.remainingToSpend} />
              </div>

              <div className="chart-panel">
                <BillsFlowChart data={dashboardMetrics.billsFlow} summary={dashboardMetrics.billsFlowSummary} />
              </div>

              <div className="chart-panel">
                <CategoryAllocationChart data={dashboardMetrics.categoryAllocation} />
              </div>
            </div>
          </div>
        </div>

        <div className="mobile-dashboard">
          <DashboardHeader
            profile={displayProfile}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
            signingOut={signingOut}
          />

          <div className="mobile-month-panel" aria-label="Navegação mensal">
            <YearSelector
              selectedYear={selectedPeriod.year}
              years={years}
              onSelectYear={(year) => setSelectedPeriod((current) => ({ ...current, year }))}
            />
            <MonthNavigator
              months={monthNames}
              selectedMonth={selectedMonthLabel}
              disabledMonths={disabledMonths}
              onSelectMonth={(month) => setSelectedPeriod((current) => ({ ...current, month }))}
            />
          </div>

          <MobileSummary
            cards={summaryCards}
            remainingToSpend={dashboardMetrics.remainingToSpend}
            creditUsed={dashboardMetrics.creditTotal}
          />

          <div className="mobile-goals">
            <MainGoalCard goal={dashboardMetrics.mainGoalProgress} />
            <EmergencyReserveCard reserve={dashboardMetrics.emergencyReserveProgress} />
          </div>

          <UpcomingBills bills={displayBillEntries} />

          <MobileFinanceLists
            incomeEntries={displayIncomeEntries}
            expenses={displayExpenseEntries}
            bills={displayBillEntries}
            reserveInvestments={displayReserveInvestmentEntries}
            reserveInvestmentTypes={reserveInvestmentTypes}
            reserveInvestmentSummaries={monthlyFinance.reserveInvestmentSummaries}
            investmentOverview={monthlyFinance.investmentOverview}
            onAddIncome={() => setIncomeModal({ type: 'create' })}
            onEditIncome={(entry) => {
              const record = findIncomeRecord(entry);
              if (record) setIncomeModal({ type: 'edit', entry: record });
            }}
            onDeleteIncome={(entry) => {
              const record = findIncomeRecord(entry);
              if (record) setIncomeModal({ type: 'delete', entry: record });
            }}
            onConfirmSalary={(entry) => {
              const record = findIncomeRecord(entry);
              if (record && entry.confirmAvailable) setIncomeModal({ type: 'confirm-salary', entry: record });
            }}
            incomeActionDisabled={monthLocked}
            incomeLoading={dataLoading}
            onAddExpense={() => setExpenseModal({ type: 'create' })}
            onEditExpense={(entry) => {
              const record = findExpenseRecord(entry);
              if (record) setExpenseModal({ type: 'edit', entry: record });
            }}
            onDeleteExpense={(entry) => {
              const record = findExpenseRecord(entry);
              if (record) setExpenseModal({ type: 'delete', entry: record });
            }}
            expenseActionDisabled={monthLocked}
            expenseLoading={monthlyFinance.loading}
            onAddBill={() => setBillModal({ type: 'create' })}
            onPayBill={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.status === 'pending') setBillModal({ type: 'pay', entry: record });
            }}
            onEditBill={(entry) => {
              const record = findBillRecord(entry);
              if (record) setBillModal({ type: 'edit', entry: record });
            }}
            onDeleteBill={(entry) => {
              const record = findBillRecord(entry);
              if (record && !record.isRecurring) setBillModal({ type: 'delete', entry: record });
            }}
            onEditBillSeries={(entry) => {
              void openSeriesEditModal(entry);
            }}
            onCancelBillMonth={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.isRecurring && record.status === 'pending') setBillModal({ type: 'cancel-month', entry: record });
            }}
            onStopBillRepeating={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.isRecurring) setBillModal({ type: 'stop-repeating', entry: record });
            }}
            billActionDisabled={monthLocked}
            billLoading={monthlyFinance.loading}
            onAddReserveInvestment={() => setReserveInvestmentModal({ type: 'create' })}
            onEditReserveInvestment={(entry) => {
              const record = findReserveInvestmentRecord(entry);
              if (record) setReserveInvestmentModal({ type: 'edit', entry: record });
            }}
            onDeleteReserveInvestment={(entry) => {
              const record = findReserveInvestmentRecord(entry);
              if (record) setReserveInvestmentModal({ type: 'delete', entry: record });
            }}
            reserveInvestmentActionDisabled={monthLocked}
            reserveInvestmentLoading={monthlyFinance.loading}
          />

          <CollapsibleCharts
            remainingToSpend={dashboardMetrics.remainingToSpend}
            billsFlow={dashboardMetrics.billsFlow}
            billsFlowSummary={dashboardMetrics.billsFlowSummary}
            categoryAllocation={dashboardMetrics.categoryAllocation}
          />
        </div>

        <div className="tables-grid">
          <IncomeTable
            entries={displayIncomeEntries}
            loading={dataLoading}
            actionDisabled={monthLocked}
            onAdd={() => setIncomeModal({ type: 'create' })}
            onEdit={(entry) => {
              const record = findIncomeRecord(entry);
              if (record) setIncomeModal({ type: 'edit', entry: record });
            }}
            onDelete={(entry) => {
              const record = findIncomeRecord(entry);
              if (record) setIncomeModal({ type: 'delete', entry: record });
            }}
            onConfirmSalary={(entry) => {
              const record = findIncomeRecord(entry);
              if (record && entry.confirmAvailable) setIncomeModal({ type: 'confirm-salary', entry: record });
            }}
          />
          <ExpenseTable
            expenses={displayExpenseEntries}
            loading={monthlyFinance.loading}
            actionDisabled={monthLocked}
            onAdd={() => setExpenseModal({ type: 'create' })}
            onEdit={(entry) => {
              const record = findExpenseRecord(entry);
              if (record) setExpenseModal({ type: 'edit', entry: record });
            }}
            onDelete={(entry) => {
              const record = findExpenseRecord(entry);
              if (record) setExpenseModal({ type: 'delete', entry: record });
            }}
          />
          <BillsTable
            bills={displayBillEntries}
            loading={monthlyFinance.loading}
            actionDisabled={monthLocked}
            onAdd={() => setBillModal({ type: 'create' })}
            onPay={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.status === 'pending') setBillModal({ type: 'pay', entry: record });
            }}
            onEdit={(entry) => {
              const record = findBillRecord(entry);
              if (record) setBillModal({ type: 'edit', entry: record });
            }}
            onDelete={(entry) => {
              const record = findBillRecord(entry);
              if (record && !record.isRecurring) setBillModal({ type: 'delete', entry: record });
            }}
            onEditSeries={(entry) => {
              void openSeriesEditModal(entry);
            }}
            onCancelMonth={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.isRecurring && record.status === 'pending') setBillModal({ type: 'cancel-month', entry: record });
            }}
            onStopRepeating={(entry) => {
              const record = findBillRecord(entry);
              if (record && record.isRecurring) setBillModal({ type: 'stop-repeating', entry: record });
            }}
          />
          <ReserveInvestmentTable
            entries={displayReserveInvestmentEntries}
            availableTypes={reserveInvestmentTypes}
            summaries={monthlyFinance.reserveInvestmentSummaries}
            investmentOverview={monthlyFinance.investmentOverview}
            loading={monthlyFinance.loading}
            actionDisabled={monthLocked}
            onAdd={() => setReserveInvestmentModal({ type: 'create' })}
            onEdit={(entry) => {
              const record = findReserveInvestmentRecord(entry);
              if (record) setReserveInvestmentModal({ type: 'edit', entry: record });
            }}
            onDelete={(entry) => {
              const record = findReserveInvestmentRecord(entry);
              if (record) setReserveInvestmentModal({ type: 'delete', entry: record });
            }}
          />
        </div>

        <footer className="board-footer" aria-label="Navegação mensal">
          <MonthNavigator
            months={monthNames}
            selectedMonth={selectedMonthLabel}
            disabledMonths={disabledMonths}
            onSelectMonth={(month) => setSelectedPeriod((current) => ({ ...current, month }))}
          />
          <YearSelector
            selectedYear={selectedPeriod.year}
            years={years}
            onSelectYear={(year) => setSelectedPeriod((current) => ({ ...current, year }))}
          />
        </footer>

        {incomeModal?.type === 'create' ? (
          <IncomeEntryModal
            period={selectedPeriod}
            defaultStatus={getManualDefaultStatus(selectedPeriod)}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.createIncome(values);
              await handleSuccess('Entrada adicionada com sucesso.');
            }}
          />
        ) : null}

        {incomeModal?.type === 'edit' ? (
          <IncomeEntryModal
            period={selectedPeriod}
            defaultStatus={getManualDefaultStatus(selectedPeriod)}
            entry={incomeModal.entry}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.updateIncome(incomeModal.entry.id, values);
              await handleSuccess('Entrada atualizada com sucesso.');
            }}
          />
        ) : null}

        {incomeModal?.type === 'confirm-salary' ? (
          <SalaryConfirmationModal
            entry={incomeModal.entry}
            period={selectedPeriod}
            onClose={closeModal}
            onConfirm={async (values) => {
              await monthlyFinance.confirmSalary(incomeModal.entry.id, values);
              await handleSuccess('Salário confirmado como recebido.');
            }}
          />
        ) : null}

        {incomeModal?.type === 'delete' ? (
          <ConfirmDeleteDialog
            entry={incomeModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              await monthlyFinance.deleteIncome(incomeModal.entry.id);
              await handleSuccess('Entrada excluída com sucesso.');
            }}
          />
        ) : null}

        {expenseModal?.type === 'create' ? (
          <ExpenseFormModal
            period={selectedPeriod}
            benefitBalances={{
              foodAllowance: monthlyFinance.balance.foodAllowanceBalance,
              mealAllowance: monthlyFinance.balance.mealAllowanceBalance,
            }}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.createExpense(values);
              await handleSuccess('Gasto adicionado com sucesso.');
            }}
          />
        ) : null}

        {expenseModal?.type === 'edit' ? (
          <ExpenseFormModal
            period={selectedPeriod}
            entry={expenseModal.entry}
            benefitBalances={{
              foodAllowance: monthlyFinance.balance.foodAllowanceBalance,
              mealAllowance: monthlyFinance.balance.mealAllowanceBalance,
            }}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.updateExpense(expenseModal.entry.id, values);
              await handleSuccess('Gasto atualizado com sucesso.');
            }}
          />
        ) : null}

        {expenseModal?.type === 'delete' ? (
          <DeleteExpenseDialog
            entry={expenseModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              await monthlyFinance.deleteExpense(expenseModal.entry.id);
              await handleSuccess('Gasto excluído com sucesso.');
            }}
          />
        ) : null}

        {billModal?.type === 'create' ? (
          <BillFormModal
            period={selectedPeriod}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.createBill({ ...values, isRecurring: 'isRecurring' in values ? values.isRecurring : false });
              await handleSuccess('Conta adicionada com sucesso.');
            }}
          />
        ) : null}

        {billModal?.type === 'edit' ? (
          <BillFormModal
            period={selectedPeriod}
            bill={billModal.entry}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.updateBill(billModal.entry.id, values);
              await handleSuccess('Conta atualizada com sucesso.');
            }}
          />
        ) : null}

        {billModal?.type === 'pay' ? (
          <PayBillModal
            bill={billModal.entry}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.payBill(billModal.entry.id, values);
              await handleSuccess('Conta marcada como paga.');
            }}
          />
        ) : null}

        {billModal?.type === 'delete' ? (
          <DeleteBillDialog
            bill={billModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              await monthlyFinance.deleteBill(billModal.entry.id);
              await handleSuccess('Conta excluída com sucesso.');
            }}
          />
        ) : null}

        {billModal?.type === 'edit-series' ? (
          <RecurrenceSettingsModal
            bill={billModal.entry}
            template={billModal.template}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.updateRecurringBill(billModal.template.id, billModal.entry.dueDate, values);
              await handleSuccess('Contas recorrentes atualizadas com sucesso.');
            }}
          />
        ) : null}

        {billModal?.type === 'cancel-month' ? (
          <CancelRecurringBillDialog
            bill={billModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              await monthlyFinance.cancelBillMonth(billModal.entry.id);
              await handleSuccess('Conta removida deste mês.');
            }}
          />
        ) : null}

        {billModal?.type === 'stop-repeating' ? (
          <StopRepeatingBillDialog
            bill={billModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              if (!billModal.entry.recurrenceSourceId) return;
              await monthlyFinance.stopRecurringBill(billModal.entry.recurrenceSourceId, billModal.entry.dueDate);
              await handleSuccess('Repetição encerrada a partir do próximo mês.');
            }}
          />
        ) : null}

        {reserveInvestmentModal?.type === 'create' ? (
          <ReserveInvestmentFormModal
            period={selectedPeriod}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.createReserveInvestment(values);
              await handleSuccess('Aporte adicionado com sucesso.');
            }}
          />
        ) : null}

        {reserveInvestmentModal?.type === 'edit' ? (
          <ReserveInvestmentFormModal
            period={selectedPeriod}
            entry={reserveInvestmentModal.entry}
            onClose={closeModal}
            onSubmit={async (values) => {
              await monthlyFinance.updateReserveInvestment(reserveInvestmentModal.entry.id, values);
              await handleSuccess('Aporte atualizado com sucesso.');
            }}
          />
        ) : null}

        {reserveInvestmentModal?.type === 'delete' ? (
          <DeleteReserveInvestmentDialog
            entry={reserveInvestmentModal.entry}
            onClose={closeModal}
            onConfirm={async () => {
              await monthlyFinance.deleteReserveInvestment(reserveInvestmentModal.entry.id);
              await handleSuccess('Aporte excluido com sucesso.');
            }}
          />
        ) : null}
      </section>
    </main>
  );
}
