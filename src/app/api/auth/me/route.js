import { authenticateRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(request) {
  const { user, response } = authenticateRequest(request);

  if (response) {
    return response;
  }

  return jsonResponse({ data: { user } });
}
