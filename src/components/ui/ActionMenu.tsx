import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuOption {
  label: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  label: string;
  title?: string;
  disabled?: boolean;
  options: ActionMenuOption[];
  className?: string;
  closeKey?: string | number;
}

interface MenuPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const viewportMargin = 8;
const menuWidth = 232;

export function ActionMenu({
  label,
  title,
  disabled = false,
  options,
  className,
  closeKey,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, placement: 'bottom' });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuHeight = menuRef.current?.offsetHeight ?? Math.min(320, options.length * 38 + 10);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < menuHeight + viewportMargin && spaceAbove > spaceBelow;
    const top = openAbove
      ? Math.max(viewportMargin, rect.top - menuHeight - 6)
      : Math.min(window.innerHeight - menuHeight - viewportMargin, rect.bottom + 6);
    const maxLeft = Math.max(viewportMargin, window.innerWidth - menuWidth - viewportMargin);
    const left = Math.min(maxLeft, Math.max(viewportMargin, rect.right - menuWidth));

    setPosition({ top, left, placement: openAbove ? 'top' : 'bottom' });
  }, [options.length]);

  useEffect(() => {
    if (open) setOpen(false);
    // closeKey intentionally closes the menu when parent context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeKey]);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const closeForViewportChange = () => setOpen(false);

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeForViewportChange);
    window.addEventListener('scroll', closeForViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeForViewportChange);
      window.removeEventListener('scroll', closeForViewportChange, true);
    };
  }, [open, updatePosition]);

  const toggleMenu = () => {
    if (disabled || options.length === 0) return;
    updatePosition();
    setOpen((current) => !current);
  };

  const runAction = (option: ActionMenuOption) => {
    if (option.disabled) return;
    setOpen(false);
    option.onSelect?.();
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`action-menu-button ${className ?? ''}`.trim()}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title ?? label}
        onClick={toggleMenu}
        disabled={disabled || options.length === 0}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className={`action-menu action-menu-${position.placement}`}
              role="menu"
              style={{ top: position.top, left: position.left }}
            >
              {options.map((option) => (
                <button
                  key={option.label}
                  className={option.danger ? 'danger-menu-item' : undefined}
                  type="button"
                  role="menuitem"
                  disabled={option.disabled}
                  onClick={() => runAction(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
