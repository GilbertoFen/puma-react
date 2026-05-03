import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Definimos las rutas que son públicas (accesibles sin login)
  // Agregamos excepciones para archivos estáticos y el login
  const isPublicRoute = pathname === '/'; 

  // 2. Si el usuario intenta acceder a una ruta que NO es el login y NO tiene token
  if (!isPublicRoute && !token) {
    // Redirigir al login
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. (Opcional) Si ya está logueado e intenta ir al login, mandarlo al home
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
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