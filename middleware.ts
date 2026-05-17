import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Aislamos la ruta estricta de Login
  const isLoginRoute = pathname === '/';

  // 2. Definimos todas las rutas que son públicas e informativas
  const isPublicRoute = isLoginRoute || pathname === '/faqs' || pathname === '/about-page';

  // 3. Si el usuario intenta acceder a una ruta protegida y NO tiene token
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Si ya está logueado e intenta ir EXCLUSIVAMENTE a la pantalla de Login, lo mandamos al home
  // (Pero si decide visitar /faqs o /about-page, lo dejamos pasar libremente sin rebotarlo)
  if (isLoginRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
}

// 4. EL MATCHER ES LA CLAVE:
// Esta expresión regular protege TODO excepto archivos de sistema y el favicon
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