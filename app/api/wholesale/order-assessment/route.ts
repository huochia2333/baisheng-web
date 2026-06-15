import { NextResponse } from "next/server";

import {
  AiAssistantServiceError,
  createDeepSeekAssistantTextStream,
} from "@/lib/ai-assistant/deepseek-client";
import { getServerAuthContext } from "@/lib/server-auth";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildWholesaleOrderAssessmentMessages,
  filterWholesaleOrdersForAssessment,
  normalizeWholesaleOrderAssessmentPayload,
} from "@/lib/wholesale-order-assessment";
import { getWholesalePageData } from "@/lib/wholesale";
import { getCurrentWorkspaceBusinessAccess } from "@/lib/workspace-business-access";

export const runtime = "nodejs";

const ASSESSMENT_TIMEOUT_MS = 30_000;

export async function POST(request: Request) {
  const { userId } = await getServerAuthContext();

  if (!userId) {
    return createErrorResponse("请先登录后再生成评估。", 401);
  }

  let filters: ReturnType<typeof normalizeWholesaleOrderAssessmentPayload>;

  try {
    filters = normalizeWholesaleOrderAssessmentPayload(await request.json());
  } catch {
    return createErrorResponse("筛选条件暂时无法识别，请调整后重试。", 400);
  }

  const supabase = await getServerSupabaseClient();
  const businessAccess = await getCurrentWorkspaceBusinessAccess(supabase);

  if (!businessAccess.includes("wholesale")) {
    return createErrorResponse("当前账号不能查看批发业务订单。", 403);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSESSMENT_TIMEOUT_MS);

  try {
    const data = await getWholesalePageData(supabase, "orders");
    const orders = filterWholesaleOrdersForAssessment(data, filters);
    const messages = buildWholesaleOrderAssessmentMessages({
      data,
      filters,
      orders,
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
      return createErrorResponse("评估暂时没有生成成功，请稍后再试。", 503);
    }

    return createErrorResponse("评估暂时没有生成成功，请稍后再试。", 503);
  }
}

function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
