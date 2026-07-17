import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFriendlyAuthError } from '../../utils/authErrors';
import { PasswordField } from './PasswordField';

interface LoginFormProps {
  onCreateAccount: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ onCreateAccount }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Informe seu e-mail.';
    if (!emailPattern.test(email.trim())) return 'Informe um e-mail válido.';
    if (!password) return 'Informe sua senha.';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);

    if (validationError) return;

    setLoading(true);

    try {
      await signIn(email.trim(), password);
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
        <h1>Entrar</h1>
        <p>Acesse seu painel pessoal com e-mail e senha.</p>
      </div>

      <label className="form-field" htmlFor="login-email">
        <span>E-mail</span>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          autoComplete="email"
        />
      </label>

      <PasswordField
        id="login-password"
        label="Senha"
        value={password}
        onChange={setPassword}
        disabled={loading}
        autoComplete="current-password"
      />

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <button className="primary-action" type="submit" disabled={loading}>
        <LogIn size={18} />
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <button className="text-action" type="button" onClick={onCreateAccount} disabled={loading}>
        Criar conta
      </button>
    </form>
  );
}
