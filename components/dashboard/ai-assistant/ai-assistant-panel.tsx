"use client";

import { useEffect, useRef, useState } from "react";

import {
  Bot,
  LoaderCircle,
  RefreshCw,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AiAssistantUiMessage } from "./use-ai-assistant-chat";

type AiAssistantPanelCopy = {
  close: string;
  inputLabel: string;
  placeholder: string;
  reset: string;
  resetConfirmAction: string;
  resetConfirmCancel: string;
  resetConfirmDescription: string;
  send: string;
  thinking: string;
  title: string;
};

type AiAssistantPanelProps = {
  copy: AiAssistantPanelCopy;
  errorMessage: string | null;
  input: string;
  messages: AiAssistantUiMessage[];
  onClose: () => void;
  onInputChange: (value: string) => void;
  onReset: () => void;
  onSend: () => void;
  pending: boolean;
};

export function AiAssistantPanel({
  copy,
  errorMessage,
  input,
  messages,
  onClose,
  onInputChange,
  onReset,
  onSend,
  pending,
}: AiAssistantPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [errorMessage, messages, pending]);

  return (
    <motion.section
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-label={copy.title}
      className="fixed bottom-[5.5rem] right-3 z-40 flex h-[min(640px,calc(100dvh-7rem))] w-[calc(100vw-1.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[26px] border border-white/85 bg-[#fbfaf8] shadow-[0_22px_56px_rgba(35,49,58,0.2)] sm:bottom-24 sm:right-6"
      exit={{ opacity: 0, scale: 0.98, y: 18 }}
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#ebe7e1] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#486782] text-white">
            <Bot className="size-5" />
          </div>
          <h2 className="truncate text-base font-semibold text-[#23313a]">
            {copy.title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={copy.reset}
            className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-[#486782] transition-colors hover:bg-[#eef3f6] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => setResetConfirmOpen(true)}
            type="button"
          >
            <RefreshCw className="size-4" />
            <span>{copy.reset}</span>
          </button>
          <button
            aria-label={copy.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#657684] transition-colors hover:bg-[#eef3f6]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {resetConfirmOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-[#ebe7e1] bg-[#f6f4f0] px-4 py-3"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#60707d]">
                {copy.resetConfirmDescription}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="h-8 rounded-full px-3 text-sm font-medium text-[#657684] transition-colors hover:bg-white"
                  onClick={() => setResetConfirmOpen(false)}
                  type="button"
                >
                  {copy.resetConfirmCancel}
                </button>
                <button
                  className="h-8 rounded-full bg-[#486782] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#3e5f79]"
                  onClick={() => {
                    onReset();
                    setResetConfirmOpen(false);
                    window.requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  type="button"
                >
                  {copy.resetConfirmAction}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
        {messages
          .filter((message) => message.content.length > 0)
          .map((message) => (
            <AssistantMessageBubble key={message.id} message={message} />
          ))}

        {pending ? (
          <div className="flex justify-start">
            <div className="flex max-w-[84%] items-center gap-2 rounded-[20px] border border-[#e7e2db] bg-white px-4 py-3 text-sm text-[#66727d] shadow-[0_8px_18px_rgba(96,113,128,0.06)]">
              <LoaderCircle className="size-4 animate-spin" />
              {copy.thinking}
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[18px] border border-[#f1d1d1] bg-[#fff2f2] px-4 py-3 text-sm leading-6 text-[#9f3535]">
            {errorMessage}
          </div>
        ) : null}

        <div ref={messageEndRef} />
      </div>

      <form
        className="border-t border-[#ebe7e1] bg-white/72 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void onSend();
        }}
      >
        <label className="sr-only" htmlFor="ai-assistant-input">
          {copy.inputLabel}
        </label>
        <div className="flex items-end gap-2 rounded-[22px] border border-[#ded8cf] bg-white p-2 focus-within:border-[#bfd2e1] focus-within:ring-4 focus-within:ring-[#bfd2e1]/30">
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#23313a] outline-none placeholder:text-[#8a969f]"
            disabled={pending}
            id="ai-assistant-input"
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSend();
              }
            }}
            placeholder={copy.placeholder}
            ref={inputRef}
            rows={1}
            value={input}
          />
          <Button
            aria-label={copy.send}
            className="h-10 w-10 rounded-full bg-[#486782] p-0 text-white hover:bg-[#3e5f79]"
            disabled={!input.trim() || pending}
            type="submit"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </motion.section>
  );
}

function AssistantMessageBubble({
  message,
}: {
  message: AiAssistantUiMessage;
}) {
  const fromUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", fromUser ? "justify-end" : "justify-start")}>
      {!fromUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef3f6] text-[#486782]">
          <Bot className="size-3.5" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[84%] whitespace-pre-wrap rounded-[20px] px-4 py-3 text-sm leading-6 shadow-[0_8px_18px_rgba(96,113,128,0.06)]",
          fromUser
            ? "bg-[#486782] text-white"
            : "border border-[#e7e2db] bg-white text-[#4f5f6b]",
        )}
      >
        {message.content}
      </div>
      {fromUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1efeb] text-[#657684]">
          <UserRound className="size-3.5" />
        </div>
      ) : null}
    </div>
  );
}
