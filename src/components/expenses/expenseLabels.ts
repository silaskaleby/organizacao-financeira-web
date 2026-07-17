import type { ExpenseCategory, ExpensePaymentMethod } from '../../types/expense';

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  gym: 'Academia',
  food: 'Alimentação',
  health_wellness: 'Saúde e bem-estar',
  transport_apps: 'Uber, 99 ou inDrive',
  market: 'Mercado',
  installment: 'Parcela',
  bills: 'Contas',
  subscriptions: 'Assinaturas',
  education: 'Educação',
  electronics: 'Eletrônicos',
  clothing_accessories: 'Vestuário e acessórios',
  restaurant: 'Restaurante',
  leisure: 'Lazer',
  fuel: 'Gasolina',
  online_shopping: 'Compras online',
  phone_plan: 'Plano de telefone',
  car_insurance: 'Seguro do carro',
  phone_insurance: 'Seguro do telefone',
  other: 'Outros',
};

export const expenseCategoryOptions = Object.entries(expenseCategoryLabels).map(([value, label]) => ({
  value: value as ExpenseCategory,
  label,
}));

export const expenseCategoryTones: Record<ExpenseCategory, string> = {
  gym: 'blue',
  food: 'benefit',
  health_wellness: 'reserve',
  transport_apps: 'currency',
  market: 'pix',
  installment: 'installment',
  bills: 'past-credit',
  subscriptions: 'credit',
  education: 'goal',
  electronics: 'physical',
  clothing_accessories: 'variable',
  restaurant: 'benefit',
  leisure: 'crypto',
  fuel: 'fixed',
  online_shopping: 'credit',
  phone_plan: 'other',
  car_insurance: 'debit',
  phone_insurance: 'debit',
  other: 'other',
};

export const paymentMethodLabels: Record<ExpensePaymentMethod, string> = {
  pix_cash: 'Pix ou dinheiro',
  debit: 'Débito',
  credit: 'Crédito',
  past_credit: 'Crédito passado',
  food_allowance: 'Vale-alimentação',
  meal_allowance: 'Vale-refeição',
};

export const paymentMethodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({
  value: value as ExpensePaymentMethod,
  label,
}));

export const paymentMethodTones: Record<ExpensePaymentMethod, string> = {
  pix_cash: 'pix',
  debit: 'debit',
  credit: 'credit',
  past_credit: 'past-credit',
  food_allowance: 'benefit',
  meal_allowance: 'benefit',
};

export const creditPaymentHelp: Partial<Record<ExpensePaymentMethod, string>> = {
  credit: 'Registre o valor que deseja acompanhar na compra ou parcela. O valor não será descontado do saldo agora.',
  past_credit: 'Use para registrar o pagamento atual de uma compra feita anteriormente no cartão.',
};

export const isEffectiveExpensePayment = (paymentMethod: ExpensePaymentMethod) =>
  paymentMethod === 'pix_cash' || paymentMethod === 'debit' || paymentMethod === 'past_credit';

export const isBenefitExpensePayment = (paymentMethod: ExpensePaymentMethod) =>
  paymentMethod === 'food_allowance' || paymentMethod === 'meal_allowance';
