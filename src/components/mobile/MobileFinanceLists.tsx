import { Clock3, Pencil, Plus, Repeat2, Trash2, WalletCards, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import type {
  BillEntry,
  ExpenseEntry,
  IncomeEntry,
  ReserveInvestmentEntry,
  ReserveInvestmentType,
} from '../../types/finance';
import type { InvestmentOverview, ReserveInvestmentTypeSummary } from '../../types/reserveInvestment';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { BillActionsMenu } from '../bills/BillActionsMenu';
import { expenseCategoryTones, paymentMethodTones } from '../expenses/expenseLabels';
import { ActionMenu } from '../ui/ActionMenu';
import { Chip } from '../ui/Chip';

interface MobileFinanceListsProps {
  incomeEntries: IncomeEntry[];
  expenses: ExpenseEntry[];
  bills: BillEntry[];
  reserveInvestments: ReserveInvestmentEntry[];
  reserveInvestmentTypes: ReserveInvestmentType[];
  reserveInvestmentSummaries: ReserveInvestmentTypeSummary[];
  investmentOverview: InvestmentOverview;
  onAddIncome?: () => void;
  onEditIncome?: (entry: IncomeEntry) => void;
  onDeleteIncome?: (entry: IncomeEntry) => void;
  onConfirmSalary?: (entry: IncomeEntry) => void;
  incomeActionDisabled?: boolean;
  incomeLoading?: boolean;
  onAddExpense?: () => void;
  onEditExpense?: (entry: ExpenseEntry) => void;
  onDeleteExpense?: (entry: ExpenseEntry) => void;
  expenseActionDisabled?: boolean;
  expenseLoading?: boolean;
  onAddBill?: () => void;
  onPayBill?: (entry: BillEntry) => void;
  onEditBill?: (entry: BillEntry) => void;
  onDeleteBill?: (entry: BillEntry) => void;
  onEditBillSeries?: (entry: BillEntry) => void;
  onCancelBillMonth?: (entry: BillEntry) => void;
  onStopBillRepeating?: (entry: BillEntry) => void;
  billActionDisabled?: boolean;
  billLoading?: boolean;
  onAddReserveInvestment?: () => void;
  onEditReserveInvestment?: (entry: ReserveInvestmentEntry) => void;
  onDeleteReserveInvestment?: (entry: ReserveInvestmentEntry) => void;
  reserveInvestmentActionDisabled?: boolean;
  reserveInvestmentLoading?: boolean;
}

const getIncomeOriginLabel = (entry: IncomeEntry) => (entry.source === 'salary' ? 'Automatica' : 'Manual');

function MobileActions({
  label,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  if (!canEdit && !canDelete) return null;

  return (
    <div className="mobile-actions">
      {canEdit ? (
        <button type="button" aria-label={`Editar ${label}`} onClick={onEdit}>
          <Pencil size={16} />
        </button>
      ) : null}
      {canDelete ? (
        <button type="button" aria-label={`Excluir ${label}`} onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
  disabled = false,
}: {
  title: string;
  action: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="table-card-header">
      <h2>{title}</h2>
      <button type="button" onClick={onAction} disabled={disabled}>
        <Plus size={15} />
        {action}
      </button>
    </div>
  );
}

export function MobileFinanceLists({
  incomeEntries,
  expenses,
  bills,
  reserveInvestments,
  reserveInvestmentTypes,
  reserveInvestmentSummaries,
  investmentOverview,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  onConfirmSalary,
  incomeActionDisabled = false,
  incomeLoading = false,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  expenseActionDisabled = false,
  expenseLoading = false,
  onAddBill,
  onPayBill,
  onEditBill,
  onDeleteBill,
  onEditBillSeries,
  onCancelBillMonth,
  onStopBillRepeating,
  billActionDisabled = false,
  billLoading = false,
  onAddReserveInvestment,
  onEditReserveInvestment,
  onDeleteReserveInvestment,
  reserveInvestmentActionDisabled = false,
  reserveInvestmentLoading = false,
}: MobileFinanceListsProps) {
  const [investmentHistoryOpen, setInvestmentHistoryOpen] = useState(false);

  return (
    <div className="mobile-finance-lists">
      <section className="mobile-list-section table-card" aria-label="Entradas">
        <SectionHeader
          title="Entradas"
          action="Adicionar"
          onAction={onAddIncome}
          disabled={incomeActionDisabled || incomeLoading}
        />
        <div className="mobile-list-grid">
          {incomeLoading ? <p className="mobile-empty-text">Carregando entradas...</p> : null}
          {!incomeLoading && incomeEntries.length === 0 ? (
            <p className="mobile-empty-text">Nenhuma entrada cadastrada neste mes.</p>
          ) : null}
          {incomeEntries.map((entry) => (
            <article className={`mobile-record-card ${entry.status === 'planned' ? 'planned-row' : ''}`} key={entry.id}>
              <div className="record-main">
                <Chip tone={entry.chipTone}>{entry.type}</Chip>
                <strong>{formatCurrency(entry.amount)}</strong>
              </div>
              <div className="record-meta">
                <span>{entry.statusLabel ?? 'Entrada'}</span>
                <strong>
                  {entry.percentageLabel ?? (typeof entry.percentage === 'number' ? formatPercent(entry.percentage) : '-')}
                </strong>
              </div>
              <div className="record-meta">
                <span>{getIncomeOriginLabel(entry)}</span>
                <span>{entry.entryDate ? formatDateBR(entry.entryDate) : ''}</span>
              </div>
              {entry.includedInBalance === false ? (
                <div className="record-meta">
                  <span>Nao incluida no saldo</span>
                </div>
              ) : null}
              {entry.source === 'salary' && entry.status === 'planned' ? (
                <button
                  className="inline-confirm-action"
                  type="button"
                  onClick={() => onConfirmSalary?.(entry)}
                  disabled={!entry.confirmAvailable}
                  title={entry.confirmUnavailableReason}
                >
                  Confirmar recebimento
                </button>
              ) : null}
              <MobileActions
                label={entry.type}
                canEdit={entry.source === 'manual'}
                canDelete={entry.source === 'manual'}
                onEdit={() => onEditIncome?.(entry)}
                onDelete={() => onDeleteIncome?.(entry)}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="mobile-list-section table-card" aria-label="Gastos">
        <SectionHeader
          title="Gastos"
          action="Adicionar"
          onAction={onAddExpense}
          disabled={expenseActionDisabled || expenseLoading}
        />
        <div className="mobile-list-grid">
          {expenseLoading ? <p className="mobile-empty-text">Carregando gastos...</p> : null}
          {!expenseLoading && expenses.length === 0 ? (
            <p className="mobile-empty-text">Nenhum gasto cadastrado neste mes.</p>
          ) : null}
          {!expenseLoading &&
            expenses.map((expense) => (
              <article className="mobile-record-card" key={expense.id}>
                <div className="record-main">
                  <Chip tone={expense.categoryValue ? expenseCategoryTones[expense.categoryValue] : 'other'}>
                    {expense.category}
                  </Chip>
                  <strong>{formatCurrency(expense.amount)}</strong>
                </div>
                {expense.description ? (
                  <div className="record-meta">
                    <span>{expense.description}</span>
                  </div>
                ) : null}
                <div className="record-meta">
                  <Chip tone={expense.paymentMethodValue ? paymentMethodTones[expense.paymentMethodValue] : 'other'}>
                    {expense.paymentMethod}
                  </Chip>
                  <span>{expense.expenseDate ? formatDateBR(expense.expenseDate) : expense.date}</span>
                </div>
                <div className="record-meta">
                  <span>Essencialidade</span>
                  <strong>{expense.essential ? 'Essencial' : 'Não essencial'}</strong>
                </div>
                <div className="mobile-actions">
                  <ActionMenu
                    label={`Abrir menu de ações de ${expense.category}`}
                    title={`Ações de ${expense.category}`}
                    disabled={expenseActionDisabled}
                    closeKey={expense.id}
                    options={[
                      { label: 'Editar gasto', onSelect: () => onEditExpense?.(expense) },
                      { label: 'Excluir gasto', onSelect: () => onDeleteExpense?.(expense), danger: true },
                    ]}
                  />
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="mobile-list-section table-card" aria-label="Contas">
        <SectionHeader
          title="Contas"
          action="Adicionar"
          onAction={onAddBill}
          disabled={billActionDisabled || billLoading}
        />
        <div className="mobile-list-grid">
          {billLoading ? <p className="mobile-empty-text">Carregando contas...</p> : null}
          {!billLoading && bills.length === 0 ? (
            <p className="mobile-empty-text">Nenhuma conta cadastrada neste mes.</p>
          ) : null}
          {!billLoading &&
            bills.map((bill) => (
              <article className="mobile-record-card" key={bill.id}>
                <div className="record-main">
                  <strong>{bill.name}</strong>
                  <span className={bill.status === 'paid' ? 'status-badge yes' : 'status-badge pending'}>
                    {bill.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
                <div className="record-meta">
                  <span>Vencimento</span>
                  <strong>{bill.dueDate ?? '-'}</strong>
                </div>
                <div className="record-meta">
                  <span>{bill.status === 'paid' ? 'Valor pago' : 'Planejado'}</span>
                  <strong>{formatCurrency(bill.status === 'paid' ? bill.real : bill.planned)}</strong>
                </div>
                {bill.status === 'paid' && bill.real !== bill.planned ? (
                  <div className="record-meta">
                    <span>Planejado</span>
                    <strong>{formatCurrency(bill.planned)}</strong>
                  </div>
                ) : null}
                <div className="record-meta">
                  <span>{bill.status === 'paid' ? `Pago em ${bill.paidDate}` : 'Pendente'}</span>
                  {bill.recurring ? <Repeat2 size={15} aria-label="Recorrente" /> : <span>Avulsa</span>}
                </div>
                <div className="mobile-actions mobile-bill-actions">
                  {bill.status === 'pending' ? (
                    <button
                      className="mobile-pay-action"
                      type="button"
                      aria-label={`Pagar ${bill.name}`}
                      onClick={() => onPayBill?.(bill)}
                      disabled={billActionDisabled}
                    >
                      Pagar
                    </button>
                  ) : (
                    <button
                      className="mobile-paid-indicator"
                      type="button"
                      aria-label={`Conta ${bill.name} já foi paga`}
                      title={`Conta ${bill.name} já foi paga`}
                      disabled
                    >
                      Pago
                    </button>
                  )}
                  <BillActionsMenu
                    bill={bill}
                    disabled={billActionDisabled}
                    closeKey={`${bill.id}-${bill.status}`}
                    onEditOne={onEditBill}
                    onDelete={onDeleteBill}
                    onEditSeries={onEditBillSeries}
                    onCancelMonth={onCancelBillMonth}
                    onStopRepeating={onStopBillRepeating}
                  />
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="mobile-list-section table-card" aria-label="Reservas e investimentos">
        <SectionHeader
          title="Reservas e investimentos"
          action="Adicionar"
          onAction={onAddReserveInvestment}
          disabled={reserveInvestmentActionDisabled || reserveInvestmentLoading}
        />
        <div className="mobile-investment-overview" aria-label="Resumo de investimentos">
          <div
            title="Total investido somente na competência selecionada."
            aria-label={`Investido no mês. Total investido somente na competência selecionada. ${formatCurrency(investmentOverview.monthlyInvestedTotal)}`}
          >
            <span>Investido no mês</span>
            <strong>{formatCurrency(investmentOverview.monthlyInvestedTotal)}</strong>
          </div>
          <div
            title="Total dos aportes realizados até este mês, sem considerar rendimentos ou variações de mercado."
            aria-label={`Total investido acumulado. Total dos aportes realizados até este mês, sem considerar rendimentos ou variações de mercado. ${formatCurrency(investmentOverview.cumulativeInvestedTotal)}`}
          >
            <span>Total investido acumulado</span>
            <strong>{formatCurrency(investmentOverview.cumulativeInvestedTotal)}</strong>
          </div>
          <button
            type="button"
            onClick={() => setInvestmentHistoryOpen(true)}
            title="Ver histórico de investimentos"
            aria-label="Ver histórico de investimentos"
          >
            <Clock3 size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mobile-reserve-summary" aria-label="Investimentos por tipo no mes">
          {investmentOverview.monthlyInvestmentsByType.length > 0 ? (
            investmentOverview.monthlyInvestmentsByType.map((summary) => (
              <span key={summary.type} title={summary.description}>
                <Chip tone={summary.tone}>{summary.label}</Chip>
                <strong>{formatCurrency(summary.amount)}</strong>
              </span>
            ))
          ) : (
            <p className="mobile-empty-text">Nenhum investimento neste mes.</p>
          )}
        </div>
        {reserveInvestmentLoading ? <p className="mobile-empty-text">Carregando aportes...</p> : null}
        {!reserveInvestmentLoading && reserveInvestments.length > 0 ? (
          <div className="mobile-list-grid">
            {reserveInvestments.map((entry) => (
              <article className="mobile-record-card" key={entry.id}>
                <div className="record-main">
                  <Chip tone={entry.typeValue ? reserveInvestmentSummaries.find((summary) => summary.type === entry.typeValue)?.tone ?? 'goal' : 'goal'}>
                    {entry.type}
                  </Chip>
                  <strong>{formatCurrency(entry.amount)}</strong>
                </div>
                {entry.name ? (
                  <div className="record-meta">
                    <span>{entry.name}</span>
                  </div>
                ) : null}
                <div className="record-meta">
                  <span>{entry.date}</span>
                </div>
                <div className="mobile-actions">
                  <ActionMenu
                    label={`Abrir menu de acoes de ${entry.type}`}
                    title={`Acoes de ${entry.type}`}
                    disabled={reserveInvestmentActionDisabled}
                    closeKey={entry.id}
                    options={[
                      { label: 'Editar movimentacao', onSelect: () => onEditReserveInvestment?.(entry) },
                      { label: 'Excluir movimentacao', onSelect: () => onDeleteReserveInvestment?.(entry), danger: true },
                    ]}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {!reserveInvestmentLoading && reserveInvestments.length === 0 ? (
          <div className="empty-investments mobile-empty-investments">
            <WalletCards size={30} aria-hidden="true" />
            <p>Nenhum aporte nesta competencia.</p>
            <div className="chip-cloud" aria-label="Tipos disponiveis">
              {reserveInvestmentTypes.map((type) => (
                <Chip key={type.name} tone={type.tone}>
                  {type.name}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
        {investmentHistoryOpen ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Historico de investimentos">
            <div className="entry-modal investment-history-modal">
              <div className="entry-modal-header">
                <div>
                  <span>Investimentos</span>
                  <h2>Historico mensal</h2>
                </div>
                <button type="button" aria-label="Fechar historico" onClick={() => setInvestmentHistoryOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <p className="investment-history-note">
                Considera somente os tipos de investimento, sem Meta principal e Reserva de emergencia.
              </p>
              <div className="investment-history-list">
                {[...investmentOverview.investmentHistory].reverse().map((item, index, items) => {
                  const year = item.key.slice(0, 4);
                  const previousYear = items[index - 1]?.key.slice(0, 4);
                  return (
                    <Fragment key={item.key}>
                      {year !== previousYear ? <h3 className="investment-history-year">{year}</h3> : null}
                      <article className="investment-history-item">
                        <strong>{item.label}</strong>
                        <span>Investido no mes: {formatCurrency(item.monthlyAmount)}</span>
                        <span>Acumulado ate este mes: {formatCurrency(item.cumulativeAmount)}</span>
                      </article>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
