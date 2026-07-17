import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface TableSectionProps {
  title: string;
  actionLabel: string;
  children: ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function TableSection({ title, actionLabel, children, onAction, actionDisabled = false }: TableSectionProps) {
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h2>{title}</h2>
        <button type="button" onClick={onAction} disabled={actionDisabled}>
          <Plus size={14} aria-hidden="true" />
          {actionLabel}
        </button>
      </div>
      <div className="table-scroll">{children}</div>
    </section>
  );
}
