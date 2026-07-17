import type { ExpenseEntry } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { expenseCategoryTones, paymentMethodTones } from '../expenses/expenseLabels';
import { ActionMenu } from '../ui/ActionMenu';
import { Chip } from '../ui/Chip';
import { TableSection } from './TableSection';

interface ExpenseTableProps {
  expenses: ExpenseEntry[];
  loading?: boolean;
  actionDisabled?: boolean;
  onAdd?: () => void;
  onEdit?: (expense: ExpenseEntry) => void;
  onDelete?: (expense: ExpenseEntry) => void;
}

export function ExpenseTable({
  expenses,
  loading = false,
  actionDisabled = false,
  onAdd,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  return (
    <TableSection title="Gastos" actionLabel="Adicionar gasto" onAction={onAdd} actionDisabled={actionDisabled || loading}>
      <table className="expense-table">
        <colgroup>
          <col className="col-category" />
          <col className="col-payment" />
          <col className="col-money" />
          <col className="col-date" />
          <col className="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Pagamento</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="table-empty-cell" colSpan={5}>
                Carregando gastos...
              </td>
            </tr>
          ) : null}
          {!loading && expenses.length === 0 ? (
            <tr>
              <td className="table-empty-cell" colSpan={5}>
                Nenhum gasto cadastrado neste mês.
              </td>
            </tr>
          ) : null}
          {!loading &&
            expenses.map((expense) => (
              <tr key={expense.id}>
                <td title={expense.description ?? expense.category}>
                  <div className="expense-category-cell">
                    <Chip tone={expense.categoryValue ? expenseCategoryTones[expense.categoryValue] : 'other'}>
                      {expense.category}
                    </Chip>
                    <span className="row-note compact-note">
                      {expense.description
                        ? `${expense.description} • ${expense.essential ? 'Essencial' : 'Não essencial'}`
                        : expense.essential
                          ? 'Essencial'
                          : 'Não essencial'}
                    </span>
                  </div>
                </td>
                <td>
                  <Chip tone={expense.paymentMethodValue ? paymentMethodTones[expense.paymentMethodValue] : 'other'}>
                    {expense.paymentMethod}
                  </Chip>
                </td>
                <td className="numeric-cell expense-value-cell">{formatCurrency(expense.amount)}</td>
                <td className="date-cell">{expense.date}</td>
                <td>
                  <div className="expense-row-actions">
                    <ActionMenu
                      label={`Abrir menu de ações de ${expense.category}`}
                      title={`Ações de ${expense.category}`}
                      disabled={actionDisabled}
                      closeKey={expense.id}
                      options={[
                        { label: 'Editar gasto', onSelect: () => onEdit?.(expense) },
                        { label: 'Excluir gasto', onSelect: () => onDelete?.(expense), danger: true },
                      ]}
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
