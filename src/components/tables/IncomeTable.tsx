import type { IncomeEntry } from '../../types/finance';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Chip } from '../ui/Chip';
import { TableActions } from './TableActions';
import { TableSection } from './TableSection';

interface IncomeTableProps {
  entries: IncomeEntry[];
  onAdd?: () => void;
  onEdit?: (entry: IncomeEntry) => void;
  onDelete?: (entry: IncomeEntry) => void;
  onConfirmSalary?: (entry: IncomeEntry) => void;
  actionDisabled?: boolean;
  loading?: boolean;
}

const getOriginLabel = (entry: IncomeEntry) => (entry.source === 'salary' ? 'Automático' : 'Manual');

export function IncomeTable({
  entries,
  onAdd,
  onEdit,
  onDelete,
  onConfirmSalary,
  actionDisabled = false,
  loading = false,
}: IncomeTableProps) {
  return (
    <TableSection
      title="Entradas"
      actionLabel="Adicionar entrada"
      onAction={onAdd}
      actionDisabled={actionDisabled || loading}
    >
      <table className="income-table">
        <colgroup>
          <col className="col-name" />
          <col className="col-money" />
          <col className="col-percent" />
          <col className="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="table-empty-cell">
                Carregando entradas...
              </td>
            </tr>
          ) : null}
          {!loading && entries.length === 0 ? (
            <tr>
              <td colSpan={4} className="table-empty-cell">
                Nenhuma entrada cadastrada neste mês.
              </td>
            </tr>
          ) : null}
          {entries.map((entry) => (
            <tr key={entry.id} className={entry.status === 'planned' ? 'planned-row' : undefined}>
              <td>
                <div className="entry-name-cell">
                  <Chip tone={entry.chipTone}>{entry.type}</Chip>
                  <small className="row-note compact-note">
                    {getOriginLabel(entry)}
                    {entry.entryDate ? ` • ${formatDateBR(entry.entryDate)}` : ''}
                  </small>
                  {entry.notes && entry.source !== 'salary' ? (
                    <small className="row-note compact-note">{entry.notes}</small>
                  ) : null}
                </div>
              </td>
              <td className="numeric-cell income-value-cell">{formatCurrency(entry.amount)}</td>
              <td>
                <div className="entry-status-cell">
                  <span className={`status-badge ${entry.status === 'received' ? 'yes' : 'pending'}`}>
                    {entry.statusLabel ?? (entry.status === 'received' ? 'Recebida' : 'Planejada')}
                  </span>
                  {entry.includedInBalance === false ? (
                    <small className="row-note">Fora do saldo</small>
                  ) : entry.percentageLabel ? (
                    <small className="row-note compact-note">{entry.percentageLabel}</small>
                  ) : typeof entry.percentage === 'number' ? (
                    <small className="row-note compact-note">{formatPercent(entry.percentage)}</small>
                  ) : null}
                </div>
              </td>
              <td>
                <TableActions
                  label={entry.type}
                  confirmLabel="Receber"
                  confirmAriaLabel="Confirmar recebimento do salário"
                  canConfirm={entry.source === 'salary' && entry.status === 'planned'}
                  canEdit={entry.source === 'manual'}
                  canDelete={entry.source === 'manual'}
                  confirmDisabled={!entry.confirmAvailable}
                  confirmTitle={entry.confirmUnavailableReason}
                  onConfirm={() => onConfirmSalary?.(entry)}
                  onEdit={() => onEdit?.(entry)}
                  onDelete={() => onDelete?.(entry)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableSection>
  );
}
