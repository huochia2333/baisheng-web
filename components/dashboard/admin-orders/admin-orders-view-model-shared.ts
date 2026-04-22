import type { Dispatch, SetStateAction } from "react";

import type { NoticeTone } from "@/components/dashboard/dashboard-shared-ui";

export type PageFeedback = { tone: NoticeTone; message: string } | null;

export type PageFeedbackSetter = Dispatch<SetStateAction<PageFeedback>>;

export type OrdersTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;
