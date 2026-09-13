import { describe, expect, test } from 'vitest';
import { buildSnapshot, applyProcessMarkPayloads } from '../../src/lib/processCopilot/snapshot';
import { inferStage, runPlaybook, buildMinuteOutline } from '../../src/lib/processCopilot/playbook';
import { advise } from '../../src/lib/processCopilot';

const emptyCounts = { pending: 0, joined: 0, declined: 0, left: 0, revoked: 0 };

describe('process copilot playbook', () => {
  test('draft with no parties → invite', () => {
    const r = runPlaybook({
      sessionStatus: 'draft',
      partyCounts: emptyCounts,
      identityClassesPresent: [],
      agenda: [],
      caucusOpen: false,
      processMarks: [],
      minuteStatus: 'none',
      lastLineType: null,
      lineCount: 0,
    });
    expect(r.stage).toBe('convene');
    expect(r.actions.some((a) => a.kind === 'invite_party')).toBe(true);
    expect(r.source).toBe('playbook');
  });

  test('open with joined parties and no agenda → table an issue', () => {
    const r = runPlaybook({
      sessionStatus: 'open',
      partyCounts: { ...emptyCounts, joined: 2 },
      identityClassesPresent: ['role_only'],
      agenda: [],
      caucusOpen: false,
      processMarks: [],
      minuteStatus: 'none',
      lastLineType: 'party_joined',
      lineCount: 3,
    });
    expect(r.stage).toBe('frame');
    expect(r.actions.some((a) => a.kind === 'table_agenda')).toBe(true);
    expect(r.questions[0]).toMatch(/process labels/i);
  });

  test('tabled items offer agreed and parked marks plus caucus', () => {
    const r = runPlaybook({
      sessionStatus: 'open',
      partyCounts: { ...emptyCounts, joined: 2 },
      identityClassesPresent: ['role_only', 'unnamed'],
      agenda: [{ id: 'item-1', label: 'Working hours', status: 'tabled' }],
      caucusOpen: false,
      processMarks: [],
      minuteStatus: 'none',
      lastLineType: 'agenda_item_tabled',
      lineCount: 4,
    });
    expect(r.stage).toBe('explore');
    expect(r.actions.some((a) => a.kind === 'mark_agenda' && a.payload.status === 'agreed')).toBe(true);
    expect(r.actions.some((a) => a.kind === 'open_caucus')).toBe(true);
  });

  test('agreed items produce a minute outline without quoting speech', () => {
    const outline = buildMinuteOutline({
      sessionStatus: 'open',
      partyCounts: { ...emptyCounts, joined: 2 },
      identityClassesPresent: [],
      agenda: [
        { id: '1', label: 'Working hours', status: 'agreed' },
        { id: '2', label: 'Back pay', status: 'parked' },
      ],
      caucusOpen: false,
      processMarks: [],
      minuteStatus: 'none',
      lastLineType: 'agenda_item_marked',
      lineCount: 5,
    });
    expect(outline).toContain('Working hours');
    expect(outline).toContain('not a transcript');
    expect(outline).not.toMatch(/they said/i);
  });

  test('process complete suggests close', () => {
    const r = runPlaybook({
      sessionStatus: 'open',
      partyCounts: { ...emptyCounts, joined: 2 },
      identityClassesPresent: [],
      agenda: [{ id: '1', label: 'Working hours', status: 'agreed' }],
      caucusOpen: false,
      processMarks: ['process_complete'],
      minuteStatus: 'published',
      lastLineType: 'process_mark_recorded',
      lineCount: 8,
    });
    expect(r.stage).toBe('close');
    expect(r.actions.some((a) => a.kind === 'close_session')).toBe(true);
  });

  test('snapshot builder drops party labels and infers caucus from line types', () => {
    const snap = buildSnapshot({
      sessionStatus: 'open',
      parties: [
        { identityClass: 'role_only', inviteStatus: 'joined' },
        { identityClass: 'unnamed', inviteStatus: 'pending' },
      ],
      agenda: [{ id: '1', title: 'Working hours', status: 'tabled' }],
      ledgerLineTypes: ['session_opened', 'party_joined', 'caucus_opened'],
      minuteStatus: null,
    });
    expect(snap.caucusOpen).toBe(true);
    expect(snap.partyCounts.joined).toBe(1);
    expect(JSON.stringify(snap)).not.toMatch(/displayLabel|email|inviteCode/);
    expect(inferStage(snap)).toBe('explore');
  });

  test('advise never includes speech keys', async () => {
    const result = await advise({
      sessionStatus: 'open',
      parties: [{ identityClass: 'role_only', inviteStatus: 'joined' }],
      agenda: [{ id: '1', title: 'Issue', status: 'tabled' }],
      ledgerLineTypes: ['session_opened'],
      minuteStatus: null,
      processMarkPayloads: ['pause_called'],
    });
    const blob = JSON.stringify(result);
    expect(blob).not.toMatch(/transcript|room message|sentiment/i);
    expect(result.disclosure).toMatch(/does not read the live room/i);
  });

  test('applyProcessMarkPayloads records closed vocabulary only', () => {
    const base = buildSnapshot({
      sessionStatus: 'open',
      parties: [],
      agenda: [],
      ledgerLineTypes: [],
      minuteStatus: null,
    });
    const next = applyProcessMarkPayloads(base, ['process_complete', 'nope', undefined]);
    expect(next.processMarks).toEqual(['process_complete']);
  });
});
