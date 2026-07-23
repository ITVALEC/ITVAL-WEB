import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "itval_admin_session";

const DEV_PASSWORD = "itval2026";
const DEV_SECRET = "itval-dev-secret";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getAdminSecret(): string {
  const secret =
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "";

  if (secret) return secret;

  if (isProduction()) {
    console.error(
      "[admin] ADMIN_SECRET / ADMIN_PASSWORD no están configurados en producción.",
    );
    return "";
  }

  return DEV_SECRET;
}

/** Contraseña del panel. En producción debe venir de ADMIN_PASSWORD. */
export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim() || "";

  if (password) return password;

  if (isProduction()) {
    console.error(
      "[admin] ADMIN_PASSWORD no está configurada. Define la variable en el hosting antes del deploy.",
    );
    return "";
  }

  return DEV_PASSWORD;
}

export function createAdminToken(): string {
  const secret = getAdminSecret();
  if (!secret) {
    // Token imposible de validar si faltan secretos en producción.
    return "";
  }

  return createHmac("sha256", secret)
    .update("itval-admin-session-v1")
    .digest("hex");
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = createAdminToken();
  if (!expected) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
