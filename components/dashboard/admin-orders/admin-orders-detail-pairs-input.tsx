"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { fieldInputClassName } from "./admin-orders-dialog-ui";

type OrderDetailRow = {
  label: string;
  value: string;
};

type OrderDetailPairsInputCopy = {
  addLabel: string;
  namePlaceholder: string;
  removeLabel: string;
  valuePlaceholder: string;
};

export function OrderDetailPairsInput({
  copy,
  disabled,
  value,
  onChange,
}: {
  copy: OrderDetailPairsInputCopy;
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const rows = parseDetailRows(value);

  const updateRows = (nextRows: OrderDetailRow[]) => {
    onChange(serializeDetailRows(nextRows));
  };

  const handleAddRow = () => {
    updateRows([...rows, { label: "", value: "" }]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    updateRows(rows.filter((_, index) => index !== rowIndex));
  };

  const handleRowChange = (
    rowIndex: number,
    field: keyof OrderDetailRow,
    nextValue: string,
  ) => {
    updateRows(
      rows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: nextValue } : row,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          key={index}
        >
          <input
            aria-label={`${copy.namePlaceholder} ${index + 1}`}
            className={fieldInputClassName}
            disabled={disabled}
            onChange={(event) => handleRowChange(index, "label", event.target.value)}
            placeholder={copy.namePlaceholder}
            type="text"
            value={row.label}
          />
          <input
            aria-label={`${copy.valuePlaceholder} ${index + 1}`}
            className={fieldInputClassName}
            disabled={disabled}
            onChange={(event) => handleRowChange(index, "value", event.target.value)}
            placeholder={copy.valuePlaceholder}
            type="text"
            value={row.value}
          />
          <Button
            aria-label={`${copy.removeLabel} ${index + 1}`}
            className="h-12 rounded-[18px] border-[#e1ddd7] text-[#7d4a42]"
            disabled={disabled}
            onClick={() => handleRemoveRow(index)}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        className="h-10 rounded-[18px] border-[#d8e1da] bg-white px-4 text-[#3d5f4c] hover:bg-[#f3f8f4]"
        disabled={disabled}
        onClick={handleAddRow}
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        {copy.addLabel}
      </Button>
    </div>
  );
}

function parseDetailRows(value: string): OrderDetailRow[] {
  const normalized = value.trim();

  if (!normalized) {
    return [];
  }

  try {
    return parseJsonDetailRows(JSON.parse(normalized));
  } catch {
    return value
      .split(/\r?\n/)
      .map(parseLineDetailRow)
      .filter((row) => row !== null);
  }
}

function parseJsonDetailRows(value: unknown): OrderDetailRow[] {
  if (value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => ({
      label: String(index + 1),
      value: formatJsonDetailValue(item),
    }));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([label, detail]) => ({
      label,
      value: formatJsonDetailValue(detail),
    }));
  }

  return [{ label: "", value: formatJsonDetailValue(value) }];
}

function parseLineDetailRow(line: string): OrderDetailRow | null {
  const normalized = line.trim();

  if (!normalized) {
    return null;
  }

  const fullWidthSeparatorIndex = normalized.indexOf("\uFF1A");
  const separatorIndex =
    fullWidthSeparatorIndex >= 0 ? fullWidthSeparatorIndex : normalized.indexOf(":");

  if (separatorIndex < 0) {
    return { label: normalized, value: "" };
  }

  return {
    label: normalized.slice(0, separatorIndex).trim(),
    value: normalized.slice(separatorIndex + 1).trim(),
  };
}

function serializeDetailRows(rows: OrderDetailRow[]) {
  return rows
    .map((row) => {
      const label = normalizeDetailPart(row.label);
      const value = normalizeDetailPart(row.value);
      return `${label}: ${value}`;
    })
    .join("\n");
}

function normalizeDetailPart(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function formatJsonDetailValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}
