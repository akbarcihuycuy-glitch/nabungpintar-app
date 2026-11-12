import { SavingsGoal, SavingsEntry } from '../types/database';
import { getWIBDate } from './formatters';

export interface GoalProjectionResult {
  sisa: number;
  percentage: number;
  isCompleted: boolean;
  canProject: boolean;
  status: 'Tercapai' | 'Sesuai jalur' | 'Terlambat' | 'Belum bisa diproyeksikan';
  statusBadgeColor: 'income' | 'warning' | 'primary' | 'expense';
  isEarlyEstimate: boolean; // true if < 14 days or < 2 entries
  projectedDate: string | null; // YYYY-MM-DD or formatted
  projectedDateFormatted: string;
  daysNeeded: number | null;
  monthlyDepositNeeded: number;
  daysDiffWithDeadline: number | null;
  chartData: Array<{
    date: string;
    label: string;
    actual?: number;
    projected?: number;
    target: number;
  }>;
}

export function calculateGoalProjection(
  goal: SavingsGoal,
  entries: SavingsEntry[]
): GoalProjectionResult {
  const goalEntries = entries
    .filter((e) => e.goal_id === goal.id)
    .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));

  const currentAmount = goal.current_amount || 0;
  const targetAmount = goal.target_amount;
  const sisa = Math.max(0, targetAmount - currentAmount);
  const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

  // 1. If sisa <= 0: status 'Tercapai'
  if (sisa <= 0 || percentage >= 100) {
    return {
      sisa: 0,
      percentage: 100,
      isCompleted: true,
      canProject: true,
      status: 'Tercapai',
      statusBadgeColor: 'income',
      isEarlyEstimate: false,
      projectedDate: getWIBDate(),
      projectedDateFormatted: 'Tercapai!',
      daysNeeded: 0,
      monthlyDepositNeeded: 0,
      daysDiffWithDeadline: 0,
      chartData: [
        { date: goal.created_at.split('T')[0], label: 'Mulai', actual: 0, target: targetAmount },
        { date: getWIBDate(), label: 'Hari ini', actual: currentAmount, target: targetAmount },
      ],
    };
  }

  // Calculate days since first entry
  const today = new Date();
  const todayStr = getWIBDate(today);

  // 60-day window for laju_hari
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoStr = getWIBDate(sixtyDaysAgo);

  let netSaved60Days = 0;
  for (const e of goalEntries) {
    if (e.occurred_on >= sixtyDaysAgoStr && e.occurred_on <= todayStr) {
      netSaved60Days += e.kind === 'topup' ? e.amount : -e.amount;
    }
  }

  let daysSinceFirstEntry = 1;
  if (goalEntries.length > 0) {
    const firstDate = new Date(goalEntries[0].occurred_on);
    daysSinceFirstEntry = Math.max(
      1,
      Math.round((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  const denominatorDays = Math.min(60, Math.max(1, daysSinceFirstEntry));
  const lajuHari = netSaved60Days > 0 ? netSaved60Days / denominatorDays : 0;

  // Monthly deposit needed based on deadline if available
  let monthlyDepositNeeded = 0;
  let daysToDeadline = 0;
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    daysToDeadline = Math.max(
      1,
      Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    const monthsToDeadline = Math.max(1, daysToDeadline / 30);
    monthlyDepositNeeded = Math.round(sisa / monthsToDeadline);
  } else {
    // Default 12-month suggestion if no deadline
    monthlyDepositNeeded = Math.round(sisa / 12);
  }

  // Check minimum data requirement (Section 3.6 point 6)
  const isEarlyEstimate = daysSinceFirstEntry < 14 || goalEntries.length < 2;

  // 2. If no entries or laju_hari <= 0
  if (goalEntries.length === 0 || lajuHari <= 0) {
    return {
      sisa,
      percentage,
      isCompleted: false,
      canProject: false,
      status: 'Belum bisa diproyeksikan',
      statusBadgeColor: 'warning',
      isEarlyEstimate: true,
      projectedDate: null,
      projectedDateFormatted: 'Belum bisa diproyeksikan',
      daysNeeded: null,
      monthlyDepositNeeded,
      daysDiffWithDeadline: null,
      chartData: [
        { date: goal.created_at.split('T')[0], label: 'Awal', actual: 0, target: targetAmount },
        { date: todayStr, label: 'Hari ini', actual: currentAmount, target: targetAmount },
        ...(goal.deadline
          ? [{ date: goal.deadline, label: 'Tenggat', projected: targetAmount, target: targetAmount }]
          : []),
      ],
    };
  }

  // 3. Days needed = CEIL(sisa / laju_hari)
  const daysNeeded = Math.ceil(sisa / lajuHari);

  // 4. Projected date = today + daysNeeded
  const projDate = new Date(today);
  projDate.setDate(projDate.getDate() + daysNeeded);
  const projDateStr = getWIBDate(projDate);

  const tenYearsInDays = 365 * 10;
  const isOver10Years = daysNeeded > tenYearsInDays;

  let status: GoalProjectionResult['status'] = 'Sesuai jalur';
  let statusBadgeColor: GoalProjectionResult['statusBadgeColor'] = 'primary';
  let daysDiffWithDeadline: number | null = null;

  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    daysDiffWithDeadline = Math.round(
      (deadlineDate.getTime() - projDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (projDateStr <= goal.deadline) {
      status = 'Sesuai jalur';
      statusBadgeColor = 'income';
    } else {
      status = 'Terlambat';
      statusBadgeColor = 'warning';
    }
  } else {
    status = 'Sesuai jalur';
    statusBadgeColor = 'primary';
  }

  // Format projected date text
  let projectedDateFormatted = '';
  if (isOver10Years) {
    projectedDateFormatted = 'Lebih dari 10 tahun';
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    projectedDateFormatted = `${projDate.getDate()} ${months[projDate.getMonth()]} ${projDate.getFullYear()}`;
  }

  // Chart data: line of actual entries, then dashed projection to target
  const chartData: GoalProjectionResult['chartData'] = [];

  // Start point
  chartData.push({
    date: goalEntries[0]?.occurred_on || goal.created_at.split('T')[0],
    label: 'Mulai',
    actual: 0,
    target: targetAmount,
  });

  // Current actual point
  chartData.push({
    date: todayStr,
    label: 'Hari ini',
    actual: currentAmount,
    projected: currentAmount,
    target: targetAmount,
  });

  // Projection end point
  if (!isOver10Years) {
    chartData.push({
      date: projDateStr,
      label: 'Proyeksi',
      projected: targetAmount,
      target: targetAmount,
    });
  }

  // Deadline point if exists
  if (goal.deadline && goal.deadline !== projDateStr) {
    chartData.push({
      date: goal.deadline,
      label: 'Tenggat',
      target: targetAmount,
    });
  }

  // Sort chart points by date
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  return {
    sisa,
    percentage,
    isCompleted: false,
    canProject: true,
    status,
    statusBadgeColor,
    isEarlyEstimate,
    projectedDate: projDateStr,
    projectedDateFormatted,
    daysNeeded,
    monthlyDepositNeeded,
    daysDiffWithDeadline,
    chartData,
  };
}

