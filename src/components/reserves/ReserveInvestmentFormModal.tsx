import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { reserveInvestmentTypeConfig, reserveInvestmentTypeOptions } from '../../data/reserveInvestmentCatalog';
import type { ReserveInvestmentEntryInput, ReserveInvestmentEntryRecord, ReserveInvestmentType } from '../../types/reserveInvestment';
import { getDefaultEntryDate, isDateInPeriod, type FinancePeriod } from '../../utils/financeDates';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';

interface ReserveInvestmentFormModalProps {
  period: FinancePeriod;
  entry?: ReserveInvestmentEntryRecord | null;
  onClose: () => void;
  onSubmit: (values: ReserveInvestmentEntryInput) => Promise<void>;
}

interface FormState {
  type: ReserveInvestmentType;
  amount: string;
  entryDate: string;
  name: string;
}

export function ReserveInvestmentFormModal({
  period,
  entry,
  onClose,
  onSubmit,
}: ReserveInvestmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    type: entry?.type ?? 'main_goal',
    amount: entry ? String(entry.amount) : '',
    entryDate: entry?.entryDate ?? getDefaultEntryDate(period),
    name: entry?.name === 'Aporte' ? '' : entry?.name ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(form.amount), [form.amount]);
  const title = entry ? 'Editar movimentacao' : 'Adicionar movimentacao';
  const typeDescription = reserveInvestmentTypeConfig[form.type].description;

  const setField = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.type) nextErrors.type = 'Escolha o tipo.';
    if (amount === null || amount <= 0) nextErrors.amount = 'Informe um valor maior que zero.';
    if (!form.entryDate) {
      nextErrors.entryDate = 'Informe a data.';
    } else if (!isDateInPeriod(form.entryDate, period)) {
      nextErrors.entryDate = 'A data precisa estar no mes selecionado.';
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
        type: form.type,
        amount,
        entryDate: form.entryDate,
        name: form.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setFormError(
        message.includes('mes selecionado') || message.includes('mÃªs selecionado') || message.includes('controle financeiro')
          ? message
          : 'Nao foi possivel salvar o aporte.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <form className="entry-modal reserve-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Reservas e investimentos</span>
            <h2>{title}</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <p className="form-message form-message-warning">
          Este valor sera retirado do saldo disponivel e adicionado a reserva ou investimento escolhido.
        </p>

        <div className="entry-form-grid">
          <label className={`form-field ${errors.type ? 'form-field-invalid' : ''}`} htmlFor="reserve-type">
            <span>Tipo *</span>
            <select
              id="reserve-type"
              name="reserve-investment-type"
              value={form.type}
              onChange={(event) => setField('type', event.target.value as ReserveInvestmentType)}
              disabled={loading}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? 'reserve-type-error' : undefined}
            >
              {reserveInvestmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small className="field-help">{typeDescription}</small>
            {errors.type ? <small className="field-error" id="reserve-type-error">{errors.type}</small> : null}
          </label>

          <CurrencyInput
            id="reserve-amount"
            label="Valor *"
            name="reserve-investment-amount"
            value={form.amount}
            onChange={(value) => setField('amount', value)}
            disabled={loading}
            error={errors.amount}
          />

          <label className={`form-field ${errors.entryDate ? 'form-field-invalid' : ''}`} htmlFor="reserve-date">
            <span>Data *</span>
            <input
              id="reserve-date"
              name="reserve-investment-date"
              type="date"
              autoComplete="off"
              value={form.entryDate}
              onChange={(event) => setField('entryDate', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.entryDate)}
              aria-describedby={errors.entryDate ? 'reserve-date-error' : undefined}
            />
            {errors.entryDate ? <small className="field-error" id="reserve-date-error">{errors.entryDate}</small> : null}
          </label>
        </div>

        <label className="form-field" htmlFor="reserve-name">
          <span>Observacao opcional</span>
          <textarea
            id="reserve-name"
            name="reserve-investment-note"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            disabled={loading}
            rows={3}
            autoComplete="off"
            spellCheck={false}
            placeholder="Ex.: aporte mensal"
          />
        </label>

        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar aporte'}
          </button>
        </div>
      </form>
    </div>
  );
}
