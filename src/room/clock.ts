/**
 * Shared process clock. RAM-only.
 * The facilitator sets a budget the whole room can see. Elapsing does not
 * close the session, kick anyone, or write speech. It is a process fact:
 * the time you set has run out. Pause, extend, or close.
 */

import { onRoomTeardown, broadcast } from './memory';

export type ClockState = {
  minutes: number;
  endsAt: number;
  elapsed: boolean;
};

const clocks = new Map<string, ClockState>();
const alarms = new Map<string, ReturnType<typeof setTimeout>>();

onRoomTeardown((sessionId) => {
  const t = alarms.get(sessionId);
  if (t) clearTimeout(t);
  alarms.delete(sessionId);
  clocks.delete(sessionId);
});

export function getClock(sessionId: string): ClockState | undefined {
  return clocks.get(sessionId);
}

function emit(sessionId: string): void {
  const c = clocks.get(sessionId);
  broadcast(sessionId, {
    type: 'clock_state',
    minutes: c?.minutes ?? null,
    endsAt: c?.endsAt ?? null,
    elapsed: Boolean(c?.elapsed),
    timestamp: Date.now(),
  });
}

export function clearClock(sessionId: string): void {
  const t = alarms.get(sessionId);
  if (t) clearTimeout(t);
  alarms.delete(sessionId);
  clocks.delete(sessionId);
  emit(sessionId);
}

export function setClock(sessionId: string, minutes: number): ClockState | null {
  const m = Math.round(minutes);
  if (!Number.isFinite(m) || m < 5 || m > 180) return null;
  const t = alarms.get(sessionId);
  if (t) clearTimeout(t);
  const endsAt = Date.now() + m * 60_000;
  const state: ClockState = { minutes: m, endsAt, elapsed: false };
  clocks.set(sessionId, state);
  alarms.set(
    sessionId,
    setTimeout(() => {
      const cur = clocks.get(sessionId);
      if (!cur || cur.endsAt !== endsAt) return;
      cur.elapsed = true;
      emit(sessionId);
      broadcast(sessionId, {
        type: 'notice',
        channel: 'plenary',
        text: 'The time you set has elapsed. Pause, extend, or close. The room does not close itself.',
        timestamp: Date.now(),
      });
    }, m * 60_000)
  );
  emit(sessionId);
  return state;
}

export function _resetClockForTests(): void {
  for (const t of alarms.values()) clearTimeout(t);
  alarms.clear();
  clocks.clear();
}
