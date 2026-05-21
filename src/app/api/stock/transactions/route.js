import { authorizeRequest } from "@/lib/auth";
import {
  errorResponse,
  jsonResponse,
  mapTransaction,
} from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeTransactionPayload(body) {
  const itemId = body?.item_id ?? body?.itemId ?? null;
  const itemName =
    typeof body?.item_name === "string"
      ? body.item_name.trim()
      : typeof body?.name === "string"
        ? body.name.trim()
        : typeof body?.nama === "string"
          ? body.nama.trim()
          : "";
  const type =
    body?.type === "masuk"
      ? "in"
      : body?.type === "keluar"
        ? "out"
        : body?.type;
  const quantity = Number(body?.quantity ?? body?.jumlah);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

  return { itemId, itemName, type, quantity, notes };
}

async function resolveItemId(supabase, itemId, itemName) {
  if (itemId) {
    return itemId;
  }

  if (!itemName) {
    return null;
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .select("id")
    .eq("name", itemName)
    .single();

  if (error) {
    return null;
  }

  return data.id;
}

export async function GET(request) {
  const { response } = authorizeRequest(request, ["admin", "staff"]);

  if (response) {
    return response;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("item_id") ?? searchParams.get("itemId");

    let query = supabase
      .from("stock_transactions")
      .select(
        "id,item_id,item_name,type,quantity,stock_before,stock_after,notes,created_at",
      )
      .order("created_at", { ascending: false });

    if (type === "in" || type === "out") {
      query = query.eq("type", type);
    }

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(
        "Failed to fetch stock transactions.",
        500,
        error.message,
      );
    }

    return jsonResponse({ data: data.map(mapTransaction) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  const { user, response } = authorizeRequest(request, ["admin", "staff"]);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { itemId, itemName, type, quantity, notes } =
      normalizeTransactionPayload(body);

    if (type !== "in" && type !== "out") {
      return errorResponse(
        "Transaction type must be 'in'/'masuk' or 'out'/'keluar'.",
        422,
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return errorResponse(
        "Transaction quantity must be a positive integer.",
        422,
      );
    }

    const supabase = getSupabaseAdminClient();
    const resolvedItemId = await resolveItemId(supabase, itemId, itemName);

    if (!resolvedItemId) {
      return errorResponse(
        "Inventory item was not found. Send item_id/itemId or an existing item name/nama.",
        404,
      );
    }

    const { data, error } = await supabase.rpc("record_stock_transaction", {
      p_item_id: resolvedItemId,
      p_type: type,
      p_quantity: quantity,
      p_notes: notes,
      p_user_id: user.sub,
    });

    if (error) {
      const status = error.message?.toLowerCase().includes("insufficient stock")
        ? 409
        : 500;
      return errorResponse(
        "Failed to record stock transaction.",
        status,
        error.message,
      );
    }

    return jsonResponse({ data: mapTransaction(data) }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse(error.message, 500);
  }
}
