import { setPageVisibleTimeout } from "./page-visibility";

// Page-level data reads can fan out to several Supabase requests; keep the
// shared timeout long enough to avoid showing the page protection view during
// normal local test concurrency or brief cloud slowdowns.
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const REQUEST_TIMEOUT_ERROR_NAME = "RequestTimeoutError";
const DEFAULT_REQUEST_TIMEOUT_MESSAGE =
  "云端资料同步超时，请刷新页面或重新登录后重试。";

type TimeoutOptions = {
  timeoutMs?: number;
  message?: string;
};

export function withRequestTimeout<T>(
  promise: PromiseLike<T>,
  options: TimeoutOptions = {},
) {
  const {
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    message = DEFAULT_REQUEST_TIMEOUT_MESSAGE,
  } = options;

  return new Promise<T>((resolve, reject) => {
    const timeout = setPageVisibleTimeout(() => {
      const timeoutError = new Error(message);
      timeoutError.name = REQUEST_TIMEOUT_ERROR_NAME;
      reject(timeoutError);
    }, timeoutMs);

    Promise.resolve(promise).then(resolve, reject).finally(() => {
      timeout.clear();
    });
  });
}
