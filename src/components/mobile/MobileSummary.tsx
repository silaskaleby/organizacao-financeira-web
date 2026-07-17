import { AlertTriangle } from 'lucide-react';
import type { RemainingToSpendData, SummaryCardData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface MobileSummaryProps {
  cards: SummaryCardData[];
  remainingToSpend: RemainingToSpendData;
  creditUsed: number;
}

const getCard = (cards: SummaryCardData[], id: string) => cards.find((card) => card.id === id);

function MobileIndicator({ card }: { card: SummaryCardData }) {
  const Icon = card.icon;

  return (
    <article className={`mobile-indicator mobile-indicator-${card.tone}`}>
      <div>
        <span>{card.title.replace('Total | ', '')}</span>
        <strong>{formatCurrency(card.value)}</strong>
      </div>
      <Icon size={22} aria-hidden="true" />
      <small>
        {card.previousLabel}: {card.previousAvailable === false ? '-' : formatCurrency(card.previousValue)}
      </small>
      {card.secondaryLabel && typeof card.secondaryValue === 'number' ? (
        <small>
          {card.secondaryLabel}: {formatCurrency(card.secondaryValue)}
        </small>
      ) : null}
    </article>
  );
}

export function MobileSummary({ cards, remainingToSpend, creditUsed }: MobileSummaryProps) {
  const income = getCard(cards, 'income');
  const expenses = getCard(cards, 'expenses');
  const credit = getCard(cards, 'credit');
  const debit = getCard(cards, 'debit');
  const benefits = getCard(cards, 'benefits');

  return (
    <section className="mobile-summary" aria-label="Resumo financeiro do mês">
      <article className="mobile-available-card">
        <span>Restante disponível</span>
        <strong>{formatCurrency(remainingToSpend.available)}</strong>
        <small>Usado neste mês: {formatCurrency(remainingToSpend.used)}</small>
      </article>

      <div className="mobile-primary-indicators">
        {income ? <MobileIndicator card={income} /> : null}
        {expenses ? <MobileIndicator card={expenses} /> : null}
        {credit ? <MobileIndicator card={credit} /> : null}
      </div>

      <details className="mobile-secondary-indicators">
        <summary>Outros indicadores</summary>
        <div>
          {debit ? <MobileIndicator card={debit} /> : null}
          {benefits ? <MobileIndicator card={benefits} /> : null}
        </div>
      </details>

      <article className="mobile-credit-alert">
        <AlertTriangle size={18} aria-hidden="true" />
        <p>
          {creditUsed > 0
            ? `${formatCurrency(creditUsed)} em compras no crédito ainda não foram retirados do saldo atual.`
            : 'Você não possui compras no crédito neste mês.'}
        </p>
      </article>
    </section>
  );
}
