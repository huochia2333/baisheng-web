import { NextResponse } from "next/server";

import { getAppRoleFromMetadataContainer } from "@/lib/auth-metadata";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeWholesale1688ApiPayload } from "@/lib/wholesale-1688-ingest";
import { getCurrentWorkspaceBusinessAccess } from "@/lib/workspace-business-access";

const WHOLESALE_INGEST_ROLES = new Set(["administrator", "salesman", "promoter"]);

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "请先登录后再接收采购订单。" },
      { status: 401 },
    );
  }

  const role = getAppRoleFromMetadataContainer(user);
  const businessAccess = await getCurrentWorkspaceBusinessAccess(supabase);

  if (
    !role ||
    !WHOLESALE_INGEST_ROLES.has(role) ||
    !businessAccess.includes("wholesale")
  ) {
    return NextResponse.json(
      { error: "当前账号不能接收批发采购订单。" },
      { status: 403 },
    );
  }

  try {
    const payload = normalizeWholesale1688ApiPayload(await request.json());

    if (payload.rows.length === 0) {
      return NextResponse.json(
        { error: "没有可接收的采购订单。" },
        { status: 400 },
      );
    }

    const { data: batch, error: batchError } = await supabase
      .from("wholesale_1688_import_batches")
      .insert({
        file_name: payload.fileName,
        row_count: payload.rows.length,
        source: payload.source,
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "采购订单没有接收成功，请稍后再试。" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("wholesale_1688_orders").upsert(
      payload.rows.map((row) => ({
        ...row,
        batch_id: batch.id,
      })),
      { ignoreDuplicates: true, onConflict: "external_order_number" },
    );

    if (error) {
      return NextResponse.json(
        { error: "采购订单没有接收成功，请检查内容后再试。" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "采购订单已接收。",
      receivedCount: payload.rows.length,
    });
  } catch {
    return NextResponse.json(
      { error: "采购订单没有接收成功，请检查内容后再试。" },
      { status: 400 },
    );
  }
}
