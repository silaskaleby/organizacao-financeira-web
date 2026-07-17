import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';

interface TableActionsProps {
  label: string;
  confirmLabel?: string;
  confirmAriaLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onConfirm?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canConfirm?: boolean;
  confirmDisabled?: boolean;
  confirmTitle?: string;
}

export function TableActions({
  label,
  confirmLabel = 'Confirmar',
  confirmAriaLabel,
  onEdit,
  onDelete,
  onConfirm,
  canEdit = true,
  canDelete = true,
  canConfirm = false,
  confirmDisabled = false,
  confirmTitle,
}: TableActionsProps) {
  return (
    <div className="table-actions">
      {canConfirm ? (
        <button
          className="table-confirm-action"
          type="button"
          aria-label={confirmAriaLabel ?? `Confirmar recebimento de ${label}`}
          onClick={onConfirm}
          disabled={confirmDisabled}
          title={confirmTitle}
        >
          <CheckCircle2 size={14} />
          <span>{confirmLabel}</span>
        </button>
      ) : null}
      {canEdit ? (
        <button type="button" aria-label={`Editar ${label}`} onClick={onEdit}>
          <Pencil size={14} />
        </button>
      ) : null}
      {canDelete ? (
        <button type="button" aria-label={`Excluir ${label}`} onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}
