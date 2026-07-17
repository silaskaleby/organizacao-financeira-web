import { Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { IncomeEntryRecord } from '../../types/income';
import { formatCurrency } from '../../utils/formatters';
import { incomeTypeLabels } from './incomeLabels';

interface ConfirmDeleteDialogProps {
  entry: IncomeEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteDialog({ entry, onClose, onConfirm }: ConfirmDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await onConfirm();
    } catch {
      setError('Não foi possível excluir a entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Excluir entrada">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Exclusão</span>
            <h2>Excluir entrada manual?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          Você está excluindo <strong>{incomeTypeLabels[entry.type]}</strong> no valor de{' '}
          <strong>{formatCurrency(entry.amount)}</strong>. O saldo será recalculado após a exclusão.
        </p>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <Trash2 size={18} />
            {loading ? 'Excluindo...' : 'Excluir entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}
