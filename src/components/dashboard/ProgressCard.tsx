import type { GoalCardData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface ProgressCardProps {
  data: GoalCardData;
  variant: 'reserve' | 'goal';
}

export function ProgressCard({ data, variant }: ProgressCardProps) {
  const progress = data.target > 0 ? Math.min((data.totalReserved / data.target) * 100, 100) : 0;

  return (
    <article className={`progress-card progress-card-${variant}`}>
      <h2>{data.title}</h2>
      <dl>
        <div>
          <dt>{data.headline}</dt>
          <dd>{formatCurrency(data.target)}</dd>
        </div>
        <div>
          <dt>Reservado neste mes</dt>
          <dd className="strong-value">{formatCurrency(data.reservedThisMonth)}</dd>
        </div>
        <div>
          <dt>Total ja reservado</dt>
          <dd>{formatCurrency(data.totalReserved)}</dd>
        </div>
        <div>
          <dt>Faltante</dt>
          <dd>{formatCurrency(data.missing)}</dd>
        </div>
      </dl>
      <div className="progress-meter" aria-label={`${data.title}: ${progress.toFixed(0)}% concluido`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      {data.reached ? <p className="progress-complete">Meta alcancada ou superada.</p> : null}
    </article>
  );
}
