import { useState } from 'react';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  name?: string;
  autoComplete?: string;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseCurrencyValue(value: string) {
  if (!value) return null;
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInput(rawValue: string) {
  const cleaned = rawValue
    .replace(/[^\d,.]/g, '')
    .replace(/^-/, '');

  if (!cleaned) return '';

  if (cleaned.includes(',')) {
    const [integerPart, decimalPart = ''] = cleaned.split(',');
    const integer = integerPart.replace(/\./g, '') || '0';
    const decimal = decimalPart.replace(/\D/g, '').slice(0, 2);
    return decimalPart === '' ? `${integer}.` : `${integer}.${decimal}`;
  }

  const dotParts = cleaned.split('.');
  if (dotParts.length > 1 && dotParts.at(-1)?.length && dotParts.at(-1)!.length <= 2) {
    const decimal = dotParts.pop();
    return `${dotParts.join('') || '0'}.${decimal}`;
  }

  return cleaned.replace(/\D/g, '');
}

function formatCurrency(value: string) {
  const parsed = parseCurrencyValue(value);
  return parsed === null ? '' : currencyFormatter.format(parsed);
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  helpText,
  name,
  autoComplete = 'off',
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  const displayValue = focused ? value.replace('.', ',') : formatCurrency(value);

  return (
    <label className={`form-field ${error ? 'form-field-invalid' : ''}`} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name ?? id}
        type="text"
        inputMode="decimal"
        autoComplete={autoComplete}
        value={displayValue}
        placeholder="R$ 0,00"
        onChange={(event) => onChange(parseInput(event.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {helpText ? (
        <small className="field-help" id={helpId}>
          {helpText}
        </small>
      ) : null}
      {error ? (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
