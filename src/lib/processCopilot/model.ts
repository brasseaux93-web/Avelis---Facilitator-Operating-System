/**
 * Optional model ranker and facilitator dialogue.
 * Never receives room speech. Fail closed to playbook / refusal.
 */

import type { CopilotAction, CopilotResult, ProcessSnapshot } from './types';
import { assertSpeechFree } from './firewall';
import {
  AGENT_RULES,
  DIALOGUE_INSTRUCTION,
  LEGAL_REFUSAL,
  RANK_INSTRUCTION,
  SPEECH_REFUSAL,
  looksLikeSpeechPaste,
} from './rules';

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  fastModel: string;
  provider: 'groq' | 'openai-compatible';
}

export function readModelConfig(env: NodeJS.ProcessEnv = process.env): ModelConfig | null {
  const apiKey = (env.GROQ_API_KEY || env.PROCESS_COPILOT_API_KEY || '').trim();
  if (!apiKey) return null;
  const groqDefault = Boolean(env.GROQ_API_KEY) || /groq\.com/i.test(env.PROCESS_COPILOT_BASE_URL || '');
  const baseUrl = (env.PROCESS_COPILOT_BASE_URL || (groqDefault ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1')).replace(
    /\/$/,
    ''
  );
  const model =
    env.PROCESS_COPILOT_MODEL || env.GROQ_MODEL || (groqDefault ? 'llama-3.3-70b-versatile' : 'grok-3');
  const fastModel = env.GROQ_MODEL_FAST || (groqDefault ? 'llama-3.1-8b-instant' : model);
  const provider: ModelConfig['provider'] = /groq\.com/i.test(baseUrl) ? 'groq' : 'openai-compatible';
  return { baseUrl, apiKey, model, fastModel, provider };
}

export function copilotStatus(env: NodeJS.ProcessEnv = process.env): {
  configured: boolean;
  provider: 'none' | 'groq' | 'openai-compatible';
  model: string | null;
} {
  const cfg = readModelConfig(env);
  if (!cfg) return { configured: false, provider: 'none', model: null };
  return { configured: true, provider: cfg.provider, model: cfg.model };
}

async function complete(
  config: ModelConfig,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  fetchImpl: typeof fetch,
  temperature = 0.2,
  model = config.model
): Promise<string | null> {
  const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 500,
      messages,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? null;
}

export async function rankWithModel(
  snapshot: ProcessSnapshot,
  playbook: CopilotResult,
  config: ModelConfig,
  fetchImpl: typeof fetch = fetch
): Promise<CopilotResult> {
  assertSpeechFree(snapshot);
  const raw = await complete(
    config,
    [
      { role: 'system', content: AGENT_RULES + '\n\n' + RANK_INSTRUCTION },
      {
        role: 'user',
        content: JSON.stringify({
          stage: playbook.stage,
          snapshot,
          actions: playbook.actions.map((a) => ({ id: a.id, kind: a.kind, label: a.label })),
          questions: playbook.questions,
        }),
      },
    ],
    fetchImpl,
    0.2,
    config.fastModel
  );
  if (!raw) return playbook;
  return mergeModelOutput(playbook, raw);
}

export interface DialogueResult {
  reply: string;
  source: 'model' | 'rules';
  refused: boolean;
}

export async function dialogueWithModel(
  snapshot: ProcessSnapshot,
  question: string,
  config: ModelConfig | null,
  fetchImpl: typeof fetch = fetch
): Promise<DialogueResult> {
  const q = question.trim().slice(0, 400);
  if (!q) {
    return { reply: 'Ask a process question.', source: 'rules', refused: true };
  }
  if (looksLikeSpeechPaste(q)) {
    return { reply: SPEECH_REFUSAL, source: 'rules', refused: true };
  }
  if (/\b(sue|statute|liable|damages|illegal|attorney|privilege)\b/i.test(q) && /\b(should|can they|is it legal)\b/i.test(q)) {
    return { reply: LEGAL_REFUSAL, source: 'rules', refused: true };
  }
  assertSpeechFree(snapshot);
  if (!config) {
    return {
      reply: 'Playbook only is configured. Next process: stay with the ranked actions. Closing still destroys the live room.',
      source: 'rules',
      refused: false,
    };
  }
  const raw = await complete(
    config,
    [
      { role: 'system', content: AGENT_RULES + '\n\n' + DIALOGUE_INSTRUCTION },
      {
        role: 'user',
        content: JSON.stringify({ snapshot, question: q }),
      },
    ],
    fetchImpl,
    0.3
  );
  if (!raw) {
    return {
      reply: 'The model did not complete. Use the ranked process actions. I did not read the room.',
      source: 'rules',
      refused: false,
    };
  }
  const refused = raw.includes('I cannot use room speech') || raw.includes('not legal advice');
  return { reply: raw.trim().slice(0, 900), source: 'model', refused };
}

export function mergeModelOutput(playbook: CopilotResult, raw: string): CopilotResult {
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd < jsonStart) return playbook;
  let parsed: { rankedActionIds?: unknown; questions?: unknown };
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return playbook;
  }
  const byId = new Map(playbook.actions.map((a) => [a.id, a]));
  const ranked: CopilotAction[] = [];
  if (Array.isArray(parsed.rankedActionIds)) {
    for (const id of parsed.rankedActionIds) {
      if (typeof id === 'string' && byId.has(id)) {
        ranked.push(byId.get(id)!);
        byId.delete(id);
      }
    }
  }
  const actions = (ranked.length ? ranked : playbook.actions).slice(0, 6);
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .filter(
          (q): q is string =>
            typeof q === 'string' && q.length < 280 && !/transcript|they said|sentiment/i.test(q)
        )
        .slice(0, 3)
    : playbook.questions;
  return {
    ...playbook,
    source: 'model',
    actions,
    questions: questions.length ? questions : playbook.questions,
  };
}
