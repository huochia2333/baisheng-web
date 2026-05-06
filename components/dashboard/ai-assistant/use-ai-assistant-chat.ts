"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  AiAssistantChatMessage,
  AiAssistantChatRequest,
  AiAssistantLocale,
} from "@/lib/ai-assistant/assistant-types";

export type AiAssistantUiMessage = AiAssistantChatMessage & {
  id: string;
  intro?: boolean;
};

type AiAssistantChatCopy = {
  greeting: string;
  serviceUnavailable: string;
};

type UseAiAssistantChatOptions = {
  copy: AiAssistantChatCopy;
  locale: AiAssistantLocale;
  pathname: string;
};

export function useAiAssistantChat({
  copy,
  locale,
  pathname,
}: UseAiAssistantChatOptions) {
  const introMessage = useMemo<AiAssistantUiMessage>(
    () => ({
      content: copy.greeting,
      id: "assistant-intro",
      intro: true,
      role: "assistant",
    }),
    [copy.greeting],
  );
  const [messages, setMessages] = useState<AiAssistantUiMessage[]>([
    introMessage,
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMessages([introMessage]);
    setInput("");
    setErrorMessage(null);
    setPending(false);
  }, [introMessage]);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || pending) {
      return;
    }

    const history = messages
      .filter((item) => !item.intro)
      .map(({ content, role }) => ({
        content,
        role,
      }));
    const userMessage: AiAssistantUiMessage = {
      content: trimmedInput,
      id: createMessageId("user"),
      role: "user",
    };
    const assistantMessageId = createMessageId("assistant");
    const assistantMessage: AiAssistantUiMessage = {
      content: "",
      id: assistantMessageId,
      role: "assistant",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setErrorMessage(null);
    setPending(true);

    try {
      const requestBody: AiAssistantChatRequest = {
        history,
        locale,
        message: trimmedInput,
        pathname,
      };
      const response = await fetch("/api/assistant/chat", {
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("assistant unavailable");
      }

      if (!response.body) {
        throw new Error("assistant unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let hasReply = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        if (!chunk) {
          continue;
        }

        hasReply = true;
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: `${item.content}${chunk}`,
                }
              : item,
          ),
        );
      }

      const tail = decoder.decode();

      if (tail) {
        hasReply = true;
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: `${item.content}${tail}`,
                }
              : item,
          ),
        );
      }

      if (!hasReply) {
        throw new Error("assistant unavailable");
      }
    } catch {
      setMessages((current) =>
        current.filter((item) => item.id !== assistantMessageId),
      );
      setErrorMessage(copy.serviceUnavailable);
    } finally {
      setPending(false);
    }
  }, [
    copy.serviceUnavailable,
    input,
    locale,
    messages,
    pathname,
    pending,
  ]);

  return {
    errorMessage,
    input,
    messages,
    pending,
    reset,
    sendMessage,
    setInput,
  };
}

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
