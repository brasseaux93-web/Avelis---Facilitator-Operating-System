import { describe, expect, test } from 'vitest';
import { AGENT_RULES, LEGAL_REFUSAL, SPEECH_REFUSAL, looksLikeSpeechPaste } from '../../src/lib/processCopilot/rules';
import { dialogueWithModel } from '../../src/lib/processCopilot/model';
import { copilotStatus, readModelConfig } from '../../src/lib/processCopilot/model';

const snap = {
  sessionStatus: 'open' as const,
  partyCounts: { pending: 0, joined: 2, declined: 0, left: 0, revoked: 0 },
  identityClassesPresent: ['role_only' as const],
  agenda: [{ id: '1', label: 'Working hours', status: 'tabled' as const }],
  caucusOpen: false,
  processMarks: [],
  minuteStatus: 'none' as const,
  lastLineType: 'agenda_item_tabled',
  lineCount: 2,
};

describe('agent rules', () => {
  test('rules contain legal and speech refusals', () => {
    expect(AGENT_RULES).toMatch(/not a lawyer/i);
    expect(AGENT_RULES).toMatch(/never write the ledger/i);
    expect(AGENT_RULES).toMatch(/privilege/);
    expect(AGENT_RULES).toMatch(/settlement amount/);
    expect(AGENT_RULES).toMatch(/I cannot use room speech/);
  });

  test('speech paste detector', () => {
    expect(looksLikeSpeechPaste('How should I open this caucus?')).toBe(false);
    expect(looksLikeSpeechPaste('They said they will never agree to that')).toBe(true);
    expect(looksLikeSpeechPaste('He said "no" and she said "yes" wait "maybe" "later"')).toBe(true);
  });

  test('dialogue refuses speech without calling a model', async () => {
    const r = await dialogueWithModel(snap, 'They said the contract is void', null);
    expect(r.refused).toBe(true);
    expect(r.reply).toBe(SPEECH_REFUSAL);
    expect(r.source).toBe('rules');
  });

  test('dialogue refuses legal advice without a model', async () => {
    const r = await dialogueWithModel(snap, 'Should they sue? Is it legal?', null);
    expect(r.refused).toBe(true);
    expect(r.reply).toBe(LEGAL_REFUSAL);
  });

  test('Groq env is preferred', () => {
    const cfg = readModelConfig({
      GROQ_API_KEY: 'gsk_test',
    });
    expect(cfg?.provider).toBe('groq');
    expect(cfg?.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(cfg?.model).toBe('llama-3.3-70b-versatile');
    expect(cfg?.fastModel).toBe('llama-3.1-8b-instant');
    expect(copilotStatus({ GROQ_API_KEY: 'gsk_test' }).configured).toBe(true);
    expect(copilotStatus({}).configured).toBe(false);
  });
});
