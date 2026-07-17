import { Save } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CurrencyInput, parseCurrencyValue } from '../forms/CurrencyInput';
import type { ProfileFormValues, ProfilePronouns, UserSettingsProfile } from '../../types/profile';

interface ProfileFormProps {
  title: string;
  description: string;
  submitLabel: string;
  profile?: UserSettingsProfile | null;
  loading?: boolean;
  successMessage?: string;
  draftKey?: string;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel?: () => void;
}

interface ProfileFormState {
  displayName: string;
  pronouns: ProfilePronouns | '';
  monthlySalary: string;
  salaryDay: string;
  initialBalance: string;
  mainGoalName: string;
  mainGoalTargetAmount: string;
  mainGoalInitialAmount: string;
  emergencyReserveTargetAmount: string;
  emergencyReserveInitialAmount: string;
}

type FieldName = keyof ProfileFormState;
type FieldErrors = Partial<Record<FieldName, string>>;

const fieldIds: Record<FieldName, string> = {
  displayName: 'profile-display-name',
  pronouns: 'profile-pronouns',
  monthlySalary: 'profile-salary',
  salaryDay: 'profile-salary-day',
  initialBalance: 'profile-initial-balance',
  mainGoalName: 'profile-main-goal-name',
  mainGoalTargetAmount: 'profile-main-goal-target',
  mainGoalInitialAmount: 'profile-main-goal-initial',
  emergencyReserveTargetAmount: 'profile-reserve-target',
  emergencyReserveInitialAmount: 'profile-reserve-initial',
};

const fieldOrder: FieldName[] = [
  'displayName',
  'pronouns',
  'monthlySalary',
  'salaryDay',
  'initialBalance',
  'mainGoalName',
  'mainGoalTargetAmount',
  'mainGoalInitialAmount',
  'emergencyReserveTargetAmount',
  'emergencyReserveInitialAmount',
];

const allowedPronouns: ProfilePronouns[] = ['masculine', 'feminine', 'neutral', 'prefer_not_to_say'];

const toMoneyString = (value: number | undefined) => (typeof value === 'number' ? String(value) : '');

const createInitialState = (profile?: UserSettingsProfile | null): ProfileFormState => ({
  displayName: profile?.displayName ?? '',
  pronouns: profile?.pronouns ?? '',
  monthlySalary: toMoneyString(profile?.monthlySalary),
  salaryDay: profile?.salaryDay ? String(profile.salaryDay) : '',
  initialBalance: toMoneyString(profile?.initialBalance),
  mainGoalName: profile?.mainGoalName ?? '',
  mainGoalTargetAmount: toMoneyString(profile?.mainGoalTargetAmount),
  mainGoalInitialAmount: toMoneyString(profile?.mainGoalInitialAmount),
  emergencyReserveTargetAmount: toMoneyString(profile?.emergencyReserveTargetAmount),
  emergencyReserveInitialAmount: toMoneyString(profile?.emergencyReserveInitialAmount),
});

const readDraft = (draftKey?: string) => {
  if (!draftKey) return null;

  try {
    const stored = sessionStorage.getItem(draftKey);
    return stored ? (JSON.parse(stored) as ProfileFormState) : null;
  } catch {
    return null;
  }
};

const getNumber = (value: string) => parseCurrencyValue(value);
const getOptionalNumber = (value: string) => getNumber(value) ?? 0;

export function ProfileForm({
  title,
  description,
  submitLabel,
  profile,
  loading = false,
  successMessage,
  draftKey,
  onSubmit,
  onCancel,
}: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormState>(() => readDraft(draftKey) ?? createInitialState(profile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!draftKey) return;
    sessionStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, form]);

  const values = useMemo(() => {
    const monthlySalary = getNumber(form.monthlySalary);
    const initialBalance = getNumber(form.initialBalance);
    const mainGoalTargetAmount = getNumber(form.mainGoalTargetAmount);
    const emergencyReserveTargetAmount = getNumber(form.emergencyReserveTargetAmount);

    return {
      displayName: form.displayName.trim().replace(/\s+/g, ' '),
      pronouns: form.pronouns,
      monthlySalary,
      salaryDay: Number(form.salaryDay),
      initialBalance,
      mainGoalName: form.mainGoalName.trim().replace(/\s+/g, ' '),
      mainGoalTargetAmount,
      mainGoalInitialAmount: getOptionalNumber(form.mainGoalInitialAmount),
      emergencyReserveTargetAmount,
      emergencyReserveInitialAmount: getOptionalNumber(form.emergencyReserveInitialAmount),
    };
  }, [form]);

  const setField = (field: FieldName, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (!values.displayName) nextErrors.displayName = 'Informe como você quer ser chamado.';
    if (values.pronouns && !allowedPronouns.includes(values.pronouns)) {
      nextErrors.pronouns = 'Escolha uma opção de pronomes válida.';
    }
    if (values.monthlySalary === null || values.monthlySalary <= 0) {
      nextErrors.monthlySalary = 'Informe um salário maior que zero.';
    }
    if (!form.salaryDay || !Number.isInteger(values.salaryDay) || values.salaryDay < 1 || values.salaryDay > 31) {
      nextErrors.salaryDay = 'Informe um dia entre 1 e 31.';
    }
    if (values.initialBalance === null || values.initialBalance < 0) {
      nextErrors.initialBalance = 'Informe o saldo inicial. Pode ser R$ 0,00.';
    }
    if (!values.mainGoalName) nextErrors.mainGoalName = 'Informe sua meta principal.';
    if (values.mainGoalTargetAmount === null || values.mainGoalTargetAmount <= 0) {
      nextErrors.mainGoalTargetAmount = 'Informe um valor maior que zero.';
    }
    if (values.mainGoalInitialAmount < 0) {
      nextErrors.mainGoalInitialAmount = 'O valor não pode ser negativo.';
    }
    if (
      values.mainGoalTargetAmount !== null &&
      values.mainGoalInitialAmount > values.mainGoalTargetAmount
    ) {
      nextErrors.mainGoalInitialAmount = 'O valor guardado não pode ultrapassar a meta.';
    }
    if (values.emergencyReserveTargetAmount === null || values.emergencyReserveTargetAmount <= 0) {
      nextErrors.emergencyReserveTargetAmount = 'Informe um objetivo maior que zero.';
    }
    if (values.emergencyReserveInitialAmount < 0) {
      nextErrors.emergencyReserveInitialAmount = 'O valor não pode ser negativo.';
    }
    if (
      values.emergencyReserveTargetAmount !== null &&
      values.emergencyReserveInitialAmount > values.emergencyReserveTargetAmount
    ) {
      nextErrors.emergencyReserveInitialAmount = 'O valor guardado não pode ultrapassar o objetivo.';
    }

    return nextErrors;
  };

  const focusFirstError = (nextErrors: FieldErrors) => {
    const firstInvalidField = fieldOrder.find((field) => nextErrors[field]);
    if (!firstInvalidField) return;

    const element = document.getElementById(fieldIds[firstInvalidField]);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setFormError('');

    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

    try {
      await onSubmit({
        displayName: values.displayName,
        pronouns: values.pronouns,
        monthlySalary: values.monthlySalary ?? 0,
        salaryDay: values.salaryDay,
        initialBalance: values.initialBalance ?? 0,
        mainGoalName: values.mainGoalName,
        mainGoalTargetAmount: values.mainGoalTargetAmount ?? 0,
        mainGoalInitialAmount: values.mainGoalInitialAmount,
        emergencyReserveTargetAmount: values.emergencyReserveTargetAmount ?? 0,
        emergencyReserveInitialAmount: values.emergencyReserveInitialAmount,
      });

      if (draftKey) {
        sessionStorage.removeItem(draftKey);
      }
    } catch {
      setFormError('Não foi possível salvar as configurações.');
    }
  };

  const renderTextField = (
    field: FieldName,
    label: string,
    options?: { placeholder?: string; helpText?: string; type?: string; min?: string; max?: string; inputMode?: 'numeric' },
  ) => {
    const helpId = options?.helpText ? `${fieldIds[field]}-help` : undefined;
    const errorId = errors[field] ? `${fieldIds[field]}-error` : undefined;
    const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <label className={`form-field ${errors[field] ? 'form-field-invalid' : ''}`} htmlFor={fieldIds[field]}>
        <span>{label}</span>
        <input
          id={fieldIds[field]}
          name={fieldIds[field]}
          type={options?.type ?? 'text'}
          min={options?.min}
          max={options?.max}
          inputMode={options?.inputMode}
          value={form[field]}
          placeholder={options?.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setField(field, event.target.value)}
          disabled={loading}
          aria-invalid={Boolean(errors[field])}
          aria-describedby={describedBy}
        />
        {options?.helpText ? (
          <small className="field-help" id={helpId}>
            {options.helpText}
          </small>
        ) : null}
        {errors[field] ? (
          <small className="field-error" id={errorId}>
            {errors[field]}
          </small>
        ) : null}
      </label>
    );
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
      <div className="profile-form-copy">
        <span>Configuração</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <p className="required-note">Campos marcados com * são obrigatórios.</p>
      </div>

      <fieldset className="form-section">
        <legend>Sobre você</legend>
        <div className="form-grid">
          {renderTextField('displayName', 'Como você quer ser chamado? *')}

          <label className={`form-field ${errors.pronouns ? 'form-field-invalid' : ''}`} htmlFor={fieldIds.pronouns}>
            <span>Pronomes</span>
            <select
              id={fieldIds.pronouns}
              name={fieldIds.pronouns}
              value={form.pronouns}
              onChange={(event) => setField('pronouns', event.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.pronouns)}
              aria-describedby={errors.pronouns ? `${fieldIds.pronouns}-error` : undefined}
            >
              <option value="">Selecione</option>
              <option value="masculine">Masculino</option>
              <option value="feminine">Feminino</option>
              <option value="neutral">Neutro</option>
              <option value="prefer_not_to_say">Prefiro não informar</option>
            </select>
            {errors.pronouns ? (
              <small className="field-error" id={`${fieldIds.pronouns}-error`}>
                {errors.pronouns}
              </small>
            ) : null}
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Sua situação financeira</legend>
        <div className="form-grid">
          <CurrencyInput
            id={fieldIds.monthlySalary}
            name={fieldIds.monthlySalary}
            label="Salário mensal *"
            value={form.monthlySalary}
            onChange={(value) => setField('monthlySalary', value)}
            disabled={loading}
            error={errors.monthlySalary}
          />

          {renderTextField('salaryDay', 'Dia de recebimento do salário *', {
            type: 'number',
            min: '1',
            max: '31',
            inputMode: 'numeric',
          })}

          <CurrencyInput
            id={fieldIds.initialBalance}
            name={fieldIds.initialBalance}
            label="Saldo inicial disponível *"
            value={form.initialBalance}
            onChange={(value) => setField('initialBalance', value)}
            disabled={loading}
            error={errors.initialBalance}
            helpText="Informe quanto você possui disponível ao começar a usar o sistema."
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Sua meta principal</legend>
        <div className="form-grid">
          {renderTextField('mainGoalName', 'Qual é sua meta principal? *', {
            placeholder: 'Ex.: carro, moto ou viagem',
          })}

          <CurrencyInput
            id={fieldIds.mainGoalTargetAmount}
            name={fieldIds.mainGoalTargetAmount}
            label="Qual é o valor da sua meta? *"
            value={form.mainGoalTargetAmount}
            onChange={(value) => setField('mainGoalTargetAmount', value)}
            disabled={loading}
            error={errors.mainGoalTargetAmount}
          />

          <CurrencyInput
            id={fieldIds.mainGoalInitialAmount}
            name={fieldIds.mainGoalInitialAmount}
            label="Quanto você já guardou para essa meta? — opcional"
            value={form.mainGoalInitialAmount}
            onChange={(value) => setField('mainGoalInitialAmount', value)}
            disabled={loading}
            error={errors.mainGoalInitialAmount}
            helpText="Deixe em branco caso ainda não tenha guardado nada."
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Reserva de emergência</legend>
        <div className="form-grid">
          <CurrencyInput
            id={fieldIds.emergencyReserveTargetAmount}
            name={fieldIds.emergencyReserveTargetAmount}
            label="Quanto você quer juntar na reserva de emergência? *"
            value={form.emergencyReserveTargetAmount}
            onChange={(value) => setField('emergencyReserveTargetAmount', value)}
            disabled={loading}
            error={errors.emergencyReserveTargetAmount}
          />

          <CurrencyInput
            id={fieldIds.emergencyReserveInitialAmount}
            name={fieldIds.emergencyReserveInitialAmount}
            label="Quanto você já tem guardado na reserva? — opcional"
            value={form.emergencyReserveInitialAmount}
            onChange={(value) => setField('emergencyReserveInitialAmount', value)}
            disabled={loading}
            error={errors.emergencyReserveInitialAmount}
            helpText="Deixe em branco caso ainda não possua uma reserva."
          />
        </div>
      </fieldset>

      {formError ? <p className="form-message form-message-error">{formError}</p> : null}
      {successMessage ? <p className="form-message form-message-success">{successMessage}</p> : null}

      <div className="profile-form-actions">
        {onCancel ? (
          <button className="secondary-action" type="button" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        ) : null}
        <button className="primary-action" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
