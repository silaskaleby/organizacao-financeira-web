interface ChipProps {
  children: string;
  tone: string;
}

export function Chip({ children, tone }: ChipProps) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
