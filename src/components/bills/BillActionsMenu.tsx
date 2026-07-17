import type { BillEntry } from '../../types/finance';
import { ActionMenu, type ActionMenuOption } from '../ui/ActionMenu';

interface BillActionsMenuProps {
  bill: BillEntry;
  disabled?: boolean;
  closeKey?: string | number;
  onEditOne?: (bill: BillEntry) => void;
  onEditSeries?: (bill: BillEntry) => void;
  onCancelMonth?: (bill: BillEntry) => void;
  onStopRepeating?: (bill: BillEntry) => void;
  onDelete?: (bill: BillEntry) => void;
}

export function BillActionsMenu({
  bill,
  disabled = false,
  closeKey,
  onEditOne,
  onEditSeries,
  onCancelMonth,
  onStopRepeating,
  onDelete,
}: BillActionsMenuProps) {
  const options: ActionMenuOption[] = bill.recurring
    ? bill.status === 'pending'
      ? [
          { label: 'Editar somente este mês', onSelect: () => onEditOne?.(bill) },
          { label: 'Editar este e os próximos', onSelect: () => onEditSeries?.(bill) },
          { label: 'Remover somente este mês', onSelect: () => onCancelMonth?.(bill), danger: true },
          { label: 'Parar de repetir a partir do próximo mês', onSelect: () => onStopRepeating?.(bill) },
        ]
      : [
          { label: 'Editar este e os próximos', onSelect: () => onEditSeries?.(bill) },
          { label: 'Parar de repetir a partir do próximo mês', onSelect: () => onStopRepeating?.(bill) },
        ]
    : [
        { label: 'Editar conta', onSelect: () => onEditOne?.(bill) },
        { label: 'Excluir conta', onSelect: () => onDelete?.(bill), danger: true },
      ];

  return (
    <ActionMenu
      label={`Abrir menu de ações de ${bill.name}`}
      title={`Ações de ${bill.name}`}
      disabled={disabled}
      options={options}
      closeKey={closeKey}
    />
  );
}
