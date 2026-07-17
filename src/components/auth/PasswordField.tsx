import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <div className="password-control">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}
