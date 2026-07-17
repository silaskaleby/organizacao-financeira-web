import { Check, Clock3, Repeat2 } from 'lucide-react';
import type { BillEntry } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface UpcomingBillsProps {
  bills: BillEntry[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <section className="mobile-upcoming table-card" aria-label="Próximas contas">
      <div className="table-card-header">
        <h2>Próximas contas</h2>
      </div>

      <div className="mobile-upcoming-list">
        {bills.length === 0 ? <p className="mobile-empty-text">Nenhuma conta para este mês.</p> : null}
        {bills.map((bill) => (
          <article className="mobile-upcoming-item" key={bill.id}>
            <span className={bill.status === 'paid' ? 'status-badge yes' : 'status-badge pending'}>
              {bill.status === 'paid' ? <Check size={15} /> : <Clock3 size={15} />}
            </span>
            <div>
              <strong>{bill.name}</strong>
              <small>{bill.status === 'paid' ? `Pago em ${bill.paidDate}` : `Vence em ${bill.dueDate ?? '-'}`}</small>
            </div>
            <div className="mobile-upcoming-money">
              <strong>{formatCurrency(bill.status === 'paid' ? bill.real : bill.planned)}</strong>
              {bill.recurring ? <Repeat2 size={15} aria-label="Recorrente" /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
