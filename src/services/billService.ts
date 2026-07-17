import { supabase } from '../lib/supabase';
import type {
  BillEntryRecord,
  BillInput,
  BillOccurrenceInput,
  PayBillInput,
  RecurringBillTemplateInput,
  RecurringBillTemplateRecord,
} from '../types/bill';
import {
  clampDayToMonth,
  comparePeriods,
  getMonthRange,
  getPeriodFromDate,
  toDateString,
  type FinancePeriod,
} from '../utils/financeDates';

interface BillRow {
  id: string;
  user_id: string;
  name: string;
  planned_amount: number | string;
  paid_amount: number | string | null;
  due_date: string;
  paid_date: string | null;
  status: BillEntryRecord['status'];
  is_recurring: boolean;
  recurrence_source_id: string | null;
  is_cancelled: boolean;
  created_at: string;
}

interface RecurringBillTemplateRow {
  id: string;
  user_id: string;
  name: string;
  planned_amount: number | string;
  due_day: number;
  is_active: boolean;
  created_at: string;
}

const billSelect =
  'id,user_id,name,planned_amount,paid_amount,due_date,paid_date,status,is_recurring,recurrence_source_id,is_cancelled,created_at';
const templateSelect = 'id,user_id,name,planned_amount,due_day,is_active,created_at';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
};

const normalizeBill = (row: BillRow): BillEntryRecord => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  plannedAmount: Number(row.planned_amount),
  paidAmount: row.paid_amount === null ? null : Number(row.paid_amount),
  dueDate: row.due_date,
  paidDate: row.paid_date,
  status: row.status,
  isRecurring: row.is_recurring,
  recurrenceSourceId: row.recurrence_source_id,
  isCancelled: row.is_cancelled,
  createdAt: row.created_at,
});

const normalizeTemplate = (row: RecurringBillTemplateRow): RecurringBillTemplateRecord => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  plannedAmount: Number(row.planned_amount),
  dueDay: row.due_day,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const validateBillName = (name: string) => {
  if (!name.trim()) throw new Error('Informe o nome da conta.');
};

const validateAmount = (amount: number, message = 'Informe um valor maior que zero.') => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(message);
};

const getRecurringDueDate = (period: FinancePeriod, dueDay: number) =>
  toDateString(period.year, period.month, clampDayToMonth(period.year, period.month, dueDay));

export async function fetchBills(userId: string, period: FinancePeriod) {
  const client = requireSupabase();
  const range = getMonthRange(period);
  const { data, error } = await client
    .from('bills')
    .select(billSelect)
    .eq('user_id', userId)
    .eq('is_cancelled', false)
    .gte('due_date', range.start)
    .lte('due_date', range.end)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeBill(row as BillRow));
}

export async function fetchRecurringBillTemplate(userId: string, templateId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('recurring_bill_templates')
    .select(templateSelect)
    .eq('user_id', userId)
    .eq('id', templateId)
    .single();

  if (error) throw error;
  return normalizeTemplate(data as RecurringBillTemplateRow);
}

export async function ensureRecurringBillOccurrences(
  userId: string,
  period: FinancePeriod,
  controlStart: FinancePeriod,
) {
  if (comparePeriods(period, controlStart) < 0) return;

  const client = requireSupabase();
  const { data: templatesData, error: templatesError } = await client
    .from('recurring_bill_templates')
    .select(templateSelect)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (templatesError) throw templatesError;
  const templates = (templatesData ?? []).map((row) => normalizeTemplate(row as RecurringBillTemplateRow));
  if (templates.length === 0) return;

  const templateIds = templates.map((template) => template.id);
  const { data: occurrencesData, error: occurrencesError } = await client
    .from('bills')
    .select('recurrence_source_id,due_date')
    .eq('user_id', userId)
    .in('recurrence_source_id', templateIds)
    .order('due_date', { ascending: true });

  if (occurrencesError) throw occurrencesError;

  const firstOccurrenceByTemplate = new Map<string, FinancePeriod>();
  for (const row of (occurrencesData ?? []) as Array<{ recurrence_source_id: string | null; due_date: string }>) {
    if (!row.recurrence_source_id || firstOccurrenceByTemplate.has(row.recurrence_source_id)) continue;
    firstOccurrenceByTemplate.set(row.recurrence_source_id, getPeriodFromDate(row.due_date));
  }

  await Promise.all(
    templates.map(async (template) => {
      const startPeriod = firstOccurrenceByTemplate.get(template.id) ?? getPeriodFromDate(template.createdAt);
      if (comparePeriods(period, startPeriod) < 0) return;

      const { error } = await client.from('bills').insert({
        user_id: userId,
        name: template.name,
        planned_amount: template.plannedAmount,
        due_date: getRecurringDueDate(period, template.dueDay),
        status: 'pending',
        is_recurring: true,
        recurrence_source_id: template.id,
        is_cancelled: false,
      });

      if (error && error.code !== '23505') throw error;
    }),
  );
}

export async function createBill(userId: string, input: BillInput, period: FinancePeriod) {
  validateBillName(input.name);
  validateAmount(input.plannedAmount);

  if (input.isRecurring) {
    const client = requireSupabase();
    const dueDay = getPeriodFromDate(input.dueDate).month === period.month
      ? Number(input.dueDate.slice(8, 10))
      : 1;
    const { data: templateData, error: templateError } = await client
      .from('recurring_bill_templates')
      .insert({
        user_id: userId,
        name: input.name.trim(),
        planned_amount: input.plannedAmount,
        due_day: dueDay,
        is_active: true,
      })
      .select(templateSelect)
      .single();

    if (templateError) throw templateError;
    const template = normalizeTemplate(templateData as RecurringBillTemplateRow);

    const { data, error } = await client
      .from('bills')
      .insert({
        user_id: userId,
        name: template.name,
        planned_amount: template.plannedAmount,
        due_date: input.dueDate,
        status: 'pending',
        is_recurring: true,
        recurrence_source_id: template.id,
        is_cancelled: false,
      })
      .select(billSelect)
      .single();

    if (error) throw error;
    return normalizeBill(data as BillRow);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('bills')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      planned_amount: input.plannedAmount,
      due_date: input.dueDate,
      status: 'pending',
      is_recurring: false,
      recurrence_source_id: null,
      is_cancelled: false,
    })
    .select(billSelect)
    .single();

  if (error) throw error;
  return normalizeBill(data as BillRow);
}

export async function updateBillOccurrence(userId: string, billId: string, input: BillOccurrenceInput) {
  validateBillName(input.name);
  validateAmount(input.plannedAmount);

  const client = requireSupabase();
  const { data, error } = await client
    .from('bills')
    .update({
      name: input.name.trim(),
      planned_amount: input.plannedAmount,
      due_date: input.dueDate,
    })
    .eq('id', billId)
    .eq('user_id', userId)
    .eq('is_cancelled', false)
    .select(billSelect)
    .single();

  if (error) throw error;
  return normalizeBill(data as BillRow);
}

export async function payBill(userId: string, billId: string, input: PayBillInput) {
  validateAmount(input.paidAmount, 'Informe o valor pago.');
  if (!input.paidDate) throw new Error('Informe a data do pagamento.');

  const client = requireSupabase();
  const { data, error } = await client
    .from('bills')
    .update({
      status: 'paid',
      paid_amount: input.paidAmount,
      paid_date: input.paidDate,
    })
    .eq('id', billId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('is_cancelled', false)
    .select(billSelect)
    .single();

  if (error) throw error;
  return normalizeBill(data as BillRow);
}

export async function deleteStandaloneBill(userId: string, billId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('bills')
    .delete()
    .eq('id', billId)
    .eq('user_id', userId)
    .eq('is_recurring', false)
    .eq('is_cancelled', false);

  if (error) throw error;
}

export async function updateRecurringBillTemplate(
  userId: string,
  templateId: string,
  input: RecurringBillTemplateInput,
) {
  validateBillName(input.name);
  validateAmount(input.plannedAmount);

  if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31) {
    throw new Error('Informe um dia de vencimento entre 1 e 31.');
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('recurring_bill_templates')
    .update({
      name: input.name.trim(),
      planned_amount: input.plannedAmount,
      due_day: input.dueDay,
    })
    .eq('id', templateId)
    .eq('user_id', userId)
    .select(templateSelect)
    .single();

  if (error) throw error;
  return normalizeTemplate(data as RecurringBillTemplateRow);
}

export async function updateRecurringBillSeries(
  userId: string,
  templateId: string,
  fromDueDate: string,
  input: RecurringBillTemplateInput,
) {
  validateBillName(input.name);
  validateAmount(input.plannedAmount);

  if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31) {
    throw new Error('Informe um dia de vencimento entre 1 e 31.');
  }

  const client = requireSupabase();
  const normalizedName = input.name.trim();

  const { data: templateData, error: templateError } = await client
    .from('recurring_bill_templates')
    .update({
      name: normalizedName,
      planned_amount: input.plannedAmount,
      due_day: input.dueDay,
    })
    .eq('id', templateId)
    .eq('user_id', userId)
    .select(templateSelect)
    .single();

  if (templateError) throw templateError;

  const { data: billsData, error: billsError } = await client
    .from('bills')
    .select('id,due_date')
    .eq('user_id', userId)
    .eq('recurrence_source_id', templateId)
    .eq('status', 'pending')
    .eq('is_cancelled', false)
    .gte('due_date', fromDueDate);

  if (billsError) throw billsError;

  await Promise.all(
    ((billsData ?? []) as Array<{ id: string; due_date: string }>).map(async (bill) => {
      const billPeriod = getPeriodFromDate(bill.due_date);
      const { error } = await client
        .from('bills')
        .update({
          name: normalizedName,
          planned_amount: input.plannedAmount,
          due_date: getRecurringDueDate(billPeriod, input.dueDay),
        })
        .eq('id', bill.id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('is_cancelled', false);

      if (error) throw error;
    }),
  );

  return normalizeTemplate(templateData as RecurringBillTemplateRow);
}

export async function cancelRecurringBillMonth(userId: string, billId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('bills')
    .update({ is_cancelled: true })
    .eq('id', billId)
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .eq('status', 'pending')
    .eq('is_cancelled', false)
    .select(billSelect)
    .single();

  if (error) throw error;
  return normalizeBill(data as BillRow);
}

export async function stopRepeatingAfterCurrentMonth(
  userId: string,
  templateId: string,
  currentDueDate: string,
) {
  const client = requireSupabase();
  const { data: templateData, error: templateError } = await client
    .from('recurring_bill_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('user_id', userId)
    .select(templateSelect)
    .single();

  if (templateError) throw templateError;

  const { error: futureBillsError } = await client
    .from('bills')
    .update({ is_cancelled: true })
    .eq('user_id', userId)
    .eq('recurrence_source_id', templateId)
    .eq('status', 'pending')
    .eq('is_cancelled', false)
    .gt('due_date', currentDueDate);

  if (futureBillsError) throw futureBillsError;
  return normalizeTemplate(templateData as RecurringBillTemplateRow);
}

export async function deactivateRecurringBillTemplate(userId: string, templateId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('recurring_bill_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('user_id', userId)
    .select(templateSelect)
    .single();

  if (error) throw error;
  return normalizeTemplate(data as RecurringBillTemplateRow);
}
