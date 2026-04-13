export type AppRole =
  | "administrator"
  | "operator"
  | "manager"
  | "recruiter"
  | "salesman"
  | "finance"
  | "client";

export function getDefaultWorkspaceBasePath(role: AppRole | null) {
  if (role === "manager") {
    return "/manager";
  }

  if (role === "recruiter") {
    return "/recruiter";
  }

  if (role === "salesman") {
    return "/salesman";
  }

  if (role === "operator") {
    return "/operator";
  }

  if (role === "finance") {
    return "/finance";
  }

  if (role === "client") {
    return "/client";
  }

  return "/admin";
}

export function getDefaultSignedInPathForRole(role: AppRole | null) {
  return `${getDefaultWorkspaceBasePath(role)}/my`;
}
