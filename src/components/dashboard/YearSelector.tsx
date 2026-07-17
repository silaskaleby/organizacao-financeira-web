import { CalendarDays } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  years: number[];
  onSelectYear?: (year: number) => void;
}

export function YearSelector({ selectedYear, years, onSelectYear }: YearSelectorProps) {
  return (
    <label className="year-selector">
      <CalendarDays size={16} aria-hidden="true" />
      <span>Ano</span>
      <select
        value={selectedYear}
        aria-label="Selecionar ano"
        onChange={(event) => onSelectYear?.(Number(event.target.value))}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
