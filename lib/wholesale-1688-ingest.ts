export type Wholesale1688IngestRow = {
  external_order_number: string;
  seller_name: string | null;
  item_summary: string | null;
  quantity: number | null;
  purchase_amount: number | null;
  order_status: string | null;
  purchased_at: string | null;
  recipient_name: string | null;
  customer_id?: string | null;
  wholesale_order_id?: string | null;
  raw_payload: Record<string, unknown>;
};

type IngestPayload = {
  fileName: string | null;
  rows: Wholesale1688IngestRow[];
  source: "api" | "csv";
};

const MAX_API_ROWS = 500;

export function normalizeWholesale1688ApiPayload(value: unknown): IngestPayload {
  if (!isRecord(value)) {
    throw new Error("invalid_payload");
  }

  const rowsInput = Array.isArray(value.rows) ? value.rows : [];
  const rows = rowsInput
    .slice(0, MAX_API_ROWS)
    .map(normalizeWholesale1688Row)
    .filter((row): row is Wholesale1688IngestRow => Boolean(row));

  return {
    fileName: stringOrNull(value.fileName) ?? stringOrNull(value.batchName),
    rows,
    source: "api",
  };
}

export function normalizeWholesale1688Row(
  value: unknown,
): Wholesale1688IngestRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const externalOrderNumber = pickString(value, [
    "external_order_number",
    "order_number",
    "orderNumber",
    "order_id",
    "orderId",
    "1688订单号",
    "订单号",
    "订单编号",
    "采购订单号",
  ]);

  if (!externalOrderNumber) {
    return null;
  }

  return {
    external_order_number: externalOrderNumber,
    customer_id: pickString(value, [
      "customer_id",
      "customerId",
      "批发客户id",
      "客户id",
    ]),
    item_summary: pickString(value, [
      "item_summary",
      "item",
      "itemName",
      "product_name",
      "商品",
      "商品名称",
      "标题",
    ]),
    order_status: pickString(value, [
      "order_status",
      "status",
      "订单状态",
      "状态",
    ]),
    purchase_amount: parseNumber(
      pickUnknown(value, [
        "purchase_amount",
        "amount",
        "paid_amount",
        "采购金额",
        "实付款",
        "金额",
      ]),
    ),
    purchased_at: parseDate(
      pickUnknown(value, [
        "purchased_at",
        "created_at",
        "paid_at",
        "下单时间",
        "创建时间",
        "付款时间",
      ]),
    ),
    quantity: parseNumber(
      pickUnknown(value, ["quantity", "count", "数量", "件数"]),
    ),
    recipient_name: pickString(value, [
      "recipient_name",
      "recipient",
      "receiver_name",
      "receiver",
      "payee_name",
      "payee",
      "customer_name",
      "customerName",
      "收款人",
      "收款人名字",
      "收件人",
      "收件人名字",
      "客户名",
      "客户名称",
    ]),
    raw_payload: value,
    seller_name: pickString(value, [
      "seller_name",
      "seller",
      "shop_name",
      "供应商",
      "卖家",
      "店铺",
    ]),
    wholesale_order_id: pickString(value, [
      "wholesale_order_id",
      "wholesaleOrderId",
      "批发订单id",
    ]),
  };
}

export function parseWholesale1688Csv(text: string): Wholesale1688IngestRow[] {
  const rows = parseCsvRows(text);
  const [headerRow, ...bodyRows] = rows;

  if (!headerRow || bodyRows.length === 0) {
    return [];
  }

  const headers = headerRow.map(normalizeHeader);

  const parsedRows: Wholesale1688IngestRow[] = [];

  for (const row of bodyRows) {
    const rawPayload: Record<string, unknown> = Object.fromEntries(
      headers.map((header, index) => [
        header || `字段${index + 1}`,
        row[index] ?? "",
      ]),
    );

    const normalized = normalizeWholesale1688Row(rawPayload);

    if (normalized) {
      parsedRows.push({
        ...normalized,
        customer_id: null,
        wholesale_order_id: null,
      });
    }
  }

  return parsedRows;
}

function pickString(value: Record<string, unknown>, aliases: string[]) {
  const picked = pickUnknown(value, aliases);

  if (typeof picked !== "string" && typeof picked !== "number") {
    return null;
  }

  const text = String(picked).trim();
  return text || null;
}

function pickUnknown(value: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeKey);

  for (const [key, entry] of Object.entries(value)) {
    if (normalizedAliases.includes(normalizeKey(key))) {
      return entry;
    }
  }

  return null;
}

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function stringOrNull(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text || null;
}

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function normalizeHeader(value: string) {
  return normalizeKey(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}
