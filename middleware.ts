import { NextResponse, NextRequest } from 'next/server';

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

  // Si no está en ruta pública y no tiene sesión, redirigir al inicio de sesión
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirigir a /home únicamente si el usuario accede a la raíz '/' con sesión previa de alumno
  if (isStudentLoginRoute && token) {
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