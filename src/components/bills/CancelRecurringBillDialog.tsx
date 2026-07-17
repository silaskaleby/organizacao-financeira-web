import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { BillEntryRecord } from '../../types/bill';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';

interface CancelRecurringBillDialogProps {
  bill: BillEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CancelRecurringBillDialog({ bill, onClose, onConfirm }: CancelRecurringBillDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch {
      setError('Nao foi possivel remover esta conta do mes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Remover conta deste mes">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Contas</span>
            <h2>Remover somente este mes?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          <strong>{bill.name}</strong>, vencimento em <strong>{formatDateBR(bill.dueDate)}</strong>, no valor de{' '}
          <strong>{formatCurrency(bill.plannedAmount)}</strong>, deixara de aparecer neste mes.
        </p>
        <p>Os proximos meses continuam repetindo normalmente. A conta sera mantida internamente para nao ser recriada.</p>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <Trash2 size={18} />
            {loading ? 'Removendo...' : 'Remover deste mes'}
          </button>
        </div>
      </div>
    </div>
  );
}
