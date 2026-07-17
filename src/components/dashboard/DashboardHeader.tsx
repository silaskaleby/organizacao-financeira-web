import { LogOut, Settings } from 'lucide-react';
import type { UserProfile } from '../../types/finance';

interface DashboardHeaderProps {
  profile: UserProfile;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  signingOut?: boolean;
}

export function DashboardHeader({
  profile,
  onOpenSettings,
  onSignOut,
  signingOut = false,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-main">
        <div className="dashboard-header-copy">
          <span className="today-label">{profile.todayLabel}</span>
          <h1>Olá, {profile.name}!</h1>
          <p>{profile.motto}</p>
        </div>

        <div className="header-visual">
          <img
            className="header-brand-mark"
            src="/brand/bolso-norte-symbol.png"
            alt="Bolso Norte"
            width="837"
            height="940"
          />
        </div>
      </div>

      <div className="header-actions" aria-label="Controles do painel">
        <span className="year-pill">{profile.selectedYear}</span>
        <button
          className="icon-button"
          type="button"
          aria-label="Abrir configurações"
          onClick={onOpenSettings}
        >
          <Settings size={15} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Sair da conta"
          onClick={onSignOut}
          disabled={signingOut}
        >
          <LogOut size={15} />
        </button>
      </div>

      <div className="month-title">
        <span>Bolso Norte • {profile.selectedMonth}</span>
      </div>
    </header>
  );
}
