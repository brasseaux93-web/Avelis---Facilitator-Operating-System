/**
 * RAM-only private turn (caucus).
 * Membership lives beside the room, not on RoomState — so the room object
 * still has no speech and no history. Talk in a caucus is never copied
 * into plenary. A facilitator may return a process label, not a quote.
 */

import { onRoomTeardown, broadcastWhere, getRoom, type PartyMeta } from './memory';
import { sanitizeAgendaLabel } from '../lib/processCopilot/firewall';

export type CaucusState = {
  id: string;
  memberIds: Set<string>;
  openedAt: number;
};

export type Channel = 'plenary' | 'caucus';

const caucuses = new Map<string, CaucusState>();

onRoomTeardown((sessionId) => {
  caucuses.delete(sessionId);
});

export function getCaucus(sessionId: string): CaucusState | undefined {
  return caucuses.get(sessionId);
}

export function isCaucusOpen(sessionId: string): boolean {
  return caucuses.has(sessionId);
}

export function inCaucus(sessionId: string, meta: PartyMeta): boolean {
  const c = caucuses.get(sessionId);
  if (!c) return false;
  if (meta.identityClass === 'facilitator') return true;
  return c.memberIds.has(meta.partyId);
}

export function openCaucus(sessionId: string, memberPartyId: string): CaucusState | null {
  if (caucuses.has(sessionId)) return null;
  const room = getRoom(sessionId);
  if (!room) return null;
  const present = [...room.parties.values()].some(
    (m) => m.partyId === memberPartyId && m.identityClass !== 'facilitator'
  );
  if (!present) return null;
  const state: CaucusState = {
    id: crypto.randomUUID(),
    memberIds: new Set([memberPartyId]),
    openedAt: Date.now(),
  };
  caucuses.set(sessionId, state);
  return state;
}

export function closeCaucus(sessionId: string): CaucusState | undefined {
  const existing = caucuses.get(sessionId);
  caucuses.delete(sessionId);
  return existing;
}

export function sanitizeProcessFact(raw: string): string {
  if (/\b(said|says|told|quoted|transcript)\b/i.test(raw) || /['"]/.test(raw)) {
    return 'A constraint was named';
  }
  return sanitizeAgendaLabel(raw);
}

export function recipients(sessionId: string, channel: Channel): (meta: PartyMeta) => boolean {
  const c = caucuses.get(sessionId);
  if (!c) return () => true;
  if (channel === 'caucus') {
    return (meta) => meta.identityClass === 'facilitator' || c.memberIds.has(meta.partyId);
  }
  return (meta) => meta.identityClass === 'facilitator' || !c.memberIds.has(meta.partyId);
}

export function deliver(sessionId: string, channel: Channel, payload: unknown): number {
  return broadcastWhere(sessionId, { ...(payload as object), channel }, recipients(sessionId, channel));
}

/** Per-socket caucus_state so members learn they are in, outsiders only learn plenary is paused. */
export function notifyCaucusState(sessionId: string): void {
  const room = getRoom(sessionId);
  if (!room) return;
  const c = caucuses.get(sessionId);
  for (const [socket, meta] of room.parties) {
    if (socket.readyState !== socket.OPEN) continue;
    const youAreIn = Boolean(c && (meta.identityClass === 'facilitator' || c.memberIds.has(meta.partyId)));
    try {
      socket.send(
        JSON.stringify({
          type: 'caucus_state',
          open: Boolean(c),
          youAreIn,
          members:
            meta.identityClass === 'facilitator' && c
              ? [...c.memberIds].map((id) => {
                  const found = [...room.parties.values()].find((p) => p.partyId === id);
                  return { partyId: id, identityClass: found?.identityClass || 'unnamed' };
                })
              : undefined,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }
}

export function presenceList(sessionId: string): Array<{ partyId: string; identityClass: string }> {
  const room = getRoom(sessionId);
  if (!room) return [];
  const seen = new Map<string, { partyId: string; identityClass: string }>();
  for (const meta of room.parties.values()) {
    seen.set(meta.partyId, { partyId: meta.partyId, identityClass: meta.identityClass });
  }
  return [...seen.values()];
}

export function emitPresence(sessionId: string): void {
  const parties = presenceList(sessionId);
  broadcastWhere(sessionId, { type: 'presence', parties, timestamp: Date.now() }, () => true);
}

/** Test-only. */
export function _resetCaucusForTests(): void {
  caucuses.clear();
}
