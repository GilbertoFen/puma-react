import { Country } from '../types/exchange.types';
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


export function getSafeInitial(userData: any): string {
  if (!userData) return 'U'; // 'U' de Usuario como fallback global
  
  // 1. Si el backend ya calculó una propiedad "initial" o "initials"
  if (userData.initial) return userData.initial.toUpperCase();
  if (userData.initials) return userData.initials.toUpperCase();
  
  // 2. Si no existe, la calculamos al vuelo usando el nombre o el correo
  const nameToParse = userData.nombre || userData.name || userData.email;
  
  if (nameToParse && typeof nameToParse === 'string') {
    return nameToParse.trim().charAt(0).toUpperCase();
  }
  
  return 'U';
}