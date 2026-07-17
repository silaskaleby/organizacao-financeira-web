import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';
import type { IncomeEntryInput, IncomeEntryRecord, IncomeEntryStatus, IncomeEntryType } from '../../types/income';
import { getDefaultEntryDate, isDateInPeriod, type FinancePeriod } from '../../utils/financeDates';
import { incomeStatusLabels, incomeTypeLabels, incomeTypeOptions } from './incomeLabels';

interface IncomeEntryModalProps {
  period: FinancePeriod;
  defaultStatus: IncomeEntryStatus;
  entry?: IncomeEntryRecord | null;
  onClose: () => void;
  onSubmit: (values: IncomeEntryInput) => Promise<void>;
}

interface FormState {
  type: IncomeEntryType;
  amount: string;
  entryDate: string;
  status: IncomeEntryStatus;
  notes: string;
}

export function IncomeEntryModal({
  period,
  defaultStatus,
  entry,
  onClose,
  onSubmit,
}: IncomeEntryModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    type: entry?.type === 'salary' ? 'extra_income' : entry?.type ?? 'extra_income',
    amount: entry ? String(entry.amount) : '',
    entryDate: entry?.entryDate ?? getDefaultEntryDate(period),
    status: entry?.status ?? defaultStatus,
    notes: entry?.notes ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const title = entry ? 'Editar entrada' : 'Adicionar entrada';

  const amount = useMemo(() => parseCurrencyValue(form.amount), [form.amount]);

  const setField = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.type) nextErrors.type = 'Escolha o tipo da entrada.';
    if (amount === null || amount <= 0) nextErrors.amount = 'Informe um valor maior que zero.';
    if (!form.entryDate) {
      nextErrors.entryDate = 'Informe a data.';
    } else if (!isDateInPeriod(form.entryDate, period)) {
      nextErrors.entryDate = 'A data precisa estar no mês selecionado.';
    }
    if (!form.status) nextErrors.status = 'Escolha o status.';

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0 || amount === null) return;

    setLoading(true);
    try {
      await onSubmit({
        type: form.type,
        amount,
        entryDate: form.entryDate,
        status: form.status,
        notes: form.notes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setFormError(
        message.includes('mês selecionado') || message.includes('início do controle')
          ? message
          : 'Não foi possível salvar a entrada.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <form className="entry-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Entradas</span>
            <h2>{title}</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="entry-form-grid">
          <label className={`form-field ${errors.type ? 'form-field-invalid' : ''}`} htmlFor="income-type">
            <span>Tipo *</span>
            <select
              id="income-type"
              name="income-entry-type"
              value={form.type}
              onChange={(event) => setField('type', event.target.value as IncomeEntryType)}
              disabled={loading}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? 'income-type-error' : undefined}
            >
              {incomeTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type ? <small className="field-error" id="income-type-error">{errors.type}</small> : null}
          </label>

          <CurrencyInput
            id="income-amount"
            label="Valor *"
            name="income-entry-amount"
            value={form.amount}
            onChange={(value) => setField('amount', value)}
            disabled={loading}
            error={errors.amount}
          />

          <label className={`form-field ${errors.entryDate ? 'form-field-invalid' : ''}`} htmlFor="income-date">
            <span>Data *</span>
            <input
              id="income-date"
              name="income-entry-date"
              type="date"
              autoComplete="off"
              value={form.entryDate}
              onChange={(event) => setField('entryDate', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.entryDate)}
              aria-describedby={errors.entryDate ? 'income-date-error' : undefined}
            />
            {errors.entryDate ? <small className="field-error" id="income-date-error">{errors.entryDate}</small> : null}
          </label>

          <label className={`form-field ${errors.status ? 'form-field-invalid' : ''}`} htmlFor="income-status">
            <span>Status *</span>
            <select
              id="income-status"
              name="income-entry-status"
              value={form.status}
              onChange={(event) => setField('status', event.target.value as IncomeEntryStatus)}
              disabled={loading}
              aria-invalid={Boolean(errors.status)}
              aria-describedby={errors.status ? 'income-status-error' : undefined}
            >
              <option value="planned">{incomeStatusLabels.planned}</option>
              <option value="received">{incomeStatusLabels.received}</option>
            </select>
            {errors.status ? <small className="field-error" id="income-status-error">{errors.status}</small> : null}
          </label>
        </div>

        <label className="form-field" htmlFor="income-notes">
          <span>Observação — opcional</span>
          <textarea
            id="income-notes"
            name="income-entry-notes"
            value={form.notes}
            onChange={(event) => setField('notes', event.target.value)}
            disabled={loading}
            rows={3}
            autoComplete="off"
            spellCheck={false}
            placeholder={`Ex.: ${incomeTypeLabels[form.type]}`}
          />
        </label>

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}
