import { AlertTriangle } from 'lucide-react';
import type { SummaryCardData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { SummaryCard } from './SummaryCard';

interface SummaryCardsProps {
  cards: SummaryCardData[];
  creditUsed: number;
}

export function SummaryCards({ cards, creditUsed }: SummaryCardsProps) {
  return (
    <div className="summary-strip">
      {cards.map((card) => (
        <SummaryCard key={card.id} card={card} />
      ))}
      <article className="credit-alert">
        <div>
          <h2>Alerta crédito</h2>
          <AlertTriangle size={16} aria-hidden="true" />
        </div>
        <p>
          {creditUsed > 0
            ? `${formatCurrency(creditUsed)} em compras no crédito ainda não foram retirados do saldo atual.`
            : 'Você não possui compras no crédito neste mês.'}
        </p>
      </article>
    </div>
  );
}
