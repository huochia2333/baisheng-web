"use client";

import { useMemo, useState } from "react";

export type WholesaleOrderAssessmentFilters = {
  customerId: string;
  orderedFromDate: string;
  orderedToDate: string;
  salesUserId: string;
  searchText: string;
  status: string;
};

export function useWholesaleOrderAssessment(
  filters: WholesaleOrderAssessmentFilters,
) {
  const [rawAssessment, setRawAssessment] = useState("");
  const [assessmentFilterKey, setAssessmentFilterKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const assessment = useMemo(
    () => sanitizeWholesaleAssessmentText(rawAssessment),
    [rawAssessment],
  );
  const hasStaleAssessment =
    Boolean(assessment) && assessmentFilterKey !== filterKey;

  const generateAssessment = async () => {
    setPending(true);
    setErrorMessage("");
    setRawAssessment("");
    setAssessmentFilterKey(filterKey);

    try {
      const response = await fetch("/api/wholesale/order-assessment", {
        body: JSON.stringify({ filters }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("assessment_failed");
      }

      if (!response.body) {
        setRawAssessment((await response.text()).trim());
        return;
      }

      await readAssessmentStream(response.body, (chunk) => {
        setRawAssessment((current) => `${current}${chunk}`);
      });
    } catch {
      setErrorMessage("评估暂时没有生成成功，请稍后再试。");
    } finally {
      setPending(false);
    }
  };

  return {
    assessment,
    errorMessage,
    generateAssessment,
    hasStaleAssessment,
    pending,
  };
}

function sanitizeWholesaleAssessmentText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      let nextLine = line.trimEnd();

      nextLine = nextLine
        .replace(/^\s*#{1,6}\s*/, "")
        .replace(/^\s*[-*+]\s+/, "· ")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*\n]+)\*/g, "$1")
        .replace(/_([^_\n]+)_/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*/g, "");

      return nextLine.trimEnd();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readAssessmentStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      onChunk(decoder.decode(value, { stream: true }));
    }

    const remaining = decoder.decode();

    if (remaining) {
      onChunk(remaining);
    }
  } finally {
    reader.releaseLock();
  }
}
