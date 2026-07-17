import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { reserveInvestmentTypeLabels } from '../../data/reserveInvestmentCatalog';
import type { ReserveInvestmentEntryRecord } from '../../types/reserveInvestment';
import { formatDateBR } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';

interface DeleteReserveInvestmentDialogProps {
  entry: ReserveInvestmentEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteReserveInvestmentDialog({ entry, onClose, onConfirm }: DeleteReserveInvestmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await onConfirm();
    } catch {
      setError('Nao foi possivel excluir o aporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Excluir aporte">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Exclusao</span>
            <h2>Excluir aporte?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          <strong>{reserveInvestmentTypeLabels[entry.type]}</strong> de{' '}
          <strong>{formatCurrency(entry.amount)}</strong>, no dia <strong>{formatDateBR(entry.entryDate)}</strong>.
        </p>
        <p>Este aporte sera removido e o valor voltara a fazer parte do saldo disponivel no recalculo.</p>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <Trash2 size={18} />
            {loading ? 'Excluindo...' : 'Excluir aporte'}
          </button>
        </div>
      </div>
    </div>
  );
}
