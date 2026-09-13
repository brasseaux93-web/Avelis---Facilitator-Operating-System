/** Human-readable identity classes. Stored values stay closed-vocabulary. */

export const IDENTITY_CLASS_OPTIONS = [
  { value: 'role_only', label: 'Role only' },
  { value: 'affiliation_only', label: 'Affiliation only' },
  { value: 'named', label: 'Named' },
  { value: 'unnamed', label: 'Unnamed' },
] as const;

export type IdentityClassValue = (typeof IDENTITY_CLASS_OPTIONS)[number]['value'];

const LABELS: Record<string, string> = {
  role_only: 'Role only',
  affiliation_only: 'Affiliation only',
  named: 'Named',
  unnamed: 'Unnamed',
  facilitator: 'Facilitator',
  Host: 'Facilitator',
};

export function identityClassLabel(value: string | null | undefined): string {
  if (!value) return 'Unnamed';
  return LABELS[value] || value;
}
