import { supabase } from '../lib/supabase';
import type { ExpenseEntryInput, ExpenseEntryRecord, ExpensePaymentMethod } from '../types/expense';
import { getMonthRange, type FinancePeriod } from '../utils/financeDates';

interface ExpenseEntryRow {
  id: string;
  user_id: string;
  category: ExpenseEntryRecord['category'];
  description: string | null;
  payment_method: ExpensePaymentMethod;
  amount: number | string;
  expense_date: string;
  is_essential: boolean;
  created_at: string;
}

const expenseSelect =
  'id,user_id,category,description,payment_method,amount,expense_date,is_essential,created_at';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
};

const validateExpenseInput = (input: ExpenseEntryInput) => {
  if (!input.category) throw new Error('Escolha uma categoria.');
  if (!input.paymentMethod) throw new Error('Escolha a forma de pagamento.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }
  if (!input.expenseDate) throw new Error('Informe a data.');
};

const normalizeExpenseEntry = (row: ExpenseEntryRow): ExpenseEntryRecord => ({
  id: row.id,
  userId: row.user_id,
  category: row.category,
  description: row.description,
  paymentMethod: row.payment_method,
  amount: Number(row.amount),
  expenseDate: row.expense_date,
  isEssential: row.is_essential,
  createdAt: row.created_at,
});

export async function fetchExpenseEntries(userId: string, period: FinancePeriod) {
  const client = requireSupabase();
  const range = getMonthRange(period);
  const { data, error } = await client
    .from('expense_entries')
    .select(expenseSelect)
    .eq('user_id', userId)
    .gte('expense_date', range.start)
    .lte('expense_date', range.end)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeExpenseEntry(row as ExpenseEntryRow));
}

export async function createExpenseEntry(userId: string, input: ExpenseEntryInput) {
  validateExpenseInput(input);

  const client = requireSupabase();
  const { data, error } = await client
    .from('expense_entries')
    .insert({
      user_id: userId,
      category: input.category,
      description: input.description?.trim() || null,
      payment_method: input.paymentMethod,
      amount: input.amount,
      expense_date: input.expenseDate,
      is_essential: input.isEssential,
    })
    .select(expenseSelect)
    .single();

  if (error) throw error;
  return normalizeExpenseEntry(data as ExpenseEntryRow);
}

export async function updateExpenseEntry(userId: string, entryId: string, input: ExpenseEntryInput) {
  validateExpenseInput(input);

  const client = requireSupabase();
  const { data, error } = await client
    .from('expense_entries')
    .update({
      category: input.category,
      description: input.description?.trim() || null,
      payment_method: input.paymentMethod,
      amount: input.amount,
      expense_date: input.expenseDate,
      is_essential: input.isEssential,
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select(expenseSelect)
    .single();

  if (error) throw error;
  return normalizeExpenseEntry(data as ExpenseEntryRow);
}

export async function deleteExpenseEntry(userId: string, entryId: string) {
  const client = requireSupabase();
  const { error } = await client.from('expense_entries').delete().eq('id', entryId).eq('user_id', userId);

  if (error) throw error;
}
