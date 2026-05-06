"use client";

import { useEffect, useMemo, useState } from "react";

import { usePathname } from "next/navigation";
import { Bot, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { useLocale } from "@/components/i18n/locale-provider";
import type { AiAssistantLocale } from "@/lib/ai-assistant/assistant-types";

import { AiAssistantPanel } from "./ai-assistant-panel";
import { useAiAssistantChat } from "./use-ai-assistant-chat";

export function AiAssistantClient() {
  const t = useTranslations("DashboardShell.aiAssistant");
  const pathname = usePathname();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const assistantLocale: AiAssistantLocale = locale === "en" ? "en" : "zh";
  const copy = useMemo(
    () => ({
      close: t("close"),
      greeting: t("greeting"),
      inputLabel: t("inputLabel"),
      open: t("open"),
      placeholder: t("placeholder"),
      reset: t("reset"),
      resetConfirmAction: t("resetConfirmAction"),
      resetConfirmCancel: t("resetConfirmCancel"),
      resetConfirmDescription: t("resetConfirmDescription"),
      send: t("send"),
      serviceUnavailable: t("serviceUnavailable"),
      thinking: t("thinking"),
      title: t("title"),
    }),
    [t],
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
            onReset={chat.reset}
            onSend={chat.sendMessage}
            pending={chat.pending}
          />
        ) : null}
      </AnimatePresence>

      <motion.button
        aria-expanded={open}
        aria-label={copy.open}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#486782] text-white shadow-[0_16px_34px_rgba(35,49,58,0.24)] transition hover:bg-[#3e5f79] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#bfd2e1]/50 sm:bottom-6 sm:right-6"
        onClick={() => setOpen((current) => !current)}
        type="button"
        whileTap={{ scale: 0.94 }}
      >
        {open ? <Bot className="size-6" /> : <MessageCircle className="size-6" />}
      </motion.button>
    </>
  );
}
