"use client";

type WorkspaceFeedbackSuccessToastProps = {
  message: string | null;
};

export function WorkspaceFeedbackSuccessToast({
  message,
}: WorkspaceFeedbackSuccessToastProps) {
  return message ? (
    <div
      className="fixed right-3 top-20 z-50 max-w-[calc(100vw-1.5rem)] rounded-[20px] border border-[#cfe1d8] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#2f6b4f] shadow-[0_18px_42px_rgba(72,86,98,0.16)] sm:right-6"
      role="status"
    >
      {message}
    </div>
  ) : null;
}
