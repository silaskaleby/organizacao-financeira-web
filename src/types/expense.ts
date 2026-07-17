export type ExpenseCategory =
  | 'gym'
  | 'food'
  | 'health_wellness'
  | 'transport_apps'
  | 'market'
  | 'installment'
  | 'bills'
  | 'subscriptions'
  | 'education'
  | 'electronics'
  | 'clothing_accessories'
  | 'restaurant'
  | 'leisure'
  | 'fuel'
  | 'online_shopping'
  | 'phone_plan'
  | 'car_insurance'
  | 'phone_insurance'
  | 'other';

export type ExpensePaymentMethod =
  | 'pix_cash'
  | 'debit'
  | 'credit'
  | 'past_credit'
  | 'food_allowance'
  | 'meal_allowance';

export interface ExpenseEntryRecord {
  id: string;
  userId: string;
  category: ExpenseCategory;
  description: string | null;
  paymentMethod: ExpensePaymentMethod;
  amount: number;
  expenseDate: string;
  isEssential: boolean;
  createdAt: string;
}

export interface ExpenseEntryInput {
  category: ExpenseCategory;
  description?: string | null;
  paymentMethod: ExpensePaymentMethod;
  amount: number;
  expenseDate: string;
  isEssential: boolean;
}
