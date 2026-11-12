export interface GoalAlarmConfig {
  goalId: string;
  goalName: string;
  enabled: boolean;
  time: string; // "HH:mm" e.g. "09:00"
  frequency: 'daily' | 'weekly' | 'monthly';
  lastNotifiedDateMinute?: string;
  snoozedUntil?: number; // timestamp in ms
}

const ALARMS_STORAGE_KEY = 'np_goal_alarms_v1';

export function getAllGoalAlarms(): Record<string, GoalAlarmConfig> {
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveGoalAlarm(config: GoalAlarmConfig): void {
  try {
    const all = getAllGoalAlarms();
    all[config.goalId] = config;
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Failed to save goal alarm:', err);
  }
}

export function removeGoalAlarm(goalId: string): void {
  try {
    const all = getAllGoalAlarms();
    delete all[goalId];
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function snoozeGoalAlarm(goalId: string, minutes: number = 10): void {
  try {
    const all = getAllGoalAlarms();
    if (all[goalId]) {
      all[goalId].snoozedUntil = Date.now() + minutes * 60 * 1000;
      localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(all));
    }
  } catch {}
}

/**
 * Web Audio API synthesized soft melodic arpeggio chime (C5 - E5 - G5 - C6)
 * Zero external mp3 dependencies, works 100% offline
 */
export function playChimeSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      // Smooth attack and pleasant exponential decay
      gain.gain.setValueAtTime(0.001, startTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.12);
      osc.stop(startTime + idx * 0.12 + 0.5);
    });
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

/**
 * Request notification permission safely
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Fire browser desktop / mobile notification
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      silent: false,
    });
  } catch (err) {
    console.warn('Browser notification error:', err);
  }
}
