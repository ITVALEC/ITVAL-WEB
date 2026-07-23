import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/admin/auth";

export async function POST(request: Request) {
  let body: { password?: string };

  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida. Intenta de nuevo." },
      { status: 400 },
    );
  }

  if (!body.password?.trim()) {
    return NextResponse.json(
      { error: "Ingresa la contraseña." },
      { status: 400 },
    );
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta. Verifica e intenta nuevamente." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
