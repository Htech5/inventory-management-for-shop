import { authorizeRequest } from "@/lib/auth";
import { errorResponse, jsonResponse, mapUser } from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeCreateUserPayload(body) {
  return {
    username: typeof body?.username === "string" ? body.username.trim() : "",
    password: typeof body?.password === "string" ? body.password : "",
    name: typeof body?.name === "string" ? body.name.trim() : "",
    role: body?.role === "admin" ? "admin" : "staff",
  };
}

export async function GET(request) {
  const { response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,username,name,role,is_active,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse("Failed to fetch users.", 500, error.message);
    }

    return jsonResponse({ data: data.map(mapUser) });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  const { response } = authorizeRequest(request, ["admin"]);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { username, password, name, role } = normalizeCreateUserPayload(body);

    if (!username || !password || !name) {
      return errorResponse("Username, password, and name are required.", 422);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters.", 422);
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_app_user", {
      p_username: username,
      p_password: password,
      p_name: name,
      p_role: role,
    });

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return errorResponse("Failed to create user.", status, error.message);
    }

    return jsonResponse({ data: mapUser(data) }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse(error.message, 500);
  }
}
