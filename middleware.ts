import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/';
  const isPublicRoute = isLoginRoute || pathname === '/faqs' || pathname === '/about-page';
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (isLoginRoute && token) {
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