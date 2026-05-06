import { NextResponse } from "next/server";

import { buildAssistantMessages } from "@/lib/ai-assistant/assistant-prompt";
import type {
  AiAssistantChatErrorCode,
  AiAssistantChatMessage,
  AiAssistantLocale,
} from "@/lib/ai-assistant/assistant-types";
import {
  AiAssistantServiceError,
  createDeepSeekAssistantTextStream,
} from "@/lib/ai-assistant/deepseek-client";
import { getServerAuthContext } from "@/lib/server-auth";

export const runtime = "nodejs";

const ASSISTANT_TIMEOUT_MS = 20_000;
const MAX_HISTORY_ITEMS = 6;
const MAX_MESSAGE_LENGTH = 600;

const STATUS_BY_ERROR_CODE = {
  invalidInput: 400,
  notSignedIn: 401,
  serviceUnavailable: 503,
} as const satisfies Record<AiAssistantChatErrorCode, number>;

export async function POST(request: Request) {
  const { role, userId } = await getServerAuthContext();

  if (!userId) {
    return createErrorResponse("notSignedIn");
  }

  let payload: NormalizedAssistantPayload;

  try {
    payload = normalizeRequestPayload(await request.json());
  } catch {
    return createErrorResponse("invalidInput");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);

  try {
    const messages = buildAssistantMessages({
      context: {
        locale: payload.locale,
        pathname: payload.pathname,
        role,
      },
      history: payload.history,
      message: payload.message,
    });
    const stream = await createDeepSeekAssistantTextStream({
      messages,
      onSettled: () => clearTimeout(timeout),
      signal: controller.signal,
      userId,
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof AiAssistantServiceError) {
      return createErrorResponse("serviceUnavailable");
    }

    return createErrorResponse("serviceUnavailable");
  }
}

type NormalizedAssistantPayload = {
  history: AiAssistantChatMessage[];
  locale: AiAssistantLocale;
  message: string;
  pathname: string;
};

function normalizeRequestPayload(value: unknown): NormalizedAssistantPayload {
  if (!isRecord(value)) {
    throw new Error("invalid assistant payload");
  }

  const message = normalizeString(value.message, MAX_MESSAGE_LENGTH);

  if (!message) {
    throw new Error("empty assistant message");
  }

  return {
    history: normalizeHistory(value.history),
    locale: value.locale === "en" ? "en" : "zh",
    message,
    pathname: normalizeString(value.pathname, 160) || "/",
  };
}

function normalizeHistory(value: unknown): AiAssistantChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item): AiAssistantChatMessage => {
      const role: AiAssistantChatMessage["role"] =
        item.role === "assistant" ? "assistant" : "user";

      return {
        content: normalizeString(item.content, MAX_MESSAGE_LENGTH),
        role,
      };
    })
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
}

function normalizeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createErrorResponse(code: AiAssistantChatErrorCode) {
  return NextResponse.json(
    {
      error: code,
    },
    {
      status: STATUS_BY_ERROR_CODE[code],
    },
  );
}
