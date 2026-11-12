import { useState, useEffect, useCallback } from 'react';
import { SavingsGoal } from '../types/database';
import {
  GoalAlarmConfig,
  getAllGoalAlarms,
  saveGoalAlarm,
  removeGoalAlarm,
  snoozeGoalAlarm,
  playChimeSound,
  sendBrowserNotification,
  requestNotificationPermission,
} from '../services/alarm';

export function useSavingsAlarm(goals: SavingsGoal[]) {
  const [activeReminder, setActiveReminder] = useState<{
    alarm: GoalAlarmConfig;
    goal: SavingsGoal;
  } | null>(null);

  // Background interval checking every 20 seconds
  useEffect(() => {
    const checkAlarms = () => {
      const allAlarms = getAllGoalAlarms();
      const now = new Date();

      // Current HH:mm in WIB (Asia/Jakarta)
      const timeStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      // Standardize delimiter to ":" (in id-ID sometimes it returns ".")
      const currentHHmm = timeStr.replace('.', ':');

      const dateStr = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const currentMinuteKey = `${dateStr} ${currentHHmm}`;

      for (const [goalId, alarm] of Object.entries(allAlarms)) {
        if (!alarm.enabled) continue;

        // Check if snoozed
        if (alarm.snoozedUntil && Date.now() < alarm.snoozedUntil) {
          continue;
        }

        // Check if time matches and hasn't fired yet this exact minute
        if (alarm.time === currentHHmm && alarm.lastNotifiedDateMinute !== currentMinuteKey) {
          const matchingGoal = goals.find((g) => g.id === goalId);
          if (matchingGoal) {
            // Update last notified minute to prevent re-firing in same minute
            alarm.lastNotifiedDateMinute = currentMinuteKey;
            delete alarm.snoozedUntil;
            saveGoalAlarm(alarm);

            // Play melodic Web Audio API chime
            playChimeSound();

            // Fire browser push notification
            sendBrowserNotification(
              `⏰ Waktunya Menabung: ${matchingGoal.name}!`,
              `Sisihkan dana untuk target impianmu sekarang.`
            );

            // Open in-app modal
            setActiveReminder({
              alarm,
              goal: matchingGoal,
            });
            break; // Handle one at a time
          }
        }
      }
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 20 * 1000);
    return () => clearInterval(interval);
  }, [goals]);

  const handleSnooze = useCallback((goalId: string) => {
    snoozeGoalAlarm(goalId, 10);
    setActiveReminder(null);
  }, []);

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  return {
    activeReminder,
    dismissReminder,
    handleSnooze,
    saveGoalAlarm,
    removeGoalAlarm,
    requestNotificationPermission,
  };
}

