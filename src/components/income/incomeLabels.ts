import type { IncomeEntryStatus, IncomeEntryType } from '../../types/income';

export const incomeTypeLabels: Record<IncomeEntryType, string> = {
  salary: 'Salário',
  extra_income: 'Renda extra',
  recurring_income: 'Ganho periódico',
  food_allowance: 'Vale-alimentação',
  meal_allowance: 'Vale-refeição',
  other: 'Outros',
};

export const incomeStatusLabels: Record<IncomeEntryStatus, string> = {
  planned: 'Planejada',
  received: 'Recebida',
};

export const incomeTypeOptions = [
  { value: 'extra_income', label: incomeTypeLabels.extra_income },
  { value: 'recurring_income', label: incomeTypeLabels.recurring_income },
  { value: 'food_allowance', label: incomeTypeLabels.food_allowance },
  { value: 'meal_allowance', label: incomeTypeLabels.meal_allowance },
  { value: 'other', label: incomeTypeLabels.other },
] satisfies Array<{ value: IncomeEntryType; label: string }>;

export const getIncomeTone = (type: IncomeEntryType) => {
  if (type === 'salary') return 'salary';
  if (type === 'extra_income') return 'extra';
  if (type === 'recurring_income') return 'blue';
  if (type === 'food_allowance' || type === 'meal_allowance') return 'benefit';
  return 'other';
};
