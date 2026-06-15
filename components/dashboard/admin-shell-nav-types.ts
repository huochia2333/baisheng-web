import type { WorkspaceNavSegment } from "@/lib/workspace-config";

export type AdminShellNavLink = {
  groupKey?: string;
  groupLabel?: string;
  href: string;
  icon: WorkspaceNavSegment;
  label: string;
};

export type AdminShellNavGroup = {
  items: readonly AdminShellNavLink[];
  key: string;
  label: string;
};
