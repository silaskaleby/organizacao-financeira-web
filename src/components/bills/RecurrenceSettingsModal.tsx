import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { BillEntryRecord, RecurringBillTemplateInput, RecurringBillTemplateRecord } from '../../types/bill';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';

interface RecurrenceSettingsModalProps {
  bill: BillEntryRecord;
  template: RecurringBillTemplateRecord;
  onClose: () => void;
  onSubmit: (values: RecurringBillTemplateInput) => Promise<void>;
}

export function RecurrenceSettingsModal({
  bill,
  template,
  onClose,
  onSubmit,
}: RecurrenceSettingsModalProps) {
  const [name, setName] = useState(bill.name || template.name);
  const [plannedAmount, setPlannedAmount] = useState(String(bill.plannedAmount || template.plannedAmount));
  const [dueDay, setDueDay] = useState(String(Number(bill.dueDate.slice(8, 10)) || template.dueDay));
  const [errors, setErrors] = useState<{ name?: string; plannedAmount?: string; dueDay?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(plannedAmount), [plannedAmount]);

  const validate = () => {
    const nextErrors: { name?: string; plannedAmount?: string; dueDay?: string } = {};
    const numericDueDay = Number(dueDay);
    if (!name.trim()) nextErrors.name = 'Informe o nome da conta.';
    if (amount === null || amount <= 0) nextErrors.plannedAmount = 'Informe um valor maior que zero.';
    if (!Number.isInteger(numericDueDay) || numericDueDay < 1 || numericDueDay > 31) {
      nextErrors.dueDay = 'Informe um dia entre 1 e 31.';
    }
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0 || amount === null) return;

    setLoading(true);
    try {
      await onSubmit({ name, plannedAmount: amount, dueDay: Number(dueDay) });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel editar as contas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Editar este e os proximos">
      <form className="entry-modal bill-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Contas</span>
            <h2>Editar este e os proximos</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p className="form-message form-message-warning">
          {bill.status === 'paid'
            ? 'Esta conta ja paga nao sera alterada. A mudanca vale para proximas contas pendentes ja criadas e novas contas dos proximos meses.'
            : 'Esta alteracao vale para esta conta pendente, proximas contas pendentes ja criadas e novas contas dos proximos meses.'}
          {' '}Contas pagas e meses anteriores nao serao alterados.
        </p>

        <div className="entry-form-grid">
          <label className={`form-field ${errors.name ? 'form-field-invalid' : ''}`} htmlFor="recurrence-name">
            <span>Nome da conta *</span>
            <input
              id="recurrence-name"
              name="recurrence-bill-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
            {errors.name ? <small className="field-error">{errors.name}</small> : null}
          </label>

          <CurrencyInput
            id="recurrence-planned"
            label="Valor planejado *"
            name="recurrence-planned-amount"
            value={plannedAmount}
            onChange={setPlannedAmount}
            disabled={loading}
            error={errors.plannedAmount}
          />

          <label className={`form-field ${errors.dueDay ? 'form-field-invalid' : ''}`} htmlFor="recurrence-due-day">
            <span>Dia de vencimento *</span>
            <input
              id="recurrence-due-day"
              name="recurrence-due-day"
              type="number"
              autoComplete="off"
              min={1}
              max={31}
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              disabled={loading}
            />
            {errors.dueDay ? <small className="field-error">{errors.dueDay}</small> : null}
          </label>
        </div>

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar contas'}
          </button>
        </div>
      </form>
    </div>
  );
}
