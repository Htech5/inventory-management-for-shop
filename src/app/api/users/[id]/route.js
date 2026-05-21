import { authorizeRequest } from "@/lib/auth";
import { errorResponse, jsonResponse, mapUser } from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getId(context) {
  const params = await context.params;
  return params.id;
}

function normalizeUpdateUserPayload(body) {
  const payload = {};

  if (typeof body?.username === "string") {
    payload.username = body.username.trim().toLowerCase();
  }

  if (typeof body?.name === "string") {
    payload.name = body.name.trim();
  }

  if (body?.role === "admin" || body?.role === "staff") {
    payload.role = body.role;
  }

  if (typeof body?.is_active === "boolean") {
    payload.is_active = body.is_active;
  }

  const password = typeof body?.password === "string" ? body.password : null;

  return { payload, password };
}

export async function GET(request, context) {
  const { response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const id = await getId(context);
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,username,name,role,is_active,created_at,updated_at")
      .eq("id", id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return errorResponse("User not found.", status, error.message);
    }

    return jsonResponse({ data: mapUser(data) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request, context) {
  const { response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const id = await getId(context);
    const body = await request.json();
    const { payload, password } = normalizeUpdateUserPayload(body);

    if (payload.username !== undefined && !payload.username) {
      return errorResponse("Username cannot be empty.", 422);
    }

    if (payload.name !== undefined && !payload.name) {
      return errorResponse("Name cannot be empty.", 422);
    }

    if (password !== null && password.length < 6) {
      return errorResponse("Password must be at least 6 characters.", 422);
    }

    if (Object.keys(payload).length === 0 && password === null) {
      return errorResponse(
        "At least one user field or password is required.",
        422,
      );
    }

    const supabase = getSupabaseAdminClient();
    let updatedUser = null;

    if (Object.keys(payload).length > 0) {
      const { data, error } = await supabase
        .from("app_users")
        .update(payload)
        .eq("id", id)
        .select("id,username,name,role,is_active,created_at,updated_at")
        .single();

      if (error) {
        const status =
          error.code === "PGRST116" ? 404 : error.code === "23505" ? 409 : 500;
        return errorResponse("Failed to update user.", status, error.message);
      }

      updatedUser = data;
    }

    if (password !== null) {
      const { data, error } = await supabase.rpc("update_app_user_password", {
        p_user_id: id,
        p_password: password,
      });

      if (error) {
        const status = error.code === "P0002" ? 404 : 500;
        return errorResponse(
          "Failed to update user password.",
          status,
          error.message,
        );
      }

      updatedUser = data;
    }

    return jsonResponse({ data: mapUser(updatedUser) });
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
    const { data, error } = await supabase
      .from("app_users")
      .update({ is_active: false })
      .eq("id", id)
      .select("id,username,name,role,is_active,created_at,updated_at")
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return errorResponse("Failed to deactivate user.", status, error.message);
    }

    return jsonResponse({ data: mapUser(data) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
