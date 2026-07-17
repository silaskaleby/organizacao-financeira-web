import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { ExpenseEntryRecord } from '../../types/expense';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';
import { expenseCategoryLabels, paymentMethodLabels } from './expenseLabels';

interface DeleteExpenseDialogProps {
  entry: ExpenseEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteExpenseDialog({ entry, onClose, onConfirm }: DeleteExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await onConfirm();
    } catch {
      setError('Não foi possível excluir o gasto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Excluir gasto">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Exclusão</span>
            <h2>Excluir gasto?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          <strong>{expenseCategoryLabels[entry.category]}</strong> de <strong>{formatCurrency(entry.amount)}</strong> em{' '}
          <strong>{paymentMethodLabels[entry.paymentMethod]}</strong>, no dia{' '}
          <strong>{formatDateBR(entry.expenseDate)}</strong>.
        </p>
        <p>Este gasto será removido e os totais serão recalculados.</p>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <Trash2 size={18} />
            {loading ? 'Excluindo...' : 'Excluir gasto'}
          </button>
        </div>
      </div>
    </div>
  );
}
