import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { RemainingToSpendData } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { ChartFrame } from './ChartFrame';

interface RemainingToSpendChartProps {
  data: RemainingToSpendData;
}

export function RemainingToSpendChart({ data }: RemainingToSpendChartProps) {
  const safeAvailable = Math.max(data.available, 0);
  const safeUsed = Math.max(data.used, 0);
  const fallbackValue = safeAvailable === 0 && safeUsed === 0 ? 1 : 0;
  const chartData = [
    { name: 'Disponível', value: safeAvailable || fallbackValue },
    { name: 'Utilizado', value: safeUsed },
  ];

  return (
    <ChartFrame title="Restante para gastar">
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="var(--accent)" />
              <Cell fill="var(--neutral-300)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <strong className={data.available < 0 ? 'negative-balance' : undefined}>{formatCurrency(data.available)}</strong>
      </div>
    </ChartFrame>
  );
}
