import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { BillEntryRecord, BillInput, BillOccurrenceInput } from '../../types/bill';
import { getDefaultEntryDate, isDateInPeriod, type FinancePeriod } from '../../utils/financeDates';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';

interface BillFormModalProps {
  period: FinancePeriod;
  bill?: BillEntryRecord | null;
  onClose: () => void;
  onSubmit: (values: BillInput | BillOccurrenceInput) => Promise<void>;
}

interface FormState {
  name: string;
  plannedAmount: string;
  dueDate: string;
  isRecurring: boolean;
}

export function BillFormModal({ period, bill, onClose, onSubmit }: BillFormModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    name: bill?.name ?? '',
    plannedAmount: bill ? String(bill.plannedAmount) : '',
    dueDate: bill?.dueDate ?? getDefaultEntryDate(period),
    isRecurring: bill?.isRecurring ?? false,
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(form.plannedAmount), [form.plannedAmount]);
  const editing = Boolean(bill);

  const setField = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome da conta.';
    if (amount === null || amount <= 0) nextErrors.plannedAmount = 'Informe um valor maior que zero.';
    if (!form.dueDate) {
      nextErrors.dueDate = 'Informe a data de vencimento.';
    } else if (!isDateInPeriod(form.dueDate, period)) {
      nextErrors.dueDate = 'O vencimento precisa estar no mês selecionado.';
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
      await onSubmit({
        name: form.name,
        plannedAmount: amount,
        dueDate: form.dueDate,
        ...(editing ? {} : { isRecurring: form.isRecurring }),
      } as BillInput | BillOccurrenceInput);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível salvar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editing ? 'Editar conta' : 'Adicionar conta'}>
      <form className="entry-modal bill-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Contas</span>
            <h2>{editing ? 'Editar somente este mês' : 'Adicionar conta'}</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="entry-form-grid">
          <label className={`form-field ${errors.name ? 'form-field-invalid' : ''}`} htmlFor="bill-name">
            <span>Nome da conta *</span>
            <input
              id="bill-name"
              name="bill-name"
              value={form.name}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setField('name', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'bill-name-error' : undefined}
            />
            {errors.name ? <small className="field-error" id="bill-name-error">{errors.name}</small> : null}
          </label>

          <CurrencyInput
            id="bill-planned"
            label="Valor planejado *"
            name="bill-planned-amount"
            value={form.plannedAmount}
            onChange={(value) => setField('plannedAmount', value)}
            disabled={loading}
            error={errors.plannedAmount}
          />

          <label className={`form-field ${errors.dueDate ? 'form-field-invalid' : ''}`} htmlFor="bill-due-date">
            <span>Vencimento *</span>
            <input
              id="bill-due-date"
              name="bill-due-date"
              type="date"
              autoComplete="off"
              value={form.dueDate}
              onChange={(event) => setField('dueDate', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'bill-due-date-error' : undefined}
            />
            {errors.dueDate ? <small className="field-error" id="bill-due-date-error">{errors.dueDate}</small> : null}
          </label>
        </div>

        {!editing ? (
          <fieldset className="essential-toggle">
            <legend>Recorrente mensal?</legend>
            <label>
              <input
                type="radio"
                name="bill-recurring"
                checked={form.isRecurring}
                onChange={() => setField('isRecurring', true)}
                disabled={loading}
              />
              Sim
            </label>
            <label>
              <input
                type="radio"
                name="bill-recurring"
                checked={!form.isRecurring}
                onChange={() => setField('isRecurring', false)}
                disabled={loading}
              />
              Não
            </label>
          </fieldset>
        ) : (
          <p className="form-message form-message-warning">
            Esta edição altera somente a conta deste mês. As outras contas dessa repetição não serão alteradas.
            Contas já pagas mantêm o pagamento registrado.
          </p>
        )}

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar conta'}
          </button>
        </div>
      </form>
    </div>
  );
}
