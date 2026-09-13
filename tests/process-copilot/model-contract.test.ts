import { describe, expect, test } from 'vitest';
import { mergeModelOutput } from '../../src/lib/processCopilot/model';
import { COPILOT_DISCLOSURE, type CopilotResult } from '../../src/lib/processCopilot/types';

const playbook: CopilotResult = {
  stage: 'explore',
  source: 'playbook',
  disclosure: COPILOT_DISCLOSURE,
  questions: ['Ask each party to name the issue without attributing motive.'],
  actions: [
    {
      id: 'caucus',
      kind: 'open_caucus',
      label: 'Open a caucus',
      rationale: 'Private turn.',
      payload: {},
    },
    {
      id: 'mark',
      kind: 'mark_agenda',
      label: 'Park item',
      rationale: 'Unblock.',
      payload: { itemId: '1', status: 'parked' },
    },
  ],
  minuteOutline: null,
};

describe('model contract', () => {
  test('ranks only known action ids', () => {
    const merged = mergeModelOutput(
      playbook,
      '{"rankedActionIds":["mark","invented","caucus"],"questions":["Park the blocking item."]}'
    );
    expect(merged.source).toBe('model');
    expect(merged.actions.map((a) => a.id)).toEqual(['mark', 'caucus']);
    expect(merged.questions).toEqual(['Park the blocking item.']);
  });

  test('drops sentiment / speech-shaped questions', () => {
    const merged = mergeModelOutput(
      playbook,
      '{"rankedActionIds":["caucus"],"questions":["They said they are angry.","Park the blocking item."]}'
    );
    expect(merged.questions).toEqual(['Park the blocking item.']);
  });

  test('invalid JSON falls back to playbook', () => {
    const merged = mergeModelOutput(playbook, 'not json');
    expect(merged.source).toBe('playbook');
    expect(merged.actions).toEqual(playbook.actions);
  });
});
