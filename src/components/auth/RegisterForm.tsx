import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFriendlyAuthError } from '../../utils/authErrors';
import { PasswordField } from './PasswordField';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onConfirmationPending: (email: string) => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({ onBackToLogin, onConfirmationPending }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Informe seu e-mail.';
    if (!emailPattern.test(email.trim())) return 'Informe um e-mail válido.';
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (confirmPassword !== password) return 'A confirmação precisa ser igual à senha.';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);

    if (validationError) return;

    setLoading(true);

    try {
      const result = await signUp(email.trim(), password);
      if (result === 'confirmation-required') {
        onConfirmationPending(email.trim());
      }
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <img
        className="auth-brand-logo"
        src="/brand/bolso-norte-logo-horizontal.png"
        alt="Bolso Norte"
        width="1956"
        height="582"
      />
      <div className="auth-copy">
        <span className="visually-hidden">Bolso Norte</span>
        <h1>Criar conta</h1>
        <p>Use um e-mail válido e uma senha com pelo menos 8 caracteres.</p>
      </div>

      <label className="form-field" htmlFor="register-email">
        <span>E-mail</span>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          autoComplete="email"
        />
      </label>

      <PasswordField
        id="register-password"
        label="Senha"
        value={password}
        onChange={setPassword}
        disabled={loading}
        autoComplete="new-password"
      />

      <PasswordField
        id="register-confirm-password"
        label="Confirmar senha"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={loading}
        autoComplete="new-password"
      />

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <button className="primary-action" type="submit" disabled={loading}>
        <UserPlus size={18} />
        {loading ? 'Criando...' : 'Criar conta'}
      </button>

      <button className="text-action" type="button" onClick={onBackToLogin} disabled={loading}>
        Voltar ao login
      </button>
    </form>
  );
}
