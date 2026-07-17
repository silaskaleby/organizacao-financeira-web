import {
  investmentTypeOptions,
  isInvestmentType,
  reserveInvestmentTypeOrder,
  isReserveInvestmentType,
} from '../data/reserveInvestmentCatalog';
import { supabase } from '../lib/supabase';
import type {
  ReserveInvestmentEntryInput,
  ReserveInvestmentEntryRecord,
  InvestmentOverview,
  ReserveInvestmentType,
  ReserveInvestmentTypeSummary,
} from '../types/reserveInvestment';
import {
  eachMonthBetween,
  getMonthLabel,
  getMonthRange,
  getPeriodFromDate,
  getPeriodKey,
  type FinancePeriod,
} from '../utils/financeDates';

interface ReserveInvestmentEntryRow {
  id: string;
  user_id: string;
  name: string;
  type: ReserveInvestmentType;
  amount: number | string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const reserveInvestmentSelect = 'id,user_id,name,type,amount,entry_date,created_at,updated_at';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase nao configurado.');
  }

  return supabase;
};

const normalizeReserveInvestmentEntry = (row: ReserveInvestmentEntryRow): ReserveInvestmentEntryRecord => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  type: row.type,
  amount: Number(row.amount),
  entryDate: row.entry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sanitizeName = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed || 'Aporte';
};

const validateReserveInvestmentInput = (input: ReserveInvestmentEntryInput) => {
  if (!input.type || !isReserveInvestmentType(input.type)) {
    throw new Error('Escolha um tipo de aporte valido.');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }

  if (!input.entryDate) {
    throw new Error('Informe a data.');
  }
};

export const createEmptyReserveInvestmentTotals = () =>
  reserveInvestmentTypeOrder.reduce(
    (totals, type) => {
      totals[type] = 0;
      return totals;
    },
    {} as Record<ReserveInvestmentType, number>,
  );

export const groupReserveInvestmentTotals = (entries: ReserveInvestmentEntryRecord[]) => {
  const totals = createEmptyReserveInvestmentTotals();
  for (const entry of entries) {
    totals[entry.type] += entry.amount;
  }
  return totals;
};

export const buildReserveInvestmentSummaries = (
  monthlyEntries: ReserveInvestmentEntryRecord[],
  accumulatedEntries: ReserveInvestmentEntryRecord[],
  configs: Array<{ value: ReserveInvestmentType; label: string; tone: string; description: string }>,
): ReserveInvestmentTypeSummary[] => {
  const monthlyTotals = groupReserveInvestmentTotals(monthlyEntries);
  const accumulatedTotals = groupReserveInvestmentTotals(accumulatedEntries);

  return configs.map((config) => ({
    type: config.value,
    label: config.label,
    tone: config.tone,
    description: config.description,
    monthlyAmount: monthlyTotals[config.value],
    totalAmount: accumulatedTotals[config.value],
  }));
};

export const createEmptyInvestmentOverview = (): InvestmentOverview => ({
  monthlyInvestmentsByType: [],
  monthlyInvestedTotal: 0,
  cumulativeInvestedTotal: 0,
  investmentHistory: [],
});

export const buildInvestmentOverview = (
  monthlyEntries: ReserveInvestmentEntryRecord[],
  accumulatedEntries: ReserveInvestmentEntryRecord[],
  controlStart: FinancePeriod,
  selectedPeriod: FinancePeriod,
): InvestmentOverview => {
  const monthlyInvestments = monthlyEntries.filter((entry) => isInvestmentType(entry.type));
  const accumulatedInvestments = accumulatedEntries.filter((entry) => isInvestmentType(entry.type));
  const monthlyTotals = groupReserveInvestmentTotals(monthlyInvestments);
  const monthlyInvestmentsByType = investmentTypeOptions
    .map((config) => ({
      type: config.value,
      label: config.label,
      tone: config.tone,
      description: config.description,
      amount: monthlyTotals[config.value],
    }))
    .filter((summary) => summary.amount > 0);

  const monthlyInvestedTotal = monthlyInvestmentsByType.reduce((total, summary) => total + summary.amount, 0);
  const cumulativeInvestedTotal = accumulatedInvestments.reduce((total, entry) => total + entry.amount, 0);
  const monthlyByPeriod = new Map<string, number>();

  for (const entry of accumulatedInvestments) {
    const key = getPeriodKey(getPeriodFromDate(entry.entryDate));
    monthlyByPeriod.set(key, (monthlyByPeriod.get(key) ?? 0) + entry.amount);
  }

  let runningTotal = 0;
  const investmentHistory = eachMonthBetween(controlStart, selectedPeriod).map((period) => {
    const key = getPeriodKey(period);
    const monthlyAmount = monthlyByPeriod.get(key) ?? 0;
    runningTotal += monthlyAmount;

    return {
      key,
      label: `${getMonthLabel(period)} de ${period.year}`,
      monthlyAmount,
      cumulativeAmount: runningTotal,
    };
  });

  return {
    monthlyInvestmentsByType,
    monthlyInvestedTotal,
    cumulativeInvestedTotal,
    investmentHistory,
  };
};

export async function fetchReserveInvestmentEntries(userId: string, period: FinancePeriod) {
  const client = requireSupabase();
  const range = getMonthRange(period);
  const { data, error } = await client
    .from('reserve_investment_entries')
    .select(reserveInvestmentSelect)
    .eq('user_id', userId)
    .gte('entry_date', range.start)
    .lte('entry_date', range.end)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeReserveInvestmentEntry(row as ReserveInvestmentEntryRow));
}

export async function fetchReserveInvestmentEntriesThrough(
  userId: string,
  period: FinancePeriod,
  controlStart?: FinancePeriod,
) {
  const client = requireSupabase();
  const range = getMonthRange(period);
  let query = client
    .from('reserve_investment_entries')
    .select(reserveInvestmentSelect)
    .eq('user_id', userId)
    .lte('entry_date', range.end)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (controlStart) {
    query = query.gte('entry_date', getMonthRange(controlStart).start);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map((row) => normalizeReserveInvestmentEntry(row as ReserveInvestmentEntryRow));
}

export async function createReserveInvestmentEntry(userId: string, input: ReserveInvestmentEntryInput) {
  validateReserveInvestmentInput(input);

  const client = requireSupabase();
  const { data, error } = await client
    .from('reserve_investment_entries')
    .insert({
      user_id: userId,
      name: sanitizeName(input.name),
      type: input.type,
      amount: input.amount,
      entry_date: input.entryDate,
    })
    .select(reserveInvestmentSelect)
    .single();

  if (error) throw error;
  return normalizeReserveInvestmentEntry(data as ReserveInvestmentEntryRow);
}

export async function updateReserveInvestmentEntry(
  userId: string,
  entryId: string,
  input: ReserveInvestmentEntryInput,
) {
  validateReserveInvestmentInput(input);

  const client = requireSupabase();
  const { data, error } = await client
    .from('reserve_investment_entries')
    .update({
      name: sanitizeName(input.name),
      type: input.type,
      amount: input.amount,
      entry_date: input.entryDate,
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select(reserveInvestmentSelect)
    .single();

  if (error) throw error;
  return normalizeReserveInvestmentEntry(data as ReserveInvestmentEntryRow);
}

export async function deleteReserveInvestmentEntry(userId: string, entryId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('reserve_investment_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw error;
}
