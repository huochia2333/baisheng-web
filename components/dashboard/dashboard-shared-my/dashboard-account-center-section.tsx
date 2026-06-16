"use client";

import { Copy, KeyRound, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DashboardMyCopy } from "./dashboard-shared-my-copy";
import { DashboardBusinessReferralPanel } from "./dashboard-business-referral-panel";
import {
  DashboardMySectionShell,
  DashboardMyStatGrid,
  type DashboardMyStatItem,
} from "./dashboard-my-section-ui";
import type { DashboardSharedMyState } from "./use-dashboard-shared-my-state";

export function DashboardAccountCenterSection({
  account,
  copy,
  onRefreshProfile,
  stats,
  ui,
}: {
  account: DashboardSharedMyState["account"];
  copy: DashboardMyCopy;
  onRefreshProfile: () => void;
  stats: readonly DashboardMyStatItem[];
  ui: DashboardSharedMyState["ui"];
}) {
  const passwordResetButtonLabel =
    account.passwordResetCooldownRemaining > 0
      ? copy.passwordResetCountdown(account.passwordResetCooldownRemaining)
      : copy.changePassword;

  return (
    <DashboardMySectionShell
      description={copy.accountCenterDescription}
      icon={<KeyRound className="size-5" />}
      id="account-center"
      title={copy.accountCenterTitle}
    >
      <DashboardMyStatGrid stats={stats} />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="h-11 max-w-full rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
          disabled={ui.busyKey !== null || account.passwordResetCooldownRemaining > 0}
          onClick={() => void account.sendPasswordReset()}
        >
          {ui.busyKey === "password" ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          <span className="min-w-0 truncate">{passwordResetButtonLabel}</span>
        </Button>
        <Button
          className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
          onClick={() => void account.copyInviteCode()}
          variant="outline"
        >
          <Copy className="size-4" />
          {copy.copyInviteCode}
        </Button>
        <Button
          className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={ui.busyKey !== null}
          onClick={onRefreshProfile}
          variant="outline"
        >
          <RefreshCw
            className={cn(
              "size-4",
              ui.busyKey === "refresh" && "animate-spin",
            )}
          />
          {copy.refreshProfile}
        </Button>
      </div>

      <DashboardBusinessReferralPanel
        referralCode={account.referralCode}
        role={account.role}
      />
    </DashboardMySectionShell>
  );
}
