import { assertSpeechFree } from './firewall';
import { rankWithModel, readModelConfig } from './model';
import { applyProcessMarkPayloads, buildSnapshot, type SnapshotInput } from './snapshot';
import { runPlaybook } from './playbook';
import type { CopilotResult } from './types';

export { COPILOT_DISCLOSURE } from './types';
export { assertSpeechFree } from './firewall';
export { runPlaybook, inferStage, buildMinuteOutline } from './playbook';
export { buildSnapshot, applyProcessMarkPayloads } from './snapshot';
export { mergeModelOutput, readModelConfig } from './model';
export type { CopilotResult, CopilotAction, ProcessSnapshot, ProcessStage } from './types';

export async function advise(
  input: SnapshotInput & { processMarkPayloads?: Array<string | undefined> }
): Promise<CopilotResult> {
  let snapshot = buildSnapshot(input);
  if (input.processMarkPayloads) {
    snapshot = applyProcessMarkPayloads(snapshot, input.processMarkPayloads);
  }
  assertSpeechFree(snapshot);
  const playbook = runPlaybook(snapshot);
  const cfg = readModelConfig();
  if (!cfg) return playbook;
  try {
    return await rankWithModel(snapshot, playbook, cfg);
  } catch {
    return playbook;
  }
}
