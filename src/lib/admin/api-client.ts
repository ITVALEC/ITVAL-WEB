/**
 * Lectura segura de respuestas JSON del panel admin.
 * Evita que HTML/500 sin JSON tumben el flujo de guardado.
 */

export async function readAdminJson<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response,
): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function adminErrorMessage(
  res: Response,
  fallback = "No se pudo completar la operaci\u00f3n.",
): Promise<string> {
  const data = await readAdminJson<{ error?: string }>(res);
  if (data?.error?.trim()) return data.error.trim();
  if (!res.ok) return `${fallback} (c\u00f3digo ${res.status}).`;
  return fallback;
}
