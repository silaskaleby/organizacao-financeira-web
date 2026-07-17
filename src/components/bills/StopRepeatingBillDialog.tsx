import { PowerOff, X } from 'lucide-react';
import { useState } from 'react';
import type { BillEntryRecord } from '../../types/bill';
import { formatDateBR } from '../../utils/financeDates';

interface StopRepeatingBillDialogProps {
  bill: BillEntryRecord;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function StopRepeatingBillDialog({ bill, onClose, onConfirm }: StopRepeatingBillDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch {
      setError('Nao foi possivel parar a repeticao desta conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Parar repeticao da conta">
      <div className="entry-modal delete-dialog">
        <div className="entry-modal-header">
          <div>
            <span>Contas</span>
            <h2>Parar de repetir?</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p>
          A conta atual, com vencimento em <strong>{formatDateBR(bill.dueDate)}</strong>, sera mantida.
        </p>
        <p>
          A repeticao sera encerrada para os proximos meses. Contas futuras pendentes ja criadas serao ocultadas,
          e contas pagas continuarao preservadas.
        </p>

        {error ? <p className="form-message form-message-error">{error}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="danger-action" type="button" onClick={handleConfirm} disabled={loading}>
            <PowerOff size={18} />
            {loading ? 'Salvando...' : 'Parar a partir do proximo mes'}
          </button>
        </div>
      </div>
    </div>
  );
}
