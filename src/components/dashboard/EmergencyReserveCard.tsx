import type { GoalCardData } from '../../types/finance';
import { ProgressCard } from './ProgressCard';

interface EmergencyReserveCardProps {
  reserve: GoalCardData;
}

export function EmergencyReserveCard({ reserve }: EmergencyReserveCardProps) {
  return <ProgressCard data={reserve} variant="reserve" />;
}
