interface MonthNavigatorProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth?: (month: number) => void;
  disabledMonths?: Set<number>;
}

export function MonthNavigator({
  months,
  selectedMonth,
  onSelectMonth,
  disabledMonths,
}: MonthNavigatorProps) {
  return (
    <nav className="month-tabs" aria-label="Meses">
      {months.map((month, index) => {
        const monthNumber = index + 1;
        const disabled = disabledMonths?.has(monthNumber) ?? false;

        return (
          <button
            className={month === selectedMonth ? 'month-tab active' : 'month-tab'}
            key={month}
            type="button"
            aria-pressed={month === selectedMonth}
            disabled={disabled}
            onClick={() => onSelectMonth?.(monthNumber)}
            title={disabled ? 'Mês anterior ao início do controle financeiro' : undefined}
          >
            {month}
          </button>
        );
      })}
    </nav>
  );
}
