import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { BillsFlowSummary } from '../../types/bill';
import type { BillsFlowData, CategoryAllocationData, RemainingToSpendData } from '../../types/finance';
import { BillsFlowChart } from '../charts/BillsFlowChart';
import { CategoryAllocationChart } from '../charts/CategoryAllocationChart';
import { RemainingToSpendChart } from '../charts/RemainingToSpendChart';

interface CollapsibleChartsProps {
  remainingToSpend: RemainingToSpendData;
  billsFlow: BillsFlowData[];
  billsFlowSummary: BillsFlowSummary;
  categoryAllocation: CategoryAllocationData[];
}

export function CollapsibleCharts({
  remainingToSpend,
  billsFlow,
  billsFlowSummary,
  categoryAllocation,
}: CollapsibleChartsProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mobile-collapsible-charts" aria-label="Gráficos do mês">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span>
          <BarChart3 size={18} />
          Gráficos do mês
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open ? (
        <div className="mobile-chart-stack">
          <div className="chart-panel chart-panel-large">
            <RemainingToSpendChart data={remainingToSpend} />
          </div>
          <div className="chart-panel">
            <BillsFlowChart data={billsFlow} summary={billsFlowSummary} />
          </div>
          <div className="chart-panel">
            <CategoryAllocationChart data={categoryAllocation} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
