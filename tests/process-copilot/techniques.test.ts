import { describe, expect, test } from 'vitest';
import { detectLooping, selectTechnique } from '../../src/lib/processCopilot/techniques';

describe('mediation techniques', () => {
  test('empty room names the room', () => {
    expect(selectTechnique({ turns: [] }).id).toBe('ground_rules');
  });

  test('opens on interests', () => {
    const move = selectTechnique({
      turns: [{ speaker: 'party', identityClass: 'role_only', text: 'We need the hours changed.' }],
    });
    expect(move.id).toBe('open_interests');
  });

  test('accusation triggers people vs problem', () => {
    const move = selectTechnique({
      turns: [
        { speaker: 'party', identityClass: 'named', text: 'Hello' },
        { speaker: 'party', identityClass: 'role_only', text: 'We should talk about hours.' },
        { speaker: 'party', identityClass: 'named', text: 'You people never listen and this is your fault' },
      ],
    });
    expect(move.id).toBe('separate_people');
  });

  test('looping prefers caucus', () => {
    const text = 'The contract hours on the night shift cannot move at all ever';
    const turns = [
      { speaker: 'party' as const, identityClass: 'role_only', text },
      { speaker: 'party' as const, identityClass: 'affiliation_only', text: 'We already said no to night shift hours' },
      { speaker: 'party' as const, identityClass: 'role_only', text },
    ];
    expect(detectLooping(turns)).toBe(true);
    expect(selectTechnique({ turns }).id).toBe('caucus_shuttle');
  });

  test('demand asks why under the position', () => {
    const move = selectTechnique({
      turns: [
        { speaker: 'party', identityClass: 'named', text: 'We should talk about schedule.' },
        { speaker: 'party', identityClass: 'named', text: 'The hours must stay. That is non-negotiable.' },
        { speaker: 'party', identityClass: 'role_only', text: 'Then say what you need the hours to do.' },
        { speaker: 'party', identityClass: 'named', text: 'They must not change. We refuse.' },
      ],
    });
    expect(move.id).toBe('ask_why');
  });

  test('repeated demand invents options', () => {
    const turns = Array.from({ length: 6 }, (_, i) => ({
      speaker: 'party' as const,
      identityClass: i % 2 ? 'named' : 'role_only',
      text: i === 5 ? 'This is non-negotiable. We refuse.' : 'The schedule still has to work.',
    }));
    expect(selectTechnique({ turns }).id).toBe('expand_options');
  });

  test('fairness language asks for an independent standard', () => {
    const move = selectTechnique({
      turns: [
        { speaker: 'party', identityClass: 'named', text: 'We need a process for hours.' },
        { speaker: 'party', identityClass: 'role_only', text: 'A workable outcome has to keep coverage.' },
        { speaker: 'party', identityClass: 'named', text: 'Then split it fifty-fifty. That is fair.' },
      ],
    });
    expect(move.id).toBe('objective_criteria');
  });
});
