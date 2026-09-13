import { describe, expect, test } from 'vitest';
import { detectLooping, selectTechnique } from '../../src/lib/processCopilot/techniques';

describe('mediation techniques', () => {
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

  test('demand expands options', () => {
    const move = selectTechnique({
      turns: [
        { speaker: 'party', identityClass: 'named', text: 'We should talk about schedule.' },
        { speaker: 'party', identityClass: 'named', text: 'The hours must stay. That is non-negotiable.' },
        { speaker: 'party', identityClass: 'role_only', text: 'Then say what you need the hours to do.' },
        { speaker: 'party', identityClass: 'named', text: 'They must not change. We refuse.' },
      ],
    });
    expect(move.id).toBe('expand_options');
  });
});
