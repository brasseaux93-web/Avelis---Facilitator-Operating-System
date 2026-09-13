/**
 * Session-bound conflict agent. Lives only in room RAM.
 * A rolling window may be sent to the configured inference provider while
 * the room is open. Nothing here is written to Postgres, disk, or logs.
 */

import crypto from 'node:crypto';
import { broadcast, broadcastWhere, onRoomTeardown } from './memory';
import { readModelConfig, type ModelConfig } from '../lib/processCopilot/model';
import { AGENT_ROOM_RULES } from '../lib/processCopilot/rules';
import {
  TECHNIQUE_PROMPT,
  TECHNIQUES,
  selectTechnique,
  type TechniqueId,
  type TechniqueMove,
} from '../lib/processCopilot/techniques';

export type AgentTurn = {
  speaker: 'facilitator' | 'party' | 'avelis';
  identityClass: string;
  text: string;
};

const MAX_TURNS = 16;
const MAX_TEXT = 360;
const AUTO_SPEAK_EVERY = 4;

const windows = new Map<string, AgentTurn[]>();
const humanCounts = new Map<string, number>();
const pending = new Map<string, ReturnType<typeof setTimeout>>();

export function forgetSession(sessionId: string): void {
  windows.delete(sessionId);
  humanCounts.delete(sessionId);
  const t = pending.get(sessionId);
  if (t) clearTimeout(t);
  pending.delete(sessionId);
}

export function rememberTurn(sessionId: string, turn: AgentTurn): AgentTurn[] {
  const text = turn.text.trim().slice(0, MAX_TEXT);
  if (!text) return windows.get(sessionId) || [];
  const list = windows.get(sessionId) || [];
  list.push({ ...turn, text });
  while (list.length > MAX_TURNS) list.shift();
  windows.set(sessionId, list);
  if (turn.speaker !== 'avelis') {
    humanCounts.set(sessionId, (humanCounts.get(sessionId) || 0) + 1);
  }
  return list;
}

export function sessionWindow(sessionId: string): AgentTurn[] {
  return [...(windows.get(sessionId) || [])];
}

function playbookReply(turns: AgentTurn[]): TechniqueMove {
  return selectTechnique({ turns });
}

async function complete(
  config: ModelConfig,
  user: string,
  fetchImpl: typeof fetch
): Promise<string | null> {
  const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.35,
      max_tokens: 420,
      messages: [
        { role: 'system', content: AGENT_ROOM_RULES + '\n\n' + TECHNIQUE_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? null;
}

export function parseAgentJson(raw: string): { whisper: string; speak: string | null; technique: TechniqueId | null } {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) {
    return { whisper: raw.trim().slice(0, 400), speak: null, technique: null };
  }
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      whisper?: unknown;
      speak?: unknown;
      technique?: unknown;
    };
    const whisper = typeof parsed.whisper === 'string' ? parsed.whisper.trim().slice(0, 500) : '';
    const speak =
      typeof parsed.speak === 'string' && parsed.speak.trim() ? parsed.speak.trim().slice(0, 500) : null;
    const technique =
      typeof parsed.technique === 'string' && parsed.technique in TECHNIQUES
        ? (parsed.technique as TechniqueId)
        : null;
    return { whisper: whisper || 'Stay with process. Do not take a side.', speak, technique };
  } catch {
    return { whisper: raw.trim().slice(0, 400), speak: null, technique: null };
  }
}

export async function adviseRoom(
  sessionId: string,
  intent: 'coach' | 'speak',
  fetchImpl: typeof fetch = fetch
): Promise<{ whisper: string; speak: string | null; source: 'model' | 'playbook'; technique: TechniqueId }> {
  const turns = sessionWindow(sessionId);
  const fallback = playbookReply(turns);
  const cfg = readModelConfig();
  if (!cfg) {
    return {
      whisper: fallback.whisper,
      speak: intent === 'speak' ? fallback.speak : null,
      source: 'playbook',
      technique: fallback.id,
    };
  }
  try {
    const raw = await complete(
      cfg,
      JSON.stringify({
        intent,
        suggested: fallback.id,
        turns: turns.map((t) => ({ speaker: t.speaker, identityClass: t.identityClass, text: t.text })),
      }),
      fetchImpl
    );
    if (!raw) {
      return {
        whisper: fallback.whisper,
        speak: intent === 'speak' ? fallback.speak : null,
        source: 'playbook',
        technique: fallback.id,
      };
    }
    const parsed = parseAgentJson(raw);
    return {
      whisper: parsed.whisper,
      speak: intent === 'speak' ? parsed.speak || fallback.speak : parsed.speak,
      source: 'model',
      technique: parsed.technique || fallback.id,
    };
  } catch {
    return {
      whisper: fallback.whisper,
      speak: intent === 'speak' ? fallback.speak : null,
      source: 'playbook',
      technique: fallback.id,
    };
  }
}

export function publishAvelis(sessionId: string, text: string, technique?: TechniqueId): void {
  const line = text.trim();
  if (!line) return;
  rememberTurn(sessionId, { speaker: 'avelis', identityClass: 'avelis', text: line });
  broadcast(sessionId, {
    type: 'message',
    message: {
      id: crypto.randomUUID(),
      partyId: 'avelis',
      identityClass: 'avelis',
      text: line,
      technique: technique || null,
      timestamp: Date.now(),
    },
  });
}

export function whisperFacilitator(sessionId: string, text: string, technique?: TechniqueId): void {
  const line = text.trim();
  if (!line) return;
  broadcastWhere(
    sessionId,
    { type: 'agent_whisper', text: line, technique: technique || null, timestamp: Date.now() },
    (meta) => meta.identityClass === 'facilitator'
  );
}

export function scheduleCoach(sessionId: string): void {
  const existing = pending.get(sessionId);
  if (existing) clearTimeout(existing);
  pending.set(
    sessionId,
    setTimeout(() => {
      pending.delete(sessionId);
      void runCoach(sessionId);
    }, 2500)
  );
}

async function runCoach(sessionId: string): Promise<void> {
  const humans = humanCounts.get(sessionId) || 0;
  const intent = humans > 0 && humans % AUTO_SPEAK_EVERY === 0 ? 'speak' : 'coach';
  const result = await adviseRoom(sessionId, intent);
  whisperFacilitator(sessionId, result.whisper, result.technique);
  if (intent === 'speak' && result.speak) {
    publishAvelis(sessionId, result.speak, result.technique);
  }
}

export async function invokeAvelis(sessionId: string, prompt?: string): Promise<void> {
  if (prompt?.trim()) {
    rememberTurn(sessionId, {
      speaker: 'facilitator',
      identityClass: 'facilitator',
      text: `[ask Avelis] ${prompt.trim().slice(0, MAX_TEXT)}`,
    });
  }
  const result = await adviseRoom(sessionId, 'speak');
  whisperFacilitator(sessionId, result.whisper, result.technique);
  if (result.speak) publishAvelis(sessionId, result.speak, result.technique);
}

export function askedForAvelis(text: string): boolean {
  return /(?:^|\s)@(?:avelis)\b/i.test(text) || /^\s*avelis[,:]/i.test(text);
}

onRoomTeardown(forgetSession);
