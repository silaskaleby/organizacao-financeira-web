import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { SummaryCardData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  card: SummaryCardData;
}

export function SummaryCard({ card }: SummaryCardProps) {
  const Icon = card.icon;
  const TrendIcon =
    card.trend === 'up' ? ArrowUpRight : card.trend === 'down' ? ArrowDownRight : ArrowRight;
  const trendLabel = card.previousAvailable === false
    ? 'Sem mês anterior para comparação'
    : card.trend === 'up'
      ? 'Aumento em relação ao mês anterior'
      : card.trend === 'down'
        ? 'Redução em relação ao mês anterior'
        : 'Sem alteração em relação ao mês anterior';

  return (
    <article className={`summary-card summary-${card.tone}`}>
      <div className="summary-title-row">
        <h2>{card.title}</h2>
        <Icon size={15} aria-hidden="true" />
      </div>
      <div className="summary-value-row">
        <strong>{formatCurrency(card.value)}</strong>
        <span className={`trend trend-${card.trend}`} aria-label={trendLabel} title={trendLabel}>
          <TrendIcon size={15} aria-hidden="true" />
        </span>
      </div>
      <div className="summary-previous">
        <span>{card.previousLabel}</span>
        <strong>{card.previousAvailable === false ? '-' : formatCurrency(card.previousValue)}</strong>
      </div>
      {card.secondaryLabel && typeof card.secondaryValue === 'number' ? (
        <div className="summary-previous summary-secondary">
          <span>{card.secondaryLabel}</span>
          <strong>{formatCurrency(card.secondaryValue)}</strong>
        </div>
      ) : null}
    </article>
  );
}
