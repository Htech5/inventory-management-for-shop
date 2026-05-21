import { createSessionToken } from "@/lib/auth";
import { errorResponse, jsonResponse, mapUser } from "@/lib/api-response";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const username =
      typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return errorResponse("Username and password are required.", 422);
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("authenticate_app_user", {
      p_username: username,
      p_password: password,
    });

    if (error) {
      return errorResponse("Login failed.", 500, error.message);
    }

    const user = data?.[0];

    if (!user) {
      return errorResponse("Invalid username or password.", 401);
    }

    const token = createSessionToken(user);

    return jsonResponse({
      data: {
        user: mapUser(user),
        token,
        token_type: "Bearer",
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse(error.message, 500);
  }
}
