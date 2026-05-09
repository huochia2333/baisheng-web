"use client";

import { MessageSquarePlus } from "lucide-react";

import type { WorkspaceFeedbackFormState } from "@/components/dashboard/workspace-feedback/workspace-feedback-display";
import { Button } from "@/components/ui/button";

import type { AiAssistantOpenFeedback } from "./ai-assistant-feedback-bridge";
import type { AiAssistantUiMessage } from "./use-ai-assistant-chat";

export type AiAssistantFeedbackEntryCopy = {
  action: string;
  assistantReplyLabel: string;
  draftExpectation: string;
  draftIntro: string;
  draftTitle: string;
  errorDescription: string;
  errorLabel: string;
  explicitDescription: string;
  unableDescription: string;
  userQuestionLabel: string;
};

type AiAssistantFeedbackEntryProps = {
  copy: AiAssistantFeedbackEntryCopy;
  errorMessage: string | null;
  messages: AiAssistantUiMessage[];
  onOpenFeedback: AiAssistantOpenFeedback;
};

const USER_FEEDBACK_KEYWORDS = [
  "bug",
  "feedback",
  "issue",
  "problem",
  "suggestion",
  "不对",
  "不好用",
  "不能用",
  "出错",
  "反馈",
  "建议",
  "报错",
  "无法使用",
  "有问题",
  "错误",
] as const;
const ASSISTANT_UNABLE_KEYWORDS = [
  "I cannot confirm",
  "I can't confirm",
  "I am not able to confirm",
  "我还不能确认",
] as const;

export function AiAssistantFeedbackEntry({
  copy,
  errorMessage,
  messages,
  onOpenFeedback,
}: AiAssistantFeedbackEntryProps) {
  const feedbackPrompt = createAiAssistantFeedbackPrompt({
    copy,
    errorMessage,
    messages,
  });

  if (!feedbackPrompt) {
    return null;
  }

  return (
    <div className="rounded-[18px] border border-[#d7e5dd] bg-[#f4faf6] px-4 py-3 text-sm leading-6 text-[#3f6b55]">
      <p>{feedbackPrompt.description}</p>
      <Button
        className="mt-3 h-9 rounded-full bg-[#4f7a61] px-4 text-sm font-semibold text-white hover:bg-[#456e58]"
        onClick={() => onOpenFeedback(feedbackPrompt.draft)}
        type="button"
      >
        <MessageSquarePlus className="size-4" />
        {copy.action}
      </Button>
    </div>
  );
}

function createAiAssistantFeedbackPrompt({
  copy,
  errorMessage,
  messages,
}: {
  copy: AiAssistantFeedbackEntryCopy;
  errorMessage: string | null;
  messages: AiAssistantUiMessage[];
}): { description: string; draft: Partial<WorkspaceFeedbackFormState> } | null {
  const latestUserMessage = findLatestMessage(messages, "user");
  const latestAssistantMessage = findLatestAssistantMessage(messages);
  const userQuestion = latestUserMessage?.content.trim() ?? "";
  const assistantReply = latestAssistantMessage?.content.trim() ?? "";
  const userWantsFeedback = hasAnyKeyword(userQuestion, USER_FEEDBACK_KEYWORDS);
  const assistantCannotConfirm = hasAnyKeyword(
    assistantReply,
    ASSISTANT_UNABLE_KEYWORDS,
  );

  if (!errorMessage && !userWantsFeedback && !assistantCannotConfirm) {
    return null;
  }

  const description = errorMessage
    ? copy.errorDescription
    : userWantsFeedback
      ? copy.explicitDescription
      : copy.unableDescription;

  return {
    description,
    draft: {
      content: createDraftContent({
        assistantReply,
        copy,
        errorMessage,
        userQuestion,
      }),
      feedbackType: "bug",
      title: copy.draftTitle,
    },
  };
}

function createDraftContent({
  assistantReply,
  copy,
  errorMessage,
  userQuestion,
}: {
  assistantReply: string;
  copy: AiAssistantFeedbackEntryCopy;
  errorMessage: string | null;
  userQuestion: string;
}) {
  return [
    copy.draftIntro,
    userQuestion ? `${copy.userQuestionLabel}${userQuestion}` : null,
    errorMessage
      ? `${copy.errorLabel}${errorMessage}`
      : assistantReply
        ? `${copy.assistantReplyLabel}${assistantReply.slice(0, 600)}`
        : null,
    copy.draftExpectation,
  ]
    .filter(Boolean)
    .join("\n");
}

function findLatestMessage(
  messages: readonly AiAssistantUiMessage[],
  role: AiAssistantUiMessage["role"],
) {
  return [...messages].reverse().find((message) => message.role === role);
}

function findLatestAssistantMessage(messages: readonly AiAssistantUiMessage[]) {
  return [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        !message.intro &&
        message.content.trim().length > 0,
    );
}

function hasAnyKeyword(value: string, keywords: readonly string[]) {
  const normalizedValue = value.toLowerCase();

  return keywords.some((keyword) =>
    normalizedValue.includes(keyword.toLowerCase()),
  );
}
