import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { ExpenseEntryInput, ExpenseEntryRecord, ExpensePaymentMethod } from '../../types/expense';
import { getDefaultEntryDate, isDateInPeriod, type FinancePeriod } from '../../utils/financeDates';
import { formatCurrency } from '../../utils/formatters';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';
import {
  creditPaymentHelp,
  expenseCategoryLabels,
  expenseCategoryOptions,
  isBenefitExpensePayment,
  paymentMethodLabels,
  paymentMethodOptions,
} from './expenseLabels';

interface BenefitBalances {
  foodAllowance: number;
  mealAllowance: number;
}

interface ExpenseFormModalProps {
  period: FinancePeriod;
  entry?: ExpenseEntryRecord | null;
  benefitBalances: BenefitBalances;
  onClose: () => void;
  onSubmit: (values: ExpenseEntryInput) => Promise<void>;
}

interface FormState {
  category: ExpenseEntryInput['category'];
  description: string;
  paymentMethod: ExpensePaymentMethod;
  amount: string;
  expenseDate: string;
  isEssential: 'yes' | 'no';
}

export function ExpenseFormModal({
  period,
  entry,
  benefitBalances,
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    category: entry?.category ?? 'other',
    description: entry?.description ?? '',
    paymentMethod: entry?.paymentMethod ?? 'pix_cash',
    amount: entry ? String(entry.amount) : '',
    expenseDate: entry?.expenseDate ?? getDefaultEntryDate(period),
    isEssential: entry?.isEssential ? 'yes' : 'no',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const amount = useMemo(() => parseCurrencyValue(form.amount), [form.amount]);
  const title = entry ? 'Editar gasto' : 'Adicionar gasto';
  const paymentHelp = creditPaymentHelp[form.paymentMethod];

  const currentBenefitBalance = useMemo(() => {
    if (form.paymentMethod === 'food_allowance') {
      return benefitBalances.foodAllowance + (entry?.paymentMethod === 'food_allowance' ? entry.amount : 0);
    }
    if (form.paymentMethod === 'meal_allowance') {
      return benefitBalances.mealAllowance + (entry?.paymentMethod === 'meal_allowance' ? entry.amount : 0);
    }
    return null;
  }, [benefitBalances.foodAllowance, benefitBalances.mealAllowance, entry, form.paymentMethod]);

  const leavesBenefitNegative =
    amount !== null &&
    currentBenefitBalance !== null &&
    isBenefitExpensePayment(form.paymentMethod) &&
    currentBenefitBalance - amount < 0;

  const setField = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.category) nextErrors.category = 'Escolha uma categoria.';
    if (!form.paymentMethod) nextErrors.paymentMethod = 'Escolha a forma de pagamento.';
    if (amount === null || amount <= 0) nextErrors.amount = 'Informe um valor maior que zero.';
    if (!form.expenseDate) {
      nextErrors.expenseDate = 'Informe a data.';
    } else if (!isDateInPeriod(form.expenseDate, period)) {
      nextErrors.expenseDate = 'A data precisa estar no mês selecionado.';
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
        category: form.category,
        description: form.description,
        paymentMethod: form.paymentMethod,
        amount,
        expenseDate: form.expenseDate,
        isEssential: form.isEssential === 'yes',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setFormError(
        message.includes('mês selecionado') || message.includes('início do controle')
          ? message
          : 'Não foi possível salvar o gasto.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <form className="entry-modal expense-modal" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="entry-modal-header">
          <div>
            <span>Gastos</span>
            <h2>{title}</h2>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="entry-form-grid">
          <label className={`form-field ${errors.category ? 'form-field-invalid' : ''}`} htmlFor="expense-category">
            <span>Categoria *</span>
            <select
              id="expense-category"
              name="expense-category"
              value={form.category}
              onChange={(event) => setField('category', event.target.value as ExpenseEntryInput['category'])}
              disabled={loading}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'expense-category-error' : undefined}
            >
              {expenseCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category ? <small className="field-error" id="expense-category-error">{errors.category}</small> : null}
          </label>

          <label className={`form-field ${errors.paymentMethod ? 'form-field-invalid' : ''}`} htmlFor="expense-payment">
            <span>Forma de pagamento *</span>
            <select
              id="expense-payment"
              name="expense-payment-method"
              value={form.paymentMethod}
              onChange={(event) => setField('paymentMethod', event.target.value as ExpensePaymentMethod)}
              disabled={loading}
              aria-invalid={Boolean(errors.paymentMethod)}
              aria-describedby={errors.paymentMethod ? 'expense-payment-error' : undefined}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {paymentHelp ? <small className="field-help">{paymentHelp}</small> : null}
            {errors.paymentMethod ? (
              <small className="field-error" id="expense-payment-error">{errors.paymentMethod}</small>
            ) : null}
          </label>

          <CurrencyInput
            id="expense-amount"
            label="Valor *"
            name="expense-amount"
            value={form.amount}
            onChange={(value) => setField('amount', value)}
            disabled={loading}
            error={errors.amount}
          />

          <label className={`form-field ${errors.expenseDate ? 'form-field-invalid' : ''}`} htmlFor="expense-date">
            <span>Data *</span>
            <input
              id="expense-date"
              name="expense-date"
              type="date"
              autoComplete="off"
              value={form.expenseDate}
              onChange={(event) => setField('expenseDate', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.expenseDate)}
              aria-describedby={errors.expenseDate ? 'expense-date-error' : undefined}
            />
            {errors.expenseDate ? <small className="field-error" id="expense-date-error">{errors.expenseDate}</small> : null}
          </label>
        </div>

        <label className="form-field" htmlFor="expense-description">
          <span>Descrição opcional</span>
          <textarea
          id="expense-description"
          name="expense-description"
          value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            disabled={loading}
          rows={3}
          autoComplete="off"
          spellCheck={false}
            placeholder={`Ex.: ${expenseCategoryLabels[form.category]}`}
          />
        </label>

        <fieldset className="essential-toggle">
          <legend>Esse gasto é essencial?</legend>
          <label>
            <input
              type="radio"
              name="expense-essential"
              value="yes"
              checked={form.isEssential === 'yes'}
              onChange={() => setField('isEssential', 'yes')}
              disabled={loading}
            />
            Sim
          </label>
          <label>
            <input
              type="radio"
              name="expense-essential"
              value="no"
              checked={form.isEssential === 'no'}
              onChange={() => setField('isEssential', 'no')}
              disabled={loading}
            />
            Não
          </label>
        </fieldset>

        {leavesBenefitNegative ? (
          <p className="form-message form-message-warning">
            Este gasto deixa seu saldo de benefício negativo. Saldo considerado:{' '}
            {formatCurrency(currentBenefitBalance ?? 0)}.
          </p>
        ) : null}
        {formError ? <p className="form-message form-message-error">{formError}</p> : null}

        <div className="entry-modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar gasto'}
          </button>
        </div>
      </form>
    </div>
  );
}
