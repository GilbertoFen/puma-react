/**
 * A dónde entra cada rol. Es solo comodidad de navegación: la protección real son los
 * guards del backend en cada endpoint.
 */

export type AppRole = 'STUDENT' | 'PROFESSOR' | 'INSTITUTION_ADMIN' | 'ANALYST';

export const CHOOSER_PATH = '/elegir-acceso';

export interface Portal {
  path: '/admin' | '/profesores' | '/';
  label: string;
  description: string;
  roles: AppRole[];
}

/** En orden de prioridad para la pantalla de elección. */
export const PORTALS: Portal[] = [
  {
    path: '/admin',
    label: 'Panel de administración',
    description: 'Cifras agregadas, reportes y personal.',
    roles: ['INSTITUTION_ADMIN', 'ANALYST'],
  },
  {
    path: '/profesores',
    label: 'Portal docente',
    description: 'Tus grupos, horarios y asistencia.',
    roles: ['PROFESSOR'],
  },
  {
    path: '/',
    label: 'Portal del alumno',
    description: 'Orientación, chat y tu trayectoria.',
    roles: ['STUDENT'],
  },
];

/** /profesor es un alias antiguo de /profesores. */
export function normalizePortalPath(path: string): string {
  const clean = (path || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return clean === '/profesor' ? '/profesores' : clean;
}

export function portalsFor(roles: readonly string[]): Portal[] {
  return PORTALS.filter((p) => p.roles.some((r) => roles.includes(r)));
}

export function canAccess(path: string, roles: readonly string[]): boolean {
  const p = normalizePortalPath(path);
  return portalsFor(roles).some((portal) => portal.path === p);
}

/** Ruta natural de un usuario: su único portal, o la pantalla de elección si tiene varios. */
export function homeFor(roles: readonly string[]): string {
  const list = portalsFor(roles);
  if (list.length === 1) return list[0].path;
  if (list.length > 1) return CHOOSER_PATH;
  return '/';
}

/**
 * Después del login:
 * - si empezó en /admin o /profesores y tiene ese rol, regresa ahí;
 * - si no, a su único portal o a la pantalla para elegir.
 * La portada "/" es la entrada general: con varios roles siempre se elige.
 */
export function destinationAfterLogin(roles: readonly string[], origin?: string | null): string {
  if (origin) {
    const p = normalizePortalPath(origin);
    if (p !== '/' && canAccess(p, roles)) return p;
  }
  return homeFor(roles);
}
