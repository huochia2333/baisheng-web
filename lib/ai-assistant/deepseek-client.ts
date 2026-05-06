export type ChatCompletionMessageParam = {
  content: string;
  role: "assistant" | "system" | "user";
};

type DeepSeekStreamChoice = {
  delta?: {
    content?: unknown;
  };
};

type DeepSeekStreamChunk = {
  choices?: DeepSeekStreamChoice[];
};

type CreateDeepSeekAssistantStreamOptions = {
  messages: ChatCompletionMessageParam[];
  onSettled?: () => void;
  signal: AbortSignal;
  userId: string;
};

export class AiAssistantServiceError extends Error {
  code: "missingConfig" | "providerError";

  constructor(code: AiAssistantServiceError["code"]) {
    super(code);
    this.code = code;
  }
}

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const MAX_ASSISTANT_TOKENS = 700;

export async function createDeepSeekAssistantTextStream({
  messages,
  onSettled,
  signal,
  userId,
}: CreateDeepSeekAssistantStreamOptions) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new AiAssistantServiceError("missingConfig");
  }

  const response = await fetch(
    `${resolveDeepSeekBaseUrl()}/chat/completions`,
    {
      body: JSON.stringify({
        max_tokens: MAX_ASSISTANT_TOKENS,
        messages,
        model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL,
        stream: true,
        temperature: 0.2,
        thinking: {
          type: "disabled",
        },
        user_id: normalizeDeepSeekUserId(userId),
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new AiAssistantServiceError("providerError");
  }

  return createTextStreamFromDeepSeekSse(response.body, onSettled);
}

function createTextStreamFromDeepSeekSse(
  body: ReadableStream<Uint8Array>,
  onSettled?: () => void,
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = body.getReader();
  let settled = false;

  const settle = () => {
    if (settled) {
      return;
    }

    settled = true;
    onSettled?.();
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          buffer = flushSseEvents(buffer, (text) => {
            controller.enqueue(encoder.encode(text));
          });
        }

        buffer += decoder.decode();
        flushSseEvents(`${buffer}\n\n`, (text) => {
          controller.enqueue(encoder.encode(text));
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
        settle();
      }
    },
    async cancel() {
      await reader.cancel();
      settle();
    },
  });
}

function flushSseEvents(buffer: string, onText: (text: string) => void) {
  const events = buffer.split(/\r?\n\r?\n/);
  const remaining = events.pop() ?? "";

  for (const event of events) {
    const dataLines = event
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());

    for (const data of dataLines) {
      if (!data || data === "[DONE]") {
        continue;
      }

      const text = extractDeltaContent(data);

      if (text) {
        onText(text);
      }
    }
  }

  return remaining;
}

function extractDeltaContent(data: string) {
  try {
    const chunk = JSON.parse(data) as DeepSeekStreamChunk;
    const content = chunk.choices?.[0]?.delta?.content;

    return typeof content === "string" ? content : "";
  } catch {
    return "";
  }
}

function resolveDeepSeekBaseUrl() {
  const value = process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL;

  return value.replace(/\/+$/, "");
}

function normalizeDeepSeekUserId(userId: string) {
  const normalized = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96);

  return normalized ? `user_${normalized}` : undefined;
}
