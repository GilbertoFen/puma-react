// ─────────────────────────────────────────────────────
// Tipos de la sección de Intercambios
// Cuando conectes el backend, reemplaza mockExchangeData
// con llamadas a tu API y estos types reflejarán el shape
// que debe devolver el servidor.
// ─────────────────────────────────────────────────────

export type Language = 'Español' | 'Inglés (B2)' | 'Francés' | 'Neerlandés' | 'Alemán';

export type Country = {
  code: string;       // ISO 3166-1 alpha-2 p.ej. "ES"
  name: string;       // "España"
  flag: string;       // emoji de bandera "🇪🇸"
};

export type Scholarship = {
  name: string;
  description: string;
};

export type Subject = {
  id: string;
  name: string;       // materia en la UNAM
  equivalent?: string; // materia equivalente en la universidad destino
  hasMatch: boolean;
};

export type University = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  languages: Language[];
  imageUrl: string;   // URL Cloudinary — deja '' para mostrar placeholder
  description: string;
  requirements: string[];
  scholarships: Scholarship[];
  officialUrl: string;
  matchPercent: number;   // % compatibilidad con el perfil del usuario
  subjects: Subject[];    // materias para el validador
  requiredDocs: string[]; // documentos requeridos para el trámite
};

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ES', name: 'España',         flag: '🇪🇸' },
  { code: 'BE', name: 'Bélgica',        flag: '🇧🇪' },
  { code: 'FR', name: 'Francia',        flag: '🇫🇷' },
  { code: 'MX', name: 'Tlaxcala',       flag: '🇲🇽' },  // intercambio nacional
];

export const REQUIRED_DOCS = [
  'Historial académico oficial',
  'Carta de exposición de motivos',
  'Certificados de idiomas',
  'Pasaporte Mexicano',
  'Visa de Estudios',
  'Seguro de Gastos Médicos',
];
