import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const [command = "summary", ...args] = process.argv.slice(2);

const handlers = {
  async summary() {
    const tables = [
      "order_overview",
      "purchase_order",
      "service_order",
      "purchase_order_type",
      "service_fee_type",
      "service_order_type",
      "order_discount_type",
      "exchange_rate",
    ];

    const counts = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        if (error) {
          throw new Error(`${table}: ${error.message}`);
        }

        return { table, count: count ?? 0 };
      }),
    );

    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from("order_overview")
      .select(
        "order_number,order_status,order_entry_user,ordering_user,amount,original_currency,created_at,deleted_at",
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentOrdersError) {
      throw new Error(`order_overview preview: ${recentOrdersError.message}`);
    }

    console.log(JSON.stringify({ counts, recentOrders: recentOrders ?? [] }, null, 2));
  },

  async table() {
    const [tableName, limitArg = "20"] = args;

    if (!tableName) {
      printUsage();
      process.exit(1);
    }

    const limit = Number.parseInt(limitArg, 10);

    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error("Limit must be a positive integer.");
    }

    const { data, error } = await supabase.from(tableName).select("*").limit(limit);

    if (error) {
      throw new Error(`${tableName}: ${error.message}`);
    }

    console.log(JSON.stringify(data ?? [], null, 2));
  },

  async order() {
    const [orderNumber] = args;

    if (!orderNumber) {
      printUsage();
      process.exit(1);
    }

    const { data: overview, error: overviewError } = await supabase
      .from("order_overview")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (overviewError) {
      throw new Error(`order_overview: ${overviewError.message}`);
    }

    let purchaseOrder = null;
    let serviceOrder = null;

    if (overview?.id) {
      const [purchaseResult, serviceResult] = await Promise.all([
        supabase
          .from("purchase_order")
          .select("*")
          .eq("order_overview_id", overview.id)
          .maybeSingle(),
        supabase
          .from("service_order")
          .select("*")
          .eq("order_overview_id", overview.id)
          .maybeSingle(),
      ]);

      if (purchaseResult.error) {
        throw new Error(`purchase_order: ${purchaseResult.error.message}`);
      }

      if (serviceResult.error) {
        throw new Error(`service_order: ${serviceResult.error.message}`);
      }

      purchaseOrder = purchaseResult.data;
      serviceOrder = serviceResult.data;
    }

    console.log(
      JSON.stringify(
        {
          overview,
          purchaseOrder,
          serviceOrder,
        },
        null,
        2,
      ),
    );
  },

  async updateStatus() {
    const [orderNumber, nextStatus] = args;
    const allowedStatuses = [
      "pending",
      "in_progress",
      "settled",
      "completed",
      "cancelled",
      "refunding",
    ];

    if (!orderNumber || !nextStatus || !allowedStatuses.includes(nextStatus)) {
      printUsage();
      process.exit(1);
    }

    const { data, error } = await supabase
      .from("order_overview")
      .update({ order_status: nextStatus })
      .eq("order_number", orderNumber)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`order_overview update: ${error.message}`);
    }

    console.log(JSON.stringify(data, null, 2));
  },
};

const handler = handlers[command];

if (!handler) {
  printUsage();
  process.exit(1);
}

handler().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function printUsage() {
  console.log(`Usage:
  npm run supabase:admin -- summary
  npm run supabase:admin -- table <table_name> [limit]
  npm run supabase:admin -- order <order_number>
  npm run supabase:admin -- updateStatus <order_number> <pending|in_progress|settled|completed|cancelled|refunding>`);
}
