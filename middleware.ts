import { NextResponse, NextRequest } from 'next/server';

function getSafeReturnUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const decoded = decodeURIComponent(rawUrl.trim());
    if (
      decoded.startsWith('/') &&
      !decoded.startsWith('//') &&
      !decoded.startsWith('/\\') &&
      !decoded.includes('://') &&
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(decoded)
    ) {
      return decoded;
    }
  } catch {}
  return null;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isStudentLoginRoute = pathname === '/';
  const isTeacherLoginRoute = pathname === '/profesor' || pathname === '/profesores';
  const isAdminLoginRoute = pathname === '/admin';
  const isInfoRoute = pathname === '/faqs' || pathname === '/about-page';

  const isPublicRoute =
    isStudentLoginRoute ||
    isTeacherLoginRoute ||
    isAdminLoginRoute ||
    isInfoRoute;

  // Si no está en ruta pública y no tiene sesión, redirigir al login conservando la URL original
  if (!isPublicRoute && !token) {
    const fullPath = pathname + request.nextUrl.search;
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('returnUrl', fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Si accede a la raíz '/' con sesión previa y existe returnUrl, dirigir al returnUrl
  if (isStudentLoginRoute && token) {
    const queryReturnUrl = request.nextUrl.searchParams.get('returnUrl');
    const safeReturn = getSafeReturnUrl(queryReturnUrl);
    if (safeReturn) {
      return NextResponse.redirect(new URL(safeReturn, request.url));
    }
    return NextResponse.redirect(new URL('/home', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas de solicitud excepto las que empiezan por:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (archivo de icono de la pestaña)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};