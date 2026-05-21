import { errorResponse, jsonResponse } from "@/lib/api-response";
import {
  getSupabaseAdminClient,
  hasSupabaseConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return errorResponse(
      "Supabase backend is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      503,
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true });

    if (error) {
      return errorResponse("Supabase connection failed.", 503, error.message);
    }

    return jsonResponse({ status: "ok", supabase: "connected" });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
