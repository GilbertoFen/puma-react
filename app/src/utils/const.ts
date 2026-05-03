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