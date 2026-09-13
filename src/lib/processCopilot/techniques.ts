/**
 * Named mediation moves the conflict agent may use.
 * Drawn from principled negotiation (Fisher/Ury), Moore's caucus/shuttle,
 * Bush/Folger turn-taking without therapy language, and NCTDR/ICODR ODR
 * guidance: disclosed AI, human-confirmed outcomes, no silent evaluation.
 *
 * Evaluative settlement math (midpoints, trial EV, BATNA scores) is out of
 * scope. Avelis does process, not advocacy.
 */

export const TECHNIQUE_IDS = [
  'ground_rules',
  'open_interests',
  'frame_label',
  'separate_people',
  'turn_taking',
  'interest_map',
  'ask_why',
  'expand_options',
  'objective_criteria',
  'yesable',
  'park_blocker',
  'caucus_shuttle',
  'pause',
  'reality_test_process',
  'single_text',
] as const;

export type TechniqueId = (typeof TECHNIQUE_IDS)[number];

export type TechniqueMove = {
  id: TechniqueId;
  label: string;
  family: 'principled' | 'shuttle' | 'facilitative' | 'process';
  whisper: string;
  speak: string;
};

export const TECHNIQUES: Record<TechniqueId, TechniqueMove> = {
  ground_rules: {
    id: 'ground_rules',
    label: 'Name the room',
    family: 'process',
    whisper: 'State the three facts, then ask the opening interest question. Do not perform warmth.',
    speak: 'Three facts: I am in this room and you can see me. This talk is not stored. The facilitator writes the process record, not me. What does a workable outcome have to do?',
  },
  open_interests: {
    id: 'open_interests',
    label: 'Interests, not positions',
    family: 'principled',
    whisper: 'Ask what a workable outcome has to do. Do not ask who is right.',
    speak: 'Before positions harden: what does a workable outcome have to do, for each of you?',
  },
  frame_label: {
    id: 'frame_label',
    label: 'Name the issue as a label',
    family: 'principled',
    whisper: 'Table a short process label. Not a quote. Not a motive.',
    speak: 'I am going to name the problem without the people. Confirm or correct the label, then the facilitator can table it.',
  },
  separate_people: {
    id: 'separate_people',
    label: 'People vs problem',
    family: 'principled',
    whisper: 'Reframe accusations as the issue to be solved. Do not defend either side.',
    speak: 'Let us put the people on one side of the table and the problem on the other. What is the problem, in one sentence, without motive?',
  },
  turn_taking: {
    id: 'turn_taking',
    label: 'Equal turn',
    family: 'facilitative',
    whisper: 'Invite the party who has not spoken. Do not summarize the other.',
    speak: 'I want a turn from the person who has not spoken yet. One sentence on what a workable outcome has to do.',
  },
  interest_map: {
    id: 'interest_map',
    label: 'Map the constraints',
    family: 'principled',
    whisper: 'Each party names one constraint the outcome must satisfy. Not a position. Not a number.',
    speak: 'Each of you: one constraint a workable outcome has to satisfy. Not your position. We will hear both before anyone answers.',
  },
  ask_why: {
    id: 'ask_why',
    label: 'Why under the position',
    family: 'principled',
    whisper: 'A demand is a position. Ask what it protects. Do not attack it. Do not offer a counter-number.',
    speak: 'I heard a position. What does that protect — time, standing, safety, a relationship that has to survive this room? Answer that, not the demand.',
  },
  expand_options: {
    id: 'expand_options',
    label: 'Invent options',
    family: 'principled',
    whisper: 'Generate options before anyone evaluates. One option each. No scoring.',
    speak: 'No evaluating yet. Each of you: one option that is not your opening position. We will look at them after both are on the table.',
  },
  objective_criteria: {
    id: 'objective_criteria',
    label: 'Independent standard',
    family: 'principled',
    whisper: 'When interests conflict, ask for a standard neither of them owns. You do not pick the number.',
    speak: 'If the interests still collide: what standard, independent of either of you — a policy, a precedent, a published rule — would make this fair? I will not pick the number.',
  },
  yesable: {
    id: 'yesable',
    label: 'Yesable proposition',
    family: 'principled',
    whisper: 'Ask for the smallest yes the other person could give that you can live with. Not a concession race.',
    speak: 'What is the smallest yes the other person could give that you can live with — and that they could defend tomorrow? One sentence.',
  },
  park_blocker: {
    id: 'park_blocker',
    label: 'Park the blocker',
    family: 'process',
    whisper: 'The looping item should be parked. Mark a smaller item both can live with.',
    speak: 'This item is blocking the rest. We can park it and mark one smaller item both can live with. Which process do you want?',
  },
  caucus_shuttle: {
    id: 'caucus_shuttle',
    label: 'Shuttle / caucus',
    family: 'shuttle',
    whisper: 'Open a caucus. Membership is facilitator-only. Bring process facts back, not the talk.',
    speak: 'Plenary is looping. The facilitator can open a caucus — a private turn — then return with process, not quotes. Ask for that if you want it.',
  },
  pause: {
    id: 'pause',
    label: 'Pause',
    family: 'process',
    whisper: 'Call a pause. Pressure here will write a bad line.',
    speak: 'A pause is available. We do not need to finish this turn under heat. Facilitator can record a pause and resume.',
  },
  reality_test_process: {
    id: 'reality_test_process',
    label: 'Process reality test',
    family: 'facilitative',
    whisper: 'Ask what happens to the session if this stays unresolved — not who would win elsewhere.',
    speak: 'If this item stays unresolved when the room closes, it is gone with the talk. What must be on the joint minute, if anything, before that?',
  },
  single_text: {
    id: 'single_text',
    label: 'Single text',
    family: 'principled',
    whisper: 'Draft the joint minute only from marked-agreed labels. Both sides edit one document. Not a transcript.',
    speak: 'We can work from one document: the joint minute, written only from items already marked agreed. The facilitator drafts; you correct the labels, not the talk.',
  },
};

const ACCUSATION = /\b(always|never|you people|your fault|liar|lying)\b/i;
const DEMAND = /\b(must|refuse|won't|will not|non-negotiable)\b/i;
const FAIRNESS = /\b(fair|unfair|policy|precedent|market|standard|fifty-fifty|split (it|this))\b/i;
const CONDITIONAL = /\b(only if|if you|agree to|deal if|i(?:'?ll| will) if)\b/i;

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3)
  );
}

function overlap(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const t of A) if (B.has(t)) n += 1;
  return n / Math.min(A.size, B.size);
}

export type TechniqueInput = {
  turns: Array<{ speaker: string; identityClass: string; text: string }>;
  caucusOpen?: boolean;
  agreedCount?: number;
};

export function detectLooping(turns: TechniqueInput['turns']): boolean {
  const party = turns.filter((t) => t.speaker === 'party').slice(-3);
  if (party.length < 3) return false;
  return overlap(party[0]!.text, party[2]!.text) > 0.45;
}

export function selectTechnique(input: TechniqueInput): TechniqueMove {
  const humans = input.turns.filter((t) => t.speaker !== 'avelis');
  const n = humans.length;
  const last = humans[humans.length - 1];
  const looping = detectLooping(input.turns);
  const accused = last ? ACCUSATION.test(last.text) : false;
  const demanded = last ? DEMAND.test(last.text) : false;
  const fairness = last ? FAIRNESS.test(last.text) : false;
  const conditional = last ? CONDITIONAL.test(last.text) : false;
  const partyTurns = humans.filter((t) => t.speaker === 'party');
  const byClass = new Map<string, number>();
  for (const t of partyTurns) byClass.set(t.identityClass, (byClass.get(t.identityClass) || 0) + 1);
  const classCounts = [...byClass.values()];
  const airtimeSkew =
    classCounts.length >= 2 && Math.max(...classCounts) >= Math.max(3, partyTurns.length - 1);

  if (partyTurns.length === 0) return TECHNIQUES.ground_rules;
  if (partyTurns.length <= 2) return TECHNIQUES.open_interests;
  if (accused) return TECHNIQUES.separate_people;
  if (demanded && partyTurns.length <= 5) return TECHNIQUES.ask_why;
  if (demanded) return TECHNIQUES.expand_options;
  if (conditional) return TECHNIQUES.yesable;
  if (fairness) return TECHNIQUES.objective_criteria;
  if (airtimeSkew) return TECHNIQUES.turn_taking;
  if (looping && !input.caucusOpen) return TECHNIQUES.caucus_shuttle;
  if (looping) return TECHNIQUES.park_blocker;
  if ((input.agreedCount || 0) > 0) return TECHNIQUES.single_text;
  if (n >= 10) return TECHNIQUES.reality_test_process;
  if (n >= 8) return TECHNIQUES.pause;
  if (n >= 5) return TECHNIQUES.interest_map;
  return TECHNIQUES.frame_label;
}

export const TECHNIQUE_PROMPT = `You must pick one technique id from: ${TECHNIQUE_IDS.join(', ')}.
Return JSON only: {"technique":"id","whisper":"string","speak":"string or null"}
whisper = facilitator only. speak = optional room line. Follow the named move.`;

export type ConfirmKind = 'open_caucus' | 'close_caucus' | 'table_label' | null;

/** What the facilitator can confirm from a whisper without leaving the room. */
export function confirmForMove(id: TechniqueId | null, caucusOpen: boolean): ConfirmKind {
  if (caucusOpen) return 'close_caucus';
  if (id === 'caucus_shuttle') return 'open_caucus';
  if (id === 'frame_label' || id === 'interest_map') return 'table_label';
  return null;
}
