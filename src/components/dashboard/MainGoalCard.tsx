import type { GoalCardData } from '../../types/finance';
import { ProgressCard } from './ProgressCard';

interface MainGoalCardProps {
  goal: GoalCardData;
}

export function MainGoalCard({ goal }: MainGoalCardProps) {
  return <ProgressCard data={goal} variant="goal" />;
}
