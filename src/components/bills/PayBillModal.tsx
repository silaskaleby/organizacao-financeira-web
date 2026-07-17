import { CheckCircle2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { BillEntryRecord, PayBillInput } from '../../types/bill';
import { formatDateBR, getCurrentPeriod, isSamePeriod } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';

interface PayBillModalProps {
  bill: BillEntryRecord;
  onClose: () => void;
  onSubmit: (values: PayBillInput) => Promise<void>;
}

const getDefaultPaidDate = (bill: BillEntryRecord) => {
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return isSamePeriod(getCurrentPeriod(), { year: Number(bill.dueDate.slice(0, 4)), month: Number(bill.dueDate.slice(5, 7)) })
    ? todayValue
    : bill.dueDate;
};

export function PayBillModal({ bill, onClose, onSubmit }: PayBillModalProps) {
  const [paidAmount, setPaidAmount] = useState(String(bill.paidAmount ?? bill.plannedAmount));
  const [paidDate, setPaidDate] = useState(bill.paidDate ?? getDefaultPaidDate(bill));
  const [errors, setErrors] = useState<{ paidAmount?: string; paidDate?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(paidAmount), [paidAmount]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const nextErrors: { paidAmount?: string; paidDate?: string } = {};
    if (amount === null || amount <= 0) nextErrors.paidAmount = 'Informe o valor pago.';
    if (!paidDate) nextErrors.paidDate = 'Informe a data do pagamento.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0 || amount === null) return;

    setLoading(true);
    try {
      await onSubmit({ paidAmount: amount, paidDate });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível pagar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Pagar conta">
      <form className="entry-modal bill-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Pagamento</span>
            <h2>Pagar conta</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="salary-confirm-summary">
          <span>{bill.name}</span>
          <strong>{formatCurrency(bill.plannedAmount)}</strong>
          <small>Vencimento em {formatDateBR(bill.dueDate)}</small>
        </div>

        <div className="entry-form-grid">
          <CurrencyInput
            id="bill-paid-amount"
            label="Valor realmente pago *"
            name="bill-paid-amount"
            value={paidAmount}
            onChange={setPaidAmount}
            disabled={loading}
            error={errors.paidAmount}
          />

          <label className={`form-field ${errors.paidDate ? 'form-field-invalid' : ''}`} htmlFor="bill-paid-date">
            <span>Data do pagamento *</span>
            <input
              id="bill-paid-date"
              name="bill-paid-date"
              type="date"
              autoComplete="off"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.paidDate)}
              aria-describedby={errors.paidDate ? 'bill-paid-date-error' : undefined}
            />
            {errors.paidDate ? <small className="field-error" id="bill-paid-date-error">{errors.paidDate}</small> : null}
          </label>
        </div>

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <CheckCircle2 size={18} />
            {loading ? 'Pagando...' : 'Confirmar pagamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
