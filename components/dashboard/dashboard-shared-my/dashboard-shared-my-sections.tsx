"use client";

import type { ReactNode } from "react";

import {
  BadgeCheck,
  Copy,
  IdCard,
  KeyRound,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import {
  statusBadgeClass,
} from "@/components/dashboard/dashboard-shared-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DashboardMyCopy } from "./dashboard-shared-my-copy";
import { DashboardBusinessReferralPanel } from "./dashboard-business-referral-panel";
import type { DashboardSharedMyState } from "./use-dashboard-shared-my-state";

type DashboardSharedMySectionsProps = {
  copy: DashboardMyCopy;
  state: Pick<
    DashboardSharedMyState,
    "account" | "assetDialog" | "page" | "profileDialog" | "ui"
  >;
};

type StatItem = DashboardSharedMyState["account"]["profileStats"][number];

const SECTION_ITEMS = [
  {
    href: "#personal-center",
    icon: UserRound,
    key: "personalCenterTitle",
  },
  {
    href: "#account-center",
    icon: KeyRound,
    key: "accountCenterTitle",
  },
  {
    href: "#profile-info",
    icon: IdCard,
    key: "profileInfoTitle",
  },
  {
    href: "#account-verification",
    icon: ShieldCheck,
    key: "accountVerificationTitle",
  },
] as const;

export function DashboardSharedMySections({
  copy,
  state,
}: DashboardSharedMySectionsProps) {
  const { account, assetDialog, page, profileDialog, ui } = state;
  const [
    phoneStat,
    emailStat,
    passwordStat,
    inviteCodeStat,
    accountStatusStat,
    lastLoginStat,
  ] = account.profileStats;
  const profileStats = [
    { label: copy.nameLabel, value: account.displayName },
    { label: copy.cityLabel, value: account.displayCity },
    phoneStat,
    emailStat,
  ];
  const accountStats = [
    passwordStat,
    inviteCodeStat,
    accountStatusStat,
    lastLoginStat,
  ];

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        <SectionNavigation copy={copy} />

        <PersonalCenterSection
          account={account}
          copy={copy}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <ProfileInfoSection
            copy={copy}
            onEditProfile={profileDialog.openDialog}
            stats={profileStats}
            ui={ui}
          />
          <AccountCenterSection
            account={account}
            copy={copy}
            onRefreshProfile={() => void page.refreshBundle({ quiet: false })}
            stats={accountStats}
            ui={ui}
          />
        </div>

        <AccountVerificationSection
          account={account}
          assetDialog={assetDialog}
          copy={copy}
        />

        <footer className="flex flex-col gap-4 border-t border-[#e4e2de] px-1 pt-8 text-xs text-[#8a949b] sm:flex-row sm:items-center sm:justify-between">
          <p>{copy.copyright}</p>
          <LegalFooterLinks className="gap-6" copy={copy} />
        </footer>
      </section>
    </>
  );
}

function SectionNavigation({ copy }: { copy: DashboardMyCopy }) {
  return (
    <nav
      aria-label={copy.sectionNavigationLabel}
      className="sticky top-[7.25rem] z-[5] grid grid-cols-2 gap-3 rounded-[24px] bg-[#faf9f7]/90 py-2 backdrop-blur lg:top-[5.75rem] lg:grid-cols-4"
    >
      {SECTION_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <a
            className="flex min-h-14 items-center gap-3 rounded-[20px] border border-[#e7e3dc] bg-white/78 px-4 py-3 text-sm font-semibold text-[#486782] shadow-[0_10px_24px_rgba(96,113,128,0.05)] transition-colors hover:bg-[#f2f5f7]"
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4.5 text-[#6b7d8b]" />
            {copy[item.key]}
          </a>
        );
      })}
    </nav>
  );
}

function PersonalCenterSection({
  account,
  copy,
}: {
  account: DashboardSharedMyState["account"];
  copy: DashboardMyCopy;
}) {
  return (
    <section
      className="scroll-mt-28 rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:p-8"
      id="personal-center"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#486782]">
          <UserRound className="size-5" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-[#486782]">
          {copy.personalCenterTitle}
        </h3>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-[#dff0e4] px-3 py-1 text-xs font-semibold text-[#487155]">
            {account.membershipLabel}
          </span>
          <h2 className="mt-4 break-words text-4xl font-bold tracking-tight text-[#1f2a32]">
            {account.displayName}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#66727d]">
            <MapPin className="size-4" />
            {account.displayCity}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6e7780]">
            {copy.personalCenterDescription}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileInfoSection({
  copy,
  onEditProfile,
  stats,
  ui,
}: {
  copy: DashboardMyCopy;
  onEditProfile: () => void;
  stats: readonly StatItem[];
  ui: DashboardSharedMyState["ui"];
}) {
  return (
    <SectionShell
      action={
        <Button
          className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={ui.busyKey !== null}
          onClick={onEditProfile}
          variant="outline"
        >
          <UserRound className="size-4" />
          {copy.editProfile}
        </Button>
      }
      description={copy.profileInfoDescription}
      icon={<IdCard className="size-5" />}
      id="profile-info"
      title={copy.profileInfoTitle}
    >
      <StatGrid stats={stats} />
    </SectionShell>
  );
}

function AccountCenterSection({
  account,
  copy,
  onRefreshProfile,
  stats,
  ui,
}: {
  account: DashboardSharedMyState["account"];
  copy: DashboardMyCopy;
  onRefreshProfile: () => void;
  stats: readonly StatItem[];
  ui: DashboardSharedMyState["ui"];
}) {
  return (
    <SectionShell
      description={copy.accountCenterDescription}
      icon={<KeyRound className="size-5" />}
      id="account-center"
      title={copy.accountCenterTitle}
    >
      <StatGrid stats={stats} />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
          disabled={ui.busyKey !== null}
          onClick={() => void account.sendPasswordReset()}
        >
          {ui.busyKey === "password" ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          {copy.changePassword}
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
    </SectionShell>
  );
}

function AccountVerificationSection({
  account,
  assetDialog,
  copy,
}: {
  account: DashboardSharedMyState["account"];
  assetDialog: DashboardSharedMyState["assetDialog"];
  copy: DashboardMyCopy;
}) {
  return (
    <SectionShell
      description={copy.accountVerificationDescription}
      icon={<ShieldCheck className="size-5" />}
      id="account-verification"
      title={copy.accountVerificationTitle}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <VerificationStatusCard account={account} copy={copy} />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:col-span-8">
          {assetDialog.assets.map((asset) => (
            <button
              className="group rounded-[24px] border border-[#efede9] bg-white p-4 text-left shadow-[0_10px_24px_rgba(96,113,128,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(96,113,128,0.12)] active:scale-[0.985]"
              key={asset.key}
              onClick={() => assetDialog.openDialog(asset.key)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#2b3942]">
                  {asset.title}
                </p>
                <span className={statusBadgeClass(asset.tone)}>
                  {asset.status}
                </span>
              </div>
              <div className="relative mt-4 aspect-[1.58/1] overflow-hidden rounded-[18px] bg-[#ece9e4]">
                {asset.body}
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(72,103,130,0.18)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#486782]">
                    <Search className="size-5" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function VerificationStatusCard({
  account,
  copy,
}: {
  account: DashboardSharedMyState["account"];
  copy: DashboardMyCopy;
}) {
  const tone = getVerificationTone(account);

  return (
    <section
      className={cn(
        "h-full rounded-[24px] border p-6 shadow-[0_12px_30px_rgba(96,113,128,0.06)]",
        tone.container,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-white",
            tone.icon,
          )}
        >
          {account.certified ? (
            <BadgeCheck className="size-5" />
          ) : (
            <ShieldAlert className="size-5" />
          )}
        </div>
        <div>
          <p className={cn("text-xs font-semibold uppercase", tone.label)}>
            {copy.verificationTitle}
          </p>
          <p className={cn("mt-1 text-lg font-bold", tone.title)}>
            {account.certified
              ? copy.verificationApproved
              : account.verificationStatus === "pending"
                ? copy.verificationPending
                : copy.verificationEmpty}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#6e7780]">
        {account.certified
          ? copy.verificationApprovedDescription
          : account.verificationStatus === "pending"
            ? copy.verificationPendingDescription
            : copy.verificationEmptyDescription}
      </p>
    </section>
  );
}

function SectionShell({
  action,
  children,
  description,
  icon,
  id,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section
      className="scroll-mt-28 rounded-[28px] border border-white/85 bg-white/68 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8 xl:col-span-6"
      id={id}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e6edf2] text-[#486782]">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-[#486782]">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#6e7780]">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}

function StatGrid({ stats }: { stats: readonly StatItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      {stats.map((item) => (
        <div className="space-y-1" key={item.label}>
          <p className="font-label text-[11px] font-semibold tracking-[0.22em] text-[#7d8890] uppercase">
            {item.label}
          </p>
          {"accent" in item && item.accent === "success" ? (
            <p className="flex items-center gap-2 text-lg font-medium text-[#4c7259]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4c7259]" />
              {item.value}
            </p>
          ) : (
            <p
              className={cn(
                "break-words text-lg font-medium text-[#486782]",
                "mono" in item && item.mono && "tracking-[0.18em]",
              )}
            >
              {item.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function getVerificationTone(account: DashboardSharedMyState["account"]): {
  container: string;
  icon: string;
  label: string;
  title: string;
} {
  if (account.certified) {
    return {
      container: "border-[#d9e8dc] bg-[#edf5ef]",
      icon: "bg-[#4c7259]",
      label: "text-[#4c7259]",
      title: "text-[#355443]",
    };
  }

  if (account.verificationStatus === "pending") {
    return {
      container: "border-[#ecdcb1] bg-[#fbf5e6]",
      icon: "bg-[#b7892f]",
      label: "text-[#87631e]",
      title: "text-[#6f5318]",
    };
  }

  return {
    container: "border-[#ebdfd2] bg-[#fbf6ef]",
    icon: "bg-[#b07a4f]",
    label: "text-[#8b6240]",
    title: "text-[#704d31]",
  };
}
