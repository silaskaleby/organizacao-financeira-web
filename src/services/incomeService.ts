import { supabase } from '../lib/supabase';
import type { IncomeEntryInput, IncomeEntryRecord, SalaryConfirmationInput } from '../types/income';
import type { UserSettingsProfile } from '../types/profile';
import { getMonthRange, getSalaryEntryDate, isPeriodBefore, type FinancePeriod } from '../utils/financeDates';

interface IncomeEntryRow {
  id: string;
  user_id: string;
  type: IncomeEntryRecord['type'];
  amount: number | string;
  entry_date: string;
  status: IncomeEntryRecord['status'];
  source: IncomeEntryRecord['source'];
  notes: string | null;
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
};

const normalizeIncomeEntry = (row: IncomeEntryRow): IncomeEntryRecord => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  amount: Number(row.amount),
  entryDate: row.entry_date,
  status: row.status,
  source: row.source,
  notes: row.notes,
});

const incomeSelect = 'id,user_id,type,amount,entry_date,status,source,notes';

export async function fetchIncomeEntries(userId: string, period: FinancePeriod) {
  const client = requireSupabase();
  const range = getMonthRange(period);
  const { data, error } = await client
    .from('income_entries')
    .select(incomeSelect)
    .eq('user_id', userId)
    .gte('entry_date', range.start)
    .lte('entry_date', range.end)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeIncomeEntry(row as IncomeEntryRow));
}

export async function ensureMonthlySalaryEntry(
  userId: string,
  profile: UserSettingsProfile,
  period: FinancePeriod,
  controlStart: FinancePeriod,
) {
  if (isPeriodBefore(period, controlStart) || profile.monthlySalary <= 0 || !profile.salaryDay) {
    return;
  }

  const client = requireSupabase();
  const { error } = await client.from('income_entries').insert({
    user_id: userId,
    type: 'salary',
    source: 'salary',
    status: 'planned',
    amount: profile.monthlySalary,
    entry_date: getSalaryEntryDate(period, profile.salaryDay),
    notes: 'Salário mensal planejado',
  });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function createManualIncomeEntry(userId: string, input: IncomeEntryInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('income_entries')
    .insert({
      user_id: userId,
      type: input.type,
      source: 'manual',
      status: input.status,
      amount: input.amount,
      entry_date: input.entryDate,
      notes: input.notes?.trim() || null,
    })
    .select(incomeSelect)
    .single();

  if (error) throw error;
  return normalizeIncomeEntry(data as IncomeEntryRow);
}

export async function updateManualIncomeEntry(userId: string, entryId: string, input: IncomeEntryInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('income_entries')
    .update({
      type: input.type,
      status: input.status,
      amount: input.amount,
      entry_date: input.entryDate,
      notes: input.notes?.trim() || null,
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('source', 'manual')
    .select(incomeSelect)
    .single();

  if (error) throw error;
  return normalizeIncomeEntry(data as IncomeEntryRow);
}

export async function deleteManualIncomeEntry(userId: string, entryId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('income_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('source', 'manual');

  if (error) throw error;
}

export async function confirmSalaryIncomeEntry(
  userId: string,
  entryId: string,
  input: SalaryConfirmationInput,
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('income_entries')
    .update({
      amount: input.amount,
      entry_date: input.entryDate,
      status: 'received',
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('source', 'salary')
    .eq('type', 'salary')
    .eq('status', 'planned')
    .select(incomeSelect)
    .single();

  if (error) throw error;
  return normalizeIncomeEntry(data as IncomeEntryRow);
}
