import { authorizeRequest } from "@/lib/auth";
import { errorResponse, jsonResponse, mapItem } from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getId(context) {
  const params = await context.params;
  return params.id;
}

function normalizePatchPayload(body) {
  const payload = {};

  if (typeof body?.name === "string" || typeof body?.nama === "string") {
    payload.name = (body.name ?? body.nama).trim();
  }

  if (body?.stock !== undefined || body?.stok !== undefined) {
    payload.stock = Number(body.stock ?? body.stok);
  }

  return payload;
}

export async function GET(request, context) {
  const { response } = authorizeRequest(request, ["admin", "staff"]);

  if (response) {
    return response;
  }

  try {
    const id = await getId(context);
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id,name,stock,created_at,updated_at")
      .eq("id", id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return errorResponse("Inventory item not found.", status, error.message);
    }

    return jsonResponse({ data: mapItem(data) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request, context) {
  const { user, response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const id = await getId(context);
    const body = await request.json();
    const itemPayload = normalizePatchPayload(body);

    if (Object.keys(itemPayload).length === 0) {
      return errorResponse(
        "At least one field is required: name/nama or stock/stok.",
        422,
      );
    }

    const payload = { ...itemPayload, updated_by: user.sub };

    if (payload.name !== undefined && !payload.name) {
      return errorResponse("Item name cannot be empty.", 422);
    }

    if (
      payload.stock !== undefined &&
      (!Number.isInteger(payload.stock) || payload.stock < 0)
    ) {
      return errorResponse("Item stock must be a non-negative integer.", 422);
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .update(payload)
      .eq("id", id)
      .select("id,name,stock,created_at,updated_at")
      .single();

    if (error) {
      const status =
        error.code === "PGRST116" ? 404 : error.code === "23505" ? 409 : 500;
      return errorResponse(
        "Failed to update inventory item.",
        status,
        error.message,
      );
    }

    return jsonResponse({ data: mapItem(data) });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, context) {
  const { response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const id = await getId(context);
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse(
        "Failed to delete inventory item.",
        500,
        error.message,
      );
    }

    return jsonResponse({ data: { id, deleted: true } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
