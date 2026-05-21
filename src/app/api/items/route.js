import { authorizeRequest } from "@/lib/auth";
import { errorResponse, jsonResponse, mapItem } from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeItemPayload(body) {
  const name =
    typeof body?.name === "string"
      ? body.name.trim()
      : typeof body?.nama === "string"
        ? body.nama.trim()
        : "";
  const stockValue = body?.stock ?? body?.stok ?? 0;
  const stock = Number(stockValue);

  return { name, stock };
}

export async function GET(request) {
  const { response } = authorizeRequest(request, ["admin", "staff"]);

  if (response) {
    return response;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id,name,stock,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(
        "Failed to fetch inventory items.",
        500,
        error.message,
      );
    }

    return jsonResponse({ data: data.map(mapItem) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  const { user, response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { name, stock } = normalizeItemPayload(body);

    if (!name) {
      return errorResponse("Item name is required.", 422);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return errorResponse("Item stock must be a non-negative integer.", 422);
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({ name, stock, created_by: user.sub, updated_by: user.sub })
      .select("id,name,stock,created_at,updated_at")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return errorResponse(
        "Failed to create inventory item.",
        status,
        error.message,
      );
    }

    return jsonResponse({ data: mapItem(data) }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse(error.message, 500);
  }
}
