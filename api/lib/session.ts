import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "onou-meal-reservation-secret-key-2026";

interface TokenPayload {
  studentId: string;
  iat: number;
  exp: number;
}

export function signToken(studentId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    studentId,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as TokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload.studentId;
  } catch {
    return null;
  }
}
