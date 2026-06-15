export const workspaceSectionKeys = [
  "orders",
  "referrals",
  "team",
  "people",
  "records",
  "commission",
  "tasks",
  "reviews",
] as const;

export type WorkspaceSectionKey = (typeof workspaceSectionKeys)[number];

const workspaceSectionKeySet = new Set<string>(workspaceSectionKeys);

export function getWorkspaceSectionKey(section: string): WorkspaceSectionKey | null {
  return workspaceSectionKeySet.has(section) ? (section as WorkspaceSectionKey) : null;
}
