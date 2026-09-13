/** Closed process snapshot — never includes speech, addresses, or invite material. */

export type SessionStatus = 'draft' | 'open' | 'closed' | 'purged';
export type AgendaStatus = 'tabled' | 'agreed' | 'parked' | 'refused';
export type IdentityClass = 'named' | 'role_only' | 'affiliation_only' | 'unnamed';
export type MinuteStatus = 'none' | 'draft' | 'published' | 'wiped';

export type ProcessStage =
  | 'convene'
  | 'open'
  | 'frame'
  | 'explore'
  | 'option'
  | 'commit'
  | 'close'
  | 'destroyed';

export type CopilotActionKind =
  | 'open_session'
  | 'invite_party'
  | 'table_agenda'
  | 'mark_agenda'
  | 'open_caucus'
  | 'close_caucus'
  | 'process_mark'
  | 'draft_joint_minute'
  | 'publish_joint_minute'
  | 'close_session';

export interface AgendaFact {
  id: string;
  /** Facilitator-authored process label. Not a quote of speech. */
  label: string;
  status: AgendaStatus;
}

export interface ProcessSnapshot {
  sessionStatus: SessionStatus;
  partyCounts: {
    pending: number;
    joined: number;
    declined: number;
    left: number;
    revoked: number;
  };
  identityClassesPresent: IdentityClass[];
  agenda: AgendaFact[];
  caucusOpen: boolean;
  processMarks: Array<'pause_called' | 'return_to_plenary' | 'process_complete'>;
  minuteStatus: MinuteStatus;
  lastLineType: string | null;
  lineCount: number;
}

export interface CopilotAction {
  id: string;
  kind: CopilotActionKind;
  label: string;
  /** Why this process step, in institutional language. */
  rationale: string;
  /** Closed-vocabulary payload the facilitator may confirm. */
  payload: Record<string, unknown>;
}

export interface CopilotResult {
  stage: ProcessStage;
  source: 'playbook' | 'model';
  disclosure: string;
  questions: string[];
  actions: CopilotAction[];
  minuteOutline: string | null;
}

export const COPILOT_DISCLOSURE =
  'Process copilot uses session process facts only. It does not read the live room. It does not write the ledger. You confirm every action.';
