"use client";

import { useEffect, useMemo, useState } from "react";

import { usePathname } from "next/navigation";
import { Bot, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import type { AiAssistantLocale } from "@/lib/ai-assistant/assistant-types";
import { getCompanyText } from "@/lib/company-config";

import { AiAssistantFeedbackBridge } from "./ai-assistant-feedback-bridge";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { useAiAssistantChat } from "./use-ai-assistant-chat";

export function AiAssistantClient() {
  const t = useTranslations("DashboardShell.aiAssistant");
  const pathname = usePathname();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const assistantLocale: AiAssistantLocale = locale === "en" ? "en" : "zh";
  const companyText = getCompanyText(assistantLocale);
  const copy = useMemo(
    () => ({
      close:
        assistantLocale === "en"
          ? `Close ${companyText.assistantName}`
          : `关闭${companyText.assistantName}`,
      feedbackEntry: {
        action: t("feedbackAction"),
        assistantReplyLabel: t("feedbackDraftAssistantLabel"),
        draftExpectation: t("feedbackDraftExpectation"),
        draftIntro:
          assistantLocale === "en"
            ? `I ran into this while using ${companyText.assistantName}:`
            : `我在使用${companyText.assistantName}时遇到这个问题：`,
        draftTitle:
          assistantLocale === "en"
            ? `${companyText.assistantName} did not solve my problem`
            : `${companyText.assistantName}没有解决我的问题`,
        errorDescription: t("feedbackErrorDescription"),
        errorLabel: t("feedbackDraftErrorLabel"),
        explicitDescription: t("feedbackExplicitDescription"),
        unableDescription: t("feedbackUnableDescription"),
        userQuestionLabel: t("feedbackDraftUserQuestionLabel"),
      },
      greeting: t("greeting"),
      inputLabel: t("inputLabel"),
      open:
        assistantLocale === "en"
          ? `Open ${companyText.assistantName}`
          : `打开${companyText.assistantName}`,
      placeholder: t("placeholder"),
      reset: t("reset"),
      resetConfirmAction: t("resetConfirmAction"),
      resetConfirmCancel: t("resetConfirmCancel"),
      resetConfirmDescription: t("resetConfirmDescription"),
      send: t("send"),
      serviceUnavailable: t("serviceUnavailable"),
      thinking: t("thinking"),
      title: companyText.assistantName,
    }),
    [assistantLocale, companyText.assistantName, t],
  );
  const chat = useAiAssistantChat({
    copy,
    locale: assistantLocale,
    pathname,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <AiAssistantFeedbackBridge>
      {({ openFeedback }) => (
        <>
          <AnimatePresence>
            {open ? (
              <AiAssistantPanel
                copy={copy}
                errorMessage={chat.errorMessage}
                input={chat.input}
                messages={chat.messages}
                onClose={() => setOpen(false)}
                onInputChange={chat.setInput}
                onOpenFeedback={openFeedback}
                onReset={chat.reset}
                onSend={chat.sendMessage}
                pending={chat.pending}
              />
            ) : null}
          </AnimatePresence>

          <motion.button
            aria-expanded={open}
            aria-label={copy.open}
            className="z-40 mb-5 mr-4 ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#486782] text-white shadow-[0_16px_34px_rgba(35,49,58,0.24)] transition hover:bg-[#3e5f79] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#bfd2e1]/50 sm:fixed sm:right-6 sm:bottom-6 sm:mb-0 sm:mr-0"
            onClick={() => setOpen((current) => !current)}
            type="button"
            whileTap={{ scale: 0.94 }}
          >
            {open ? (
              <Bot className="size-6" />
            ) : (
              <MessageCircle className="size-6" />
            )}
          </motion.button>
        </>
      )}
    </AiAssistantFeedbackBridge>
  );
}
