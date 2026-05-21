import { createHmac, timingSafeEqual } from "node:crypto";
import { errorResponse } from "@/lib/api-response";

const TOKEN_TTL_SECONDS = Number(
  process.env.SESSION_TTL_SECONDS || 60 * 60 * 8,
);

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET. Set it in your environment to sign backend session tokens.",
    );
  }

  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signTokenPayload(encodedHeader, encodedPayload) {
  return createHmac("sha256", getSessionSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
}

function safeCompare(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = signTokenPayload(encodedHeader, encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signTokenPayload(encodedHeader, encodedPayload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}

export function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer") {
    return null;
  }

  return token || null;
}

export function authenticateRequest(request) {
  const token = getBearerToken(request);
  const user = verifySessionToken(token);

  if (!user) {
    return {
      user: null,
      response: errorResponse("Unauthorized. Send a valid Bearer token.", 401),
    };
  }

  return { user, response: null };
}

export function authorizeRequest(request, allowedRoles = []) {
  const auth = authenticateRequest(request);

  if (auth.response) {
    return auth;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.user.role)) {
    return {
      user: auth.user,
      response: errorResponse(
        "Forbidden. Your role is not allowed to access this resource.",
        403,
      ),
    };
  }

  return auth;
}
