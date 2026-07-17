import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryAllocationData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { ChartFrame } from './ChartFrame';

interface CategoryAllocationChartProps {
  data: CategoryAllocationData[];
}

export function CategoryAllocationChart({ data }: CategoryAllocationChartProps) {
  return (
    <ChartFrame title="Alocação de categorias">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 22, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="category" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
              cursor={{ fill: 'rgba(15, 76, 92, 0.06)' }}
            />
            <Bar
              dataKey="amount"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
              barSize={42}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty-state">
          <p>Nenhum gasto cadastrado neste mês.</p>
        </div>
      )}
    </ChartFrame>
  );
}
