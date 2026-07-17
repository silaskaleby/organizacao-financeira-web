import { supabase } from '../lib/supabase';
import type { ProfileFormValues, ProfilePronouns, UserSettingsProfile } from '../types/profile';

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  pronouns: ProfilePronouns | null;
  monthly_salary: number | string;
  salary_day: number;
  initial_balance: number | string;
  main_goal_name: string;
  main_goal_target_amount: number | string;
  main_goal_initial_amount: number | string;
  emergency_reserve_target_amount: number | string;
  emergency_reserve_initial_amount: number | string;
  onboarding_completed: boolean;
  created_at: string;
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  return supabase;
};

const toNumber = (value: number | string) => Number(value);

const normalizeProfile = (row: ProfileRow): UserSettingsProfile => ({
  id: row.id,
  userId: row.user_id,
  displayName: row.display_name,
  pronouns: row.pronouns,
  monthlySalary: toNumber(row.monthly_salary),
  salaryDay: row.salary_day,
  initialBalance: toNumber(row.initial_balance),
  mainGoalName: row.main_goal_name,
  mainGoalTargetAmount: toNumber(row.main_goal_target_amount),
  mainGoalInitialAmount: toNumber(row.main_goal_initial_amount),
  emergencyReserveTargetAmount: toNumber(row.emergency_reserve_target_amount),
  emergencyReserveInitialAmount: toNumber(row.emergency_reserve_initial_amount),
  onboardingCompleted: row.onboarding_completed,
  createdAt: row.created_at,
});

export async function getProfileForUser(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select(
      [
        'id',
        'user_id',
        'display_name',
        'pronouns',
        'monthly_salary',
        'salary_day',
        'initial_balance',
        'main_goal_name',
        'main_goal_target_amount',
        'main_goal_initial_amount',
        'emergency_reserve_target_amount',
        'emergency_reserve_initial_amount',
        'onboarding_completed',
        'created_at',
      ].join(','),
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeProfile(data as unknown as ProfileRow) : null;
}

export async function saveProfileForUser(userId: string, values: ProfileFormValues) {
  const client = requireSupabase();
  const payload = {
    user_id: userId,
    display_name: values.displayName.trim(),
    pronouns: values.pronouns || null,
    monthly_salary: values.monthlySalary,
    salary_day: values.salaryDay,
    initial_balance: values.initialBalance,
    main_goal_name: values.mainGoalName.trim(),
    main_goal_target_amount: values.mainGoalTargetAmount,
    main_goal_initial_amount: values.mainGoalInitialAmount,
    emergency_reserve_target_amount: values.emergencyReserveTargetAmount,
    emergency_reserve_initial_amount: values.emergencyReserveInitialAmount,
    onboarding_completed: true,
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(
      [
        'id',
        'user_id',
        'display_name',
        'pronouns',
        'monthly_salary',
        'salary_day',
        'initial_balance',
        'main_goal_name',
        'main_goal_target_amount',
        'main_goal_initial_amount',
        'emergency_reserve_target_amount',
        'emergency_reserve_initial_amount',
        'onboarding_completed',
        'created_at',
      ].join(','),
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeProfile(data as unknown as ProfileRow);
}
