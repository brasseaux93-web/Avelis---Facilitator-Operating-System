import type {
  CopilotAction,
  CopilotResult,
  ProcessSnapshot,
  ProcessStage,
} from './types';
import { COPILOT_DISCLOSURE } from './types';
import { sanitizeAgendaLabel } from './firewall';

export function inferStage(s: ProcessSnapshot): ProcessStage {
  if (s.sessionStatus === 'purged') return 'destroyed';
  if (s.sessionStatus === 'closed') return 'close';
  if (s.sessionStatus === 'draft') return 'convene';
  if (s.processMarks.includes('process_complete')) return 'close';
  const agreed = s.agenda.filter((a) => a.status === 'agreed').length;
  const tabled = s.agenda.filter((a) => a.status === 'tabled').length;
  const parked = s.agenda.filter((a) => a.status === 'parked').length;
  if (agreed > 0 && (s.minuteStatus === 'draft' || s.minuteStatus === 'published' || tabled === 0)) {
    return 'commit';
  }
  if (parked > 0) return 'option';
  if (s.agenda.length > 0) return 'explore';
  if (s.partyCounts.joined >= 1) return 'frame';
  return 'open';
}

const QUESTIONS: Record<ProcessStage, string[]> = {
  convene: [
    'Confirm who must be present before you open. Opening with one party is a caucus, not a plenary.',
    'Assign identity classes now. They become immutable at join.',
  ],
  open: [
    'Wait for a second party to join unless you intend a caucus.',
    'Do not table issues until the people who must speak on them are in the room.',
  ],
  frame: [
    'Table issues as process labels, not accusations. Prefer “Working hours” over a quote of what someone said.',
    'Ask each party, in turn, to name the issue in one sentence without attributing motive.',
  ],
  explore: [
    'If parties are restating positions, open a caucus and ask what a workable outcome has to achieve.',
    'Separate the people from the problem: ask what would change if the other party were acting in good faith.',
  ],
  option: [
    'Park the blocking item. Mark a smaller item both can live with.',
    'Ask each party for one option they have not already proposed. Do not evaluate both in the same turn.',
  ],
  commit: [
    'Write the joint minute only from items marked agreed. Do not reconstruct the talk.',
    'Publish the minute for initialing before you record process complete.',
  ],
  close: [
    'Record process complete, then close. Closing destroys the live room. Messages cannot be recovered.',
    'Process records remain only until the destruction deadline you set at open.',
  ],
  destroyed: ['Session records were destroyed. The destruction receipt remains.'],
};

function action(
  id: string,
  kind: CopilotAction['kind'],
  label: string,
  rationale: string,
  payload: Record<string, unknown> = {}
): CopilotAction {
  return { id, kind, label, rationale, payload };
}

export function buildMinuteOutline(s: ProcessSnapshot): string | null {
  const agreed = s.agenda.filter((a) => a.status === 'agreed');
  if (agreed.length === 0) return null;
  const parked = s.agenda.filter((a) => a.status === 'parked');
  const refused = s.agenda.filter((a) => a.status === 'refused');
  const lines = [
    'Joint minute (facilitator-authored; not a transcript)',
    '',
    'Marked agreed:',
    ...agreed.map((a) => `- ${sanitizeAgendaLabel(a.label)}`),
  ];
  if (parked.length) {
    lines.push('', 'Parked for later:', ...parked.map((a) => `- ${sanitizeAgendaLabel(a.label)}`));
  }
  if (refused.length) {
    lines.push('', 'Marked refused:', ...refused.map((a) => `- ${sanitizeAgendaLabel(a.label)}`));
  }
  lines.push('', 'This minute does not record room speech.');
  return lines.join('\n');
}

export function runPlaybook(s: ProcessSnapshot): CopilotResult {
  const stage = inferStage(s);
  const actions: CopilotAction[] = [];

  if (s.sessionStatus === 'draft') {
    if (s.partyCounts.pending + s.partyCounts.joined === 0) {
      actions.push(
        action(
          'invite',
          'invite_party',
          'Create a one-time invite',
          'A session needs at least one party before it is worth opening.'
        )
      );
    } else {
      actions.push(
        action(
          'open',
          'open_session',
          'Open session',
          'Opening starts the live room and locks retention. Invite remaining parties first if you still need them.'
        )
      );
    }
  }

  if (s.sessionStatus === 'open') {
    if (s.partyCounts.joined < 2 && s.partyCounts.pending > 0) {
      actions.push(
        action(
          'invite-more',
          'invite_party',
          'Invite the remaining party',
          'Plenary process usually needs more than one joined party. One joined party is a caucus.'
        )
      );
    }

    if (s.agenda.length === 0) {
      actions.push(
        action(
          'table',
          'table_agenda',
          'Table an issue',
          'Name the issue as a process label. Do not paste room speech into the title.',
          { title: 'Issue for discussion' }
        )
      );
    }

    const tabled = s.agenda.filter((a) => a.status === 'tabled');
    for (const item of tabled.slice(0, 3)) {
      actions.push(
        action(
          `mark-agreed-${item.id}`,
          'mark_agenda',
          `Mark “${sanitizeAgendaLabel(item.label)}” agreed`,
          'Only mark agreed when both sides can live with the label as written.',
          { itemId: item.id, status: 'agreed' }
        ),
        action(
          `mark-parked-${item.id}`,
          'mark_agenda',
          `Park “${sanitizeAgendaLabel(item.label)}”`,
          'Park items that are blocking a smaller agreement.',
          { itemId: item.id, status: 'parked' }
        )
      );
    }

    if (s.agenda.length > 0 && !s.caucusOpen && s.partyCounts.joined >= 2) {
      actions.push(
        action(
          'caucus',
          'open_caucus',
          'Open a caucus',
          'A private turn often unblocks positions. Caucus membership is not party-visible.'
        )
      );
    }

    if (s.caucusOpen) {
      actions.push(
        action(
          'close-caucus',
          'close_caucus',
          'Close caucus and return to plenary',
          'Bring any process facts — not the talk — back to the full room.',
          { mark: 'return_to_plenary' }
        )
      );
    }

    const agreed = s.agenda.filter((a) => a.status === 'agreed');
    if (agreed.length > 0 && (s.minuteStatus === 'none' || s.minuteStatus === 'wiped')) {
      actions.push(
        action(
          'minute',
          'draft_joint_minute',
          'Draft joint minute from marked-agreed items',
          'The minute is facilitator-authored. Insert the outline, edit it, then save. It is not a transcript.',
          { outline: true }
        )
      );
    }
    if (s.minuteStatus === 'draft' && agreed.length > 0) {
      actions.push(
        action(
          'publish-minute',
          'publish_joint_minute',
          'Publish joint minute',
          'Publishing lets parties initial a process document. It is not a legal signature.'
        )
      );
    }

    if (
      s.agenda.length > 0 &&
      tabled.length === 0 &&
      !s.processMarks.includes('process_complete')
    ) {
      actions.push(
        action(
          'complete',
          'process_mark',
          'Record process complete',
          'Use this when remaining items are parked or refused and the minute is in the shape you want.',
          { mark: 'process_complete' }
        )
      );
    }

    if (s.processMarks.includes('process_complete')) {
      actions.push(
        action(
          'close',
          'close_session',
          'Close session',
          'Closing ends room access and destroys the live room. Messages cannot be recovered.'
        )
      );
    }
  }

  return {
    stage,
    source: 'playbook',
    disclosure: COPILOT_DISCLOSURE,
    questions: QUESTIONS[stage],
    actions: actions.slice(0, 8),
    minuteOutline: buildMinuteOutline(s),
  };
}
