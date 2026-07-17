import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { FinanceDashboard } from './components/dashboard/FinanceDashboard';
import { InitialSetupForm } from './components/onboarding/InitialSetupForm';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getFriendlyAuthError } from './utils/authErrors';

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="auth-shell">
      <section className="loading-card" aria-live="polite">
        <span className="loading-dot" aria-hidden="true" />
        <h1>{message}</h1>
      </section>
    </main>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

function ConfirmationPendingScreen({
  email,
  onBackToLogin,
}: {
  email: string;
  onBackToLogin: () => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card confirmation-card">
        <CheckCircle2 size={38} aria-hidden="true" />
        <div className="auth-copy">
          <span>Cadastro enviado</span>
          <h1>Conta criada! Verifique seu e-mail</h1>
          <p>Enviamos um link de confirmação para o endereço informado. Confirme seu e-mail e depois volte para entrar.</p>
        </div>
        <p className="email-hint">{maskEmail(email)}</p>
        <p className="form-message form-message-success">O link pode demorar alguns instantes para chegar.</p>
        <button className="primary-action" type="button" onClick={onBackToLogin}>
          Voltar para o login
        </button>
      </section>
    </main>
  );
}

function AuthGate() {
  const { status, session, profile, profileError, signOut, saveProfile } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'confirmation-pending'>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  if (status === 'loading-session') {
    return <LoadingScreen message="Verificando sessão..." />;
  }

  if (status === 'loading-profile') {
    return <LoadingScreen message="Carregando perfil..." />;
  }

  if (status === 'unavailable') {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-copy">
            <span>Configuração</span>
            <h1>Supabase indisponível</h1>
            <p>Configure as variáveis do Supabase para usar login e cadastro.</p>
          </div>
        </section>
      </main>
    );
  }

  if (status === 'signed-out') {
    if (authMode === 'confirmation-pending') {
      return (
        <ConfirmationPendingScreen
          email={pendingEmail}
          onBackToLogin={() => {
            setPendingEmail('');
            setAuthMode('login');
          }}
        />
      );
    }

    return (
      <main className="auth-shell">
        {authMode === 'login' ? (
          <LoginForm onCreateAccount={() => setAuthMode('register')} />
        ) : (
          <RegisterForm
            onBackToLogin={() => setAuthMode('login')}
            onConfirmationPending={(email) => {
              setPendingEmail(email);
              setAuthMode('confirmation-pending');
            }}
          />
        )}
      </main>
    );
  }

  if (status === 'needs-onboarding') {
    return (
      <>
        {profileError ? <p className="floating-error">{profileError}</p> : null}
        <InitialSetupForm />
      </>
    );
  }

  if (!profile) {
    return <LoadingScreen message="Preparando painel..." />;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    setDashboardError('');

    try {
      await signOut();
    } catch (error) {
      setDashboardError(getFriendlyAuthError(error));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      {dashboardError ? <p className="floating-error">{dashboardError}</p> : null}
      <FinanceDashboard
        profile={profile}
        userId={session?.user.id ?? profile.userId}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
      {settingsOpen ? (
        <SettingsModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSave={async (values) => {
            await saveProfile(values);
          }}
        />
      ) : null}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
