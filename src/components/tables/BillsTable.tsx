import type { BillEntry } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { BillActionsMenu } from '../bills/BillActionsMenu';
import { TableSection } from './TableSection';

interface BillsTableProps {
  bills: BillEntry[];
  loading?: boolean;
  actionDisabled?: boolean;
  onAdd?: () => void;
  onPay?: (bill: BillEntry) => void;
  onEdit?: (bill: BillEntry) => void;
  onDelete?: (bill: BillEntry) => void;
  onEditSeries?: (bill: BillEntry) => void;
  onCancelMonth?: (bill: BillEntry) => void;
  onStopRepeating?: (bill: BillEntry) => void;
}

export function BillsTable({
  bills,
  loading = false,
  actionDisabled = false,
  onAdd,
  onPay,
  onEdit,
  onDelete,
  onEditSeries,
  onCancelMonth,
  onStopRepeating,
}: BillsTableProps) {
  return (
    <TableSection title="Contas" actionLabel="Adicionar conta" onAction={onAdd} actionDisabled={actionDisabled || loading}>
      <table className="bills-table">
        <colgroup>
          <col className="col-name" />
          <col className="col-money" />
          <col className="col-date" />
          <col className="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="table-empty-cell" colSpan={4}>
                Carregando contas...
              </td>
            </tr>
          ) : null}
          {!loading && bills.length === 0 ? (
            <tr>
              <td className="table-empty-cell" colSpan={4}>
                Nenhuma conta cadastrada neste mês.
              </td>
            </tr>
          ) : null}
          {!loading &&
            bills.map((bill) => (
              <tr className={bill.status === 'paid' ? 'paid-bill-row' : undefined} key={bill.id}>
                <td title={bill.name}>
                  <div className="bill-name-cell">
                    <strong>{bill.name}</strong>
                    <span className="row-note compact-note">{bill.subtitle}</span>
                  </div>
                </td>
                <td className="numeric-cell">
                  <div className="bill-value-cell">
                    <strong>{formatCurrency(bill.status === 'paid' ? bill.real : bill.planned)}</strong>
                    {bill.status === 'paid' && bill.real !== bill.planned ? (
                      <span className="row-note">Planejado: {formatCurrency(bill.planned)}</span>
                    ) : null}
                  </div>
                </td>
                <td className="date-cell">{bill.dueDate}</td>
                <td>
                  <div className="bill-row-actions">
                    {bill.status === 'pending' ? (
                      <button
                        className="pay-bill-action"
                        type="button"
                        aria-label={`Pagar ${bill.name}`}
                        title={`Pagar ${bill.name}`}
                        onClick={() => onPay?.(bill)}
                        disabled={actionDisabled}
                      >
                        Pagar
                      </button>
                    ) : (
                      <button
                        className="paid-bill-indicator"
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
                      disabled={actionDisabled}
                      closeKey={`${bill.id}-${bill.status}`}
                      onEditOne={onEdit}
                      onDelete={onDelete}
                      onEditSeries={onEditSeries}
                      onCancelMonth={onCancelMonth}
                      onStopRepeating={onStopRepeating}
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </TableSection>
  );
}
