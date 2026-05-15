"use client";

import { useEffect, useState } from "react";

import {
  BriefcaseBusiness,
  Copy,
  LoaderCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { buildBoardInviteLink } from "@/lib/business-referrals";
import {
  getCurrentSalesmanBusinessBoards,
  type SalesmanBusinessBoard,
} from "@/lib/salesman-business-access";
import { getBrowserSupabaseClient } from "@/lib/supabase";

import { Button } from "../../ui/button";

type DashboardBusinessReferralPanelProps = {
  referralCode: string | null;
  role: string | null;
};

type LocalNotice = {
  message: string;
  tone: "error" | "success";
};

const BOARD_COPY_KEYS = {
  dropshipping: "businessReferralDropshipping",
  tourism: "businessReferralTourism",
} as const satisfies Record<SalesmanBusinessBoard, string>;

export function DashboardBusinessReferralPanel({
  referralCode,
  role,
}: DashboardBusinessReferralPanelProps) {
  const t = useTranslations("DashboardMy");
  const supabase = getBrowserSupabaseClient();
  const [salesmanBoards, setSalesmanBoards] = useState<SalesmanBusinessBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<LocalNotice | null>(null);

  useEffect(() => {
    if (!supabase || role !== "salesman") {
      setSalesmanBoards([]);
      setLoading(false);
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadBoards() {
      setLoading(true);

      try {
        if (role === "salesman") {
          const boards = await getCurrentSalesmanBusinessBoards(client);

          if (mounted) {
            setSalesmanBoards(boards);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadBoards();

    return () => {
      mounted = false;
    };
  }, [role, supabase]);

    if (role !== "salesman") {
      return null;
    }

  const boardLabel = (board: SalesmanBusinessBoard) => t(BOARD_COPY_KEYS[board]);

  const copyInviteLink = async (board: SalesmanBusinessBoard) => {
    if (!referralCode || typeof window === "undefined") {
      setNotice({ message: t("businessInviteNoCode"), tone: "error" });
      return;
    }

    const inviteLink = buildBoardInviteLink({
      board,
      origin: window.location.origin,
      referralCode,
    });

    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice({
        message: t("businessInviteCopied", { board: boardLabel(board) }),
        tone: "success",
      });
    } catch {
      setNotice({ message: t("businessInviteCopyFailed"), tone: "error" });
    }
  };

  return (
    <div className="mt-6 border-t border-[#e0ddd8] pt-6">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#486782]">
          <BriefcaseBusiness className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-[#24323c]">
            {t("businessInviteTitle")}
          </h4>
          <p className="mt-1 text-sm leading-6 text-[#6d767c]">
            {t("businessInviteDescription")}
          </p>
        </div>
      </div>

      {notice ? (
        <p
          className={
            notice.tone === "success"
              ? "mt-4 text-sm leading-6 text-[#487155]"
              : "mt-4 text-sm leading-6 text-[#9d3a35]"
          }
        >
          {notice.message}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-[#6d767c]">
          <LoaderCircle className="size-4 animate-spin" />
          {t("businessReferralLoading")}
        </p>
      ) : null}

      {!loading ? (
        <SalesmanInviteActions
          boards={salesmanBoards}
          boardLabel={boardLabel}
          copyInviteLink={copyInviteLink}
          referralCode={referralCode}
          t={t}
        />
      ) : null}
    </div>
  );
}

function SalesmanInviteActions({
  boards,
  boardLabel,
  copyInviteLink,
  referralCode,
  t,
}: {
  boards: SalesmanBusinessBoard[];
  boardLabel: (board: SalesmanBusinessBoard) => string;
  copyInviteLink: (board: SalesmanBusinessBoard) => Promise<void>;
  referralCode: string | null;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  if (!referralCode) {
    return <p className="mt-4 text-sm text-[#9d3a35]">{t("businessInviteNoCode")}</p>;
  }

  if (boards.length === 0) {
    return <p className="mt-4 text-sm text-[#6d767c]">{t("businessInviteNoAccess")}</p>;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {boards.map((board) => (
        <Button
          className="h-auto min-h-11 rounded-full border-[#d4d8dc] bg-white px-5 py-2 text-[#486782] hover:bg-[#f2f4f6]"
          key={board}
          onClick={() => void copyInviteLink(board)}
          type="button"
          variant="outline"
        >
          <Copy className="size-4" />
          <span className="whitespace-normal text-left">
            {t("businessInviteCopyBoardLink", { board: boardLabel(board) })}
          </span>
        </Button>
      ))}
    </div>
  );
}
