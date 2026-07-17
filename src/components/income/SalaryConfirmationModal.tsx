import { CheckCircle2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';
import type { IncomeEntryRecord, SalaryConfirmationInput } from '../../types/income';
import { formatCurrency } from '../../utils/formatters';
import { formatDateBR, isDateInPeriod, type FinancePeriod } from '../../utils/financeDates';

interface SalaryConfirmationModalProps {
  entry: IncomeEntryRecord;
  period: FinancePeriod;
  onClose: () => void;
  onConfirm: (values: SalaryConfirmationInput) => Promise<void>;
}

export function SalaryConfirmationModal({
  entry,
  period,
  onClose,
  onConfirm,
}: SalaryConfirmationModalProps) {
  const [amountValue, setAmountValue] = useState(String(entry.amount));
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [errors, setErrors] = useState<{ amount?: string; entryDate?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(amountValue), [amountValue]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { amount?: string; entryDate?: string } = {};

    if (amount === null || amount <= 0) nextErrors.amount = 'Informe um valor maior que zero.';
    if (!entryDate || !isDateInPeriod(entryDate, period)) {
      nextErrors.entryDate = 'A data precisa estar no mês selecionado.';
    }

    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0 || amount === null) return;

    setLoading(true);
    try {
      await onConfirm({ amount, entryDate });
    } catch {
      setFormError('Não foi possível confirmar o recebimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirmar recebimento do salário">
      <form className="entry-modal salary-confirm-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Salário planejado</span>
            <h2>Confirmar recebimento</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="salary-confirm-summary">
          <span>Valor planejado</span>
          <strong>{formatCurrency(entry.amount)}</strong>
          <small>Data planejada: {formatDateBR(entry.entryDate)}</small>
        </div>

        <div className="entry-form-grid">
          <CurrencyInput
            id="salary-confirm-amount"
            label="Valor recebido *"
            name="salary-confirm-amount"
            value={amountValue}
            onChange={setAmountValue}
            disabled={loading}
            error={errors.amount}
          />

          <label className={`form-field ${errors.entryDate ? 'form-field-invalid' : ''}`} htmlFor="salary-confirm-date">
            <span>Data do recebimento *</span>
            <input
              id="salary-confirm-date"
              name="salary-confirm-date"
              type="date"
              autoComplete="off"
              value={entryDate}
              onChange={(event) => setEntryDate(event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.entryDate)}
              aria-describedby={errors.entryDate ? 'salary-confirm-date-error' : undefined}
            />
            {errors.entryDate ? (
              <small className="field-error" id="salary-confirm-date-error">
                {errors.entryDate}
              </small>
            ) : null}
          </label>
        </div>

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <CheckCircle2 size={18} />
            {loading ? 'Confirmando...' : 'Confirmar recebimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
