import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { FinanceDashboard } from './components/dashboard/FinanceDashboard';
import { InitialSetupForm } from './components/onboarding/InitialSetupForm';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { getFriendlyAuthError } from './utils/authErrors';

const emailConfirmationPath = '/email-confirmado';

type EmailConfirmationStatus = 'validating' | 'success' | 'error';

let emailConfirmationProcess:
  | {
      url: string;
      promise: Promise<EmailConfirmationStatus>;
    }
  | null = null;

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

function cleanEmailConfirmationUrl() {
  window.history.replaceState(null, document.title, `${window.location.origin}${emailConfirmationPath}`);
}

async function processEmailConfirmationReturn() {
  const currentUrl = window.location.href;

  if (emailConfirmationProcess?.url === currentUrl) {
    return emailConfirmationProcess.promise;
  }

  emailConfirmationProcess = {
    url: currentUrl,
    promise: (async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const hasError =
        hashParams.has('error') ||
        hashParams.has('error_code') ||
        searchParams.has('error') ||
        searchParams.has('error_code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = searchParams.get('code');
      const hasImplicitSession = Boolean(accessToken && refreshToken);
      const hasConfirmationPayload = hasImplicitSession || Boolean(code);

      if (!supabase || hasError || !hasConfirmationPayload) {
        cleanEmailConfirmationUrl();
        return 'error';
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        await supabase.auth.signOut();
        cleanEmailConfirmationUrl();
        return 'success';
      } catch {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign-out failures here; the confirmation page must stay public.
        }
        cleanEmailConfirmationUrl();
        return 'error';
      }
    })(),
  };

  return emailConfirmationProcess.promise;
}

function EmailConfirmedScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  const [status, setStatus] = useState<EmailConfirmationStatus>('validating');

  useEffect(() => {
    let active = true;

    processEmailConfirmationReturn().then((result) => {
      if (active) setStatus(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const isValidating = status === 'validating';
  const isSuccess = status === 'success';

  return (
    <main className="auth-shell">
      <section
        className={`auth-card confirmation-card ${isSuccess ? '' : 'confirmation-card-neutral'}`.trim()}
        aria-live="polite"
      >
        <div className={`email-confirmation-icon ${isSuccess ? 'success' : 'neutral'}`}>
          {isValidating ? (
            <span className="loading-dot small" aria-label="Confirmando e-mail" role="status" />
          ) : isSuccess ? (
            <CheckCircle2 size={30} aria-hidden="true" />
          ) : (
            <AlertTriangle size={30} aria-hidden="true" />
          )}
        </div>
        <div className="auth-copy">
          <span>OrganizaÃ§Ã£o financeira</span>
          <h1>
            {isValidating
              ? 'Confirmando seu e-mail...'
              : isSuccess
                ? 'E-mail confirmado!'
                : 'NÃ£o foi possÃ­vel confirmar o e-mail'}
          </h1>
          <p>
            {isValidating
              ? 'Aguarde alguns instantes.'
              : isSuccess
                ? 'Seu endereÃ§o de e-mail foi validado com sucesso. Agora vocÃª jÃ¡ pode entrar na sua conta.'
                : 'O link pode estar invÃ¡lido ou expirado. Volte para a tela de login e tente criar a conta novamente ou solicitar um novo link futuramente.'}
          </p>
        </div>
        {!isValidating ? (
          <button className="primary-action" type="button" onClick={onGoToLogin}>
            {isSuccess ? 'Ir para o login' : 'Voltar para o login'}
          </button>
        ) : null}
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
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);

    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  if (currentPath === emailConfirmationPath) {
    return (
      <EmailConfirmedScreen
        onGoToLogin={() => {
          window.history.replaceState(null, document.title, window.location.origin);
          setCurrentPath('/');
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
