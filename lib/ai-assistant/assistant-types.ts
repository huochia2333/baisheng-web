import type { AppRole } from "@/lib/auth-routing";

export type AiAssistantMessageRole = "assistant" | "user";

export type AiAssistantChatMessage = {
  content: string;
  role: AiAssistantMessageRole;
};

export type AiAssistantLocale = "en" | "zh";

export type AiAssistantChatRequest = {
  history?: AiAssistantChatMessage[];
  locale?: AiAssistantLocale;
  message: string;
  pathname?: string;
};

export type AiAssistantChatResponse = {
  reply: string;
};

export type AiAssistantChatErrorCode =
  | "invalidInput"
  | "notSignedIn"
  | "serviceUnavailable";

export type AiAssistantPromptContext = {
  locale: AiAssistantLocale;
  pathname: string;
  role: AppRole | null;
};
