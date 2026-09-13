import type {
  AgendaStatus,
  IdentityClass,
  MinuteStatus,
  ProcessSnapshot,
  SessionStatus,
} from './types';
import { sanitizeAgendaLabel } from './firewall';

export interface SnapshotInput {
  sessionStatus: string;
  parties: Array<{ identityClass: string; inviteStatus: string }>;
  agenda: Array<{ id: string; title: string; status: string }>;
  ledgerLineTypes: string[];
  minuteStatus: string | null;
}

const SESSION: SessionStatus[] = ['draft', 'open', 'closed', 'purged'];
const AGENDA: AgendaStatus[] = ['tabled', 'agreed', 'parked', 'refused'];
const IDENTITY: IdentityClass[] = ['named', 'role_only', 'affiliation_only', 'unnamed'];
const MARKS = ['pause_called', 'return_to_plenary', 'process_complete'] as const;

function asSession(v: string): SessionStatus {
  return (SESSION as string[]).includes(v) ? (v as SessionStatus) : 'draft';
}

export function buildSnapshot(input: SnapshotInput): ProcessSnapshot {
  const partyCounts = { pending: 0, joined: 0, declined: 0, left: 0, revoked: 0 };
  const identityClassesPresent: IdentityClass[] = [];
  for (const p of input.parties) {
    if (p.inviteStatus in partyCounts) {
      partyCounts[p.inviteStatus as keyof typeof partyCounts] += 1;
    }
    if ((IDENTITY as string[]).includes(p.identityClass) && !identityClassesPresent.includes(p.identityClass as IdentityClass)) {
      identityClassesPresent.push(p.identityClass as IdentityClass);
    }
  }

  const types = input.ledgerLineTypes;
  let caucusOpen = false;
  const processMarks: ProcessSnapshot['processMarks'] = [];
  for (const t of types) {
    if (t === 'caucus_opened') caucusOpen = true;
    if (t === 'caucus_closed') caucusOpen = false;
    if ((MARKS as readonly string[]).includes(t) || t === 'process_mark_recorded') {
      // marks live in payloads; types-only path treats process_complete via later payload pass
    }
  }
  // Payload-free inference: last matching line types for process marks if encoded as line type only.
  for (const t of types) {
    if (t === 'process_mark_recorded') {
      // actual mark is in payload; filled by buildSnapshotFromLines
    }
  }

  let minuteStatus: MinuteStatus = 'none';
  if (input.minuteStatus === 'draft') minuteStatus = 'draft';
  else if (input.minuteStatus === 'published') minuteStatus = 'published';
  else if (input.minuteStatus === 'wiped') minuteStatus = 'wiped';

  return {
    sessionStatus: asSession(input.sessionStatus),
    partyCounts,
    identityClassesPresent,
    agenda: input.agenda.map((a) => ({
      id: a.id,
      label: sanitizeAgendaLabel(a.title || 'Issue'),
      status: (AGENDA as string[]).includes(a.status) ? (a.status as AgendaStatus) : 'tabled',
    })),
    caucusOpen,
    processMarks,
    minuteStatus,
    lastLineType: types.length ? types[types.length - 1] : null,
    lineCount: types.length,
  };
}

export function applyProcessMarkPayloads(
  snapshot: ProcessSnapshot,
  marks: Array<string | undefined>
): ProcessSnapshot {
  const processMarks = [...snapshot.processMarks];
  for (const m of marks) {
    if (m === 'pause_called' || m === 'return_to_plenary' || m === 'process_complete') {
      if (!processMarks.includes(m)) processMarks.push(m);
    }
  }
  return { ...snapshot, processMarks };
}
