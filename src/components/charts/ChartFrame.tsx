import type { ReactNode } from 'react';

interface ChartFrameProps {
  title: string;
  children: ReactNode;
}

export function ChartFrame({ title, children }: ChartFrameProps) {
  return (
    <section className="chart-frame">
      <h2>{title}</h2>
      <div className="chart-body">{children}</div>
    </section>
  );
}
