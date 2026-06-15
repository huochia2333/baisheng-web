export const workspaceRouteSegments = [
  "admin",
  "salesman",
  "promoter",
  "recruiter",
  "manager",
  "operator",
  "finance",
  "client",
] as const;

export type WorkspaceRouteSegment = (typeof workspaceRouteSegments)[number];

export type WorkspaceLoadingTitleKey = WorkspaceRouteSegment;
