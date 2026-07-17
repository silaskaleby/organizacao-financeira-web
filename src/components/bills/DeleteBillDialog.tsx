import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { BillEntryRecord } from '../../types/bill';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';

interface DeleteBillDialogProps {
  bill: BillEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBillDialog({ bill, onClose, onConfirm }: DeleteBillDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch {
      setError('Não foi possível excluir a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Excluir conta">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Exclusão</span>
            <h2>Excluir conta avulsa?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          Você está excluindo <strong>{bill.name}</strong>, vencida em <strong>{formatDateBR(bill.dueDate)}</strong>,
          no valor planejado de <strong>{formatCurrency(bill.plannedAmount)}</strong>.
        </p>
        {bill.status === 'paid' ? (
          <p>Esta conta já está paga. O saldo será recalculado sem esse pagamento.</p>
        ) : (
          <p>Esta conta será removida e os totais serão recalculados.</p>
        )}

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <Trash2 size={18} />
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
