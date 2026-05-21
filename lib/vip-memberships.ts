export const VIP_SCOPE_VALUES = ["retail", "wholesale"] as const;

export type VipMembershipScope = (typeof VIP_SCOPE_VALUES)[number];

export type VipMembershipSummary = {
  status: string | null;
  started_at: string | null;
  expires_at: string | null;
};

export type VipRechargeRequestSummary = {
  id: string;
  vip_scope: VipMembershipScope;
  requested_by_user_id: string | null;
  requested_by_name: string | null;
  requested_by_email: string | null;
  created_at: string | null;
  note: string | null;
};

export function isVipMembershipScope(
  value: unknown,
): value is VipMembershipScope {
  return value === "retail" || value === "wholesale";
}

export function getVipScopeLabel(scope: VipMembershipScope) {
  return scope === "wholesale" ? "批发VIP" : "零售/服务VIP";
}

export function normalizeVipMembershipSummary(
  value: unknown,
): VipMembershipSummary {
  if (!isRecord(value)) {
    return createEmptyVipMembershipSummary();
  }

  return {
    status: normalizeString(value.status),
    started_at: normalizeString(value.started_at),
    expires_at: normalizeString(value.expires_at),
  };
}

export function normalizeVipRechargeRequests(
  value: unknown,
): VipRechargeRequestSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const id = normalizeString(item.id);
    const vipScope = normalizeString(item.vip_scope);

    if (!id || !isVipMembershipScope(vipScope)) {
      return [];
    }

    return [
      {
        id,
        vip_scope: vipScope,
        requested_by_user_id: normalizeString(item.requested_by_user_id),
        requested_by_name: normalizeString(item.requested_by_name),
        requested_by_email: normalizeString(item.requested_by_email),
        created_at: normalizeString(item.created_at),
        note: normalizeString(item.note),
      },
    ];
  });
}

function createEmptyVipMembershipSummary(): VipMembershipSummary {
  return {
    status: null,
    started_at: null,
    expires_at: null,
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
