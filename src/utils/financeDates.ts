export interface FinancePeriod {
  month: number;
  year: number;
}

export interface MonthRange {
  start: string;
  end: string;
}

export const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const pad = (value: number) => String(value).padStart(2, '0');

export const toDateString = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

export const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const clampDayToMonth = (year: number, month: number, day: number) =>
  Math.min(Math.max(day, 1), getDaysInMonth(year, month));

export const getMonthStartDate = ({ year, month }: FinancePeriod) => toDateString(year, month, 1);

export const getMonthEndDate = ({ year, month }: FinancePeriod) =>
  toDateString(year, month, getDaysInMonth(year, month));

export const getMonthRange = (period: FinancePeriod): MonthRange => ({
  start: getMonthStartDate(period),
  end: getMonthEndDate(period),
});

export const getCurrentPeriod = (): FinancePeriod => {
  const today = new Date();
  return {
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  };
};

export const getPeriodFromDate = (date: string | Date): FinancePeriod => {
  if (date instanceof Date) {
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  const dateOnly = date.slice(0, 10);
  const [year, month] = dateOnly.split('-').map(Number);
  return { month, year };
};

export const getMonthLabel = ({ month }: FinancePeriod) => monthNames[month - 1] ?? '';

export const getPeriodKey = ({ year, month }: FinancePeriod) => `${year}-${pad(month)}`;

export const comparePeriods = (left: FinancePeriod, right: FinancePeriod) =>
  left.year === right.year ? left.month - right.month : left.year - right.year;

export const isPeriodBefore = (left: FinancePeriod, right: FinancePeriod) => comparePeriods(left, right) < 0;

export const isSamePeriod = (left: FinancePeriod, right: FinancePeriod) => comparePeriods(left, right) === 0;

export const getPreviousMonth = ({ year, month }: FinancePeriod): FinancePeriod =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

export const getNextMonth = ({ year, month }: FinancePeriod): FinancePeriod =>
  month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

export const eachMonthBetween = (start: FinancePeriod, end: FinancePeriod) => {
  const months: FinancePeriod[] = [];
  let cursor = start;

  while (comparePeriods(cursor, end) <= 0) {
    months.push(cursor);
    cursor = getNextMonth(cursor);
  }

  return months;
};

export const isDateInPeriod = (date: string, period: FinancePeriod) => {
  const range = getMonthRange(period);
  return date >= range.start && date <= range.end;
};

export const getDefaultEntryDate = (period: FinancePeriod) => {
  const current = getCurrentPeriod();
  if (isSamePeriod(period, current)) {
    const today = new Date();
    return toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }

  return getMonthStartDate(period);
};

export const getSalaryEntryDate = (period: FinancePeriod, salaryDay: number) =>
  toDateString(period.year, period.month, clampDayToMonth(period.year, period.month, salaryDay));

export const getAvailableYears = (start: FinancePeriod) => {
  const current = getCurrentPeriod();
  const lastYear = Math.max(current.year + 1, start.year);
  const years: number[] = [];

  for (let year = start.year; year <= lastYear; year += 1) {
    years.push(year);
  }

  return years;
};

export const formatDateBR = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

export const getTodayLabel = () => {
  const today = new Date();
  return `Hoje é ${today.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};
