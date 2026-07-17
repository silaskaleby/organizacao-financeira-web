import type { BillsFlowSummary } from '../../types/bill';
import type { BillsFlowData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { ChartFrame } from './ChartFrame';

interface BillsFlowChartProps {
  data: BillsFlowData[];
  summary?: BillsFlowSummary;
}

const getFallbackSummary = (data: BillsFlowData[]): BillsFlowSummary => data.reduce(
  (totals, item) => ({
    plannedTotal: totals.plannedTotal + item.planned,
    pendingTotal: totals.pendingTotal + (item.pending ?? 0),
    paidTotal: totals.paidTotal + item.real,
    pendingCount: totals.pendingCount,
    paidCount: totals.paidCount,
  }),
  { plannedTotal: 0, pendingTotal: 0, paidTotal: 0, pendingCount: 0, paidCount: 0 },
);

export function BillsFlowChart({ data, summary }: BillsFlowChartProps) {
  const totals = summary ?? getFallbackSummary(data);
  const rows = [
    { key: 'planned', label: 'Planejado', value: totals.plannedTotal, className: 'planned-flow-bar' },
    { key: 'pending', label: 'Pendente', value: totals.pendingTotal, className: 'pending-flow-bar' },
    { key: 'paid', label: 'Pago', value: totals.paidTotal, className: 'paid-flow-bar' },
  ];
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  const hasBills = Boolean(summary) || data.length > 0;

  return (
    <ChartFrame title="Fluxo de contas">
      {hasBills ? (
        <div className="bills-flow-chart" aria-label="Fluxo de contas do mês">
          <div className="bills-flow-summary" aria-label="Resumo do fluxo de contas">
            <span>Planejado <strong>{formatCurrency(totals.plannedTotal)}</strong></span>
            <span>Pendente <strong>{formatCurrency(totals.pendingTotal)}</strong></span>
            <span>Pago <strong>{formatCurrency(totals.paidTotal)}</strong></span>
            <span>{totals.pendingCount} contas pendentes</span>
            <span>{totals.paidCount} contas pagas</span>
          </div>

          <div className="bills-flow-bars">
            {rows.map((row) => {
              const width = `${(row.value / maxValue) * 100}%`;
              return (
                <div className="bills-flow-row" key={row.key}>
                  <div className="bills-flow-row-header">
                    <span>{row.label}</span>
                    <strong>{formatCurrency(row.value)}</strong>
                  </div>
                  <div
                    className="bills-flow-track"
                    role="img"
                    aria-label={`${row.label}: ${formatCurrency(row.value)}`}
                  >
                    <span className={`bills-flow-bar ${row.className}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="chart-empty-state">
          <p>Nenhuma conta cadastrada neste mês.</p>
        </div>
      )}
    </ChartFrame>
  );
}
