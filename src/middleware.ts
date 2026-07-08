import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Redirige rutas legacy de servicios hacia el catálogo de productos. */
function legacyRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  const esMatch = pathname.match(/^\/es\/servicios(\/.*)?$/);
  if (esMatch) {
    const rest = esMatch[1] ?? "";
    return NextResponse.redirect(
      new URL(`/es/productos${rest}`, request.url),
      308,
    );
  }

  const enMatch = pathname.match(/^\/en\/services(\/.*)?$/);
  if (enMatch) {
    const rest = enMatch[1] ?? "";
    return NextResponse.redirect(
      new URL(`/en/products${rest}`, request.url),
      308,
    );
  }

  return null;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const legacy = legacyRedirect(request);
  if (legacy) return legacy;
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
