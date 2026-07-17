export type ProfilePronouns = 'masculine' | 'feminine' | 'neutral' | 'prefer_not_to_say';

export interface UserSettingsProfile {
  id: string;
  userId: string;
  displayName: string;
  pronouns: ProfilePronouns | null;
  monthlySalary: number;
  salaryDay: number;
  initialBalance: number;
  mainGoalName: string;
  mainGoalTargetAmount: number;
  mainGoalInitialAmount: number;
  emergencyReserveTargetAmount: number;
  emergencyReserveInitialAmount: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface ProfileFormValues {
  displayName: string;
  pronouns: ProfilePronouns | '';
  monthlySalary: number;
  salaryDay: number;
  initialBalance: number;
  mainGoalName: string;
  mainGoalTargetAmount: number;
  mainGoalInitialAmount: number;
  emergencyReserveTargetAmount: number;
  emergencyReserveInitialAmount: number;
}
