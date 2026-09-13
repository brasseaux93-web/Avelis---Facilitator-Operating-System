/**
 * Optional model ranker. Never receives room speech.
 * Fail closed: any parse error or extra action kind is dropped; playbook result is returned.
 */

import type { CopilotAction, CopilotResult, ProcessSnapshot } from './types';
import { assertSpeechFree } from './firewall';

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function readModelConfig(env: NodeJS.ProcessEnv = process.env): ModelConfig | null {
  const apiKey = env.PROCESS_COPILOT_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (env.PROCESS_COPILOT_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
  const model = env.PROCESS_COPILOT_MODEL || 'grok-3';
  return { baseUrl, apiKey, model };
}

const SYSTEM = `You are a process copilot for Avelis, a facilitator operating system.
You never see speech, transcripts, or room messages.
You never write the ledger. You never assess sentiment, blame, or settlement amounts.
You only rank the provided process actions and may rephrase the process questions.
Return JSON only: {"rankedActionIds": string[], "questions": string[]}.
Use only action ids you were given. At most 6 actions and 3 questions.`;

export async function rankWithModel(
  snapshot: ProcessSnapshot,
  playbook: CopilotResult,
  config: ModelConfig,
  fetchImpl: typeof fetch = fetch
): Promise<CopilotResult> {
  assertSpeechFree(snapshot);
  const body = {
    model: config.model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM },
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
  };
  assertSpeechFree({ stage: playbook.stage, snapshot });

  const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return playbook;
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) return playbook;
  return mergeModelOutput(playbook, raw);
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
        .filter((q): q is string => typeof q === 'string' && q.length < 280 && !/transcript|they said|sentiment/i.test(q))
        .slice(0, 3)
    : playbook.questions;
  return {
    ...playbook,
    source: 'model',
    actions,
    questions: questions.length ? questions : playbook.questions,
  };
}
