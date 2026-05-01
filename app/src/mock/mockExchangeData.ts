import type { University } from '../types/exchange.types';

// ─────────────────────────────────────────────────────
// Datos simulados — reemplaza con fetch a tu API
// Para agregar una universidad: añade un objeto a este array
// ─────────────────────────────────────────────────────
export const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'upm-madrid',
    name: 'Universidad Politécnica de Madrid',
    city: 'Madrid, España',
    countryCode: 'ES',
    languages: ['Inglés (B2)', 'Español'],
    imageUrl: '',   // TODO: reemplaza con URL de Cloudinary
    description:
      'La Universidad Politécnica de Madrid (UPM) es una prestigiosa institución pública española. Es reconocida internacionalmente como una de las mejores politécnicas de España, destacando en rankings mundiales por su oferta académica en tecnología.',
    requirements: [
      'Tener cubierto entre el 44% y el 80% de los créditos de la carrera',
      'Promedio Mínimo 8.5 (promedios de 9.0+ tienen prioridad)',
      'Certificado de idioma B2 en inglés',
    ],
    scholarships: [
      {
        name: 'Beca de Movilidad Internacional UNAM (DGECI)',
        description: 'Pago único de aprox. $95,000–$110,000 MXN para cubrir boleto de avión y los primeros meses de estancia.',
      },
      {
        name: 'Beca Santander Estudios',
        description: 'Convocatoria de $50,000 MXN adicionales (sujeta a disponibilidad anual).',
      },
    ],
    officialUrl: 'https://www.upm.es',
    matchPercent: 95,
    requiredDocs: [
      'Historial académico oficial',
      'Carta de exposición de motivos',
      'Certificados de idiomas',
      'Pasaporte Mexicano',
      'Visa de Estudios',
      'Seguro de Gastos Médicos',
    ],
    subjects: [
      { id: 's1', name: 'Análisis de plugs',           equivalent: 'Análisis de plugs Español',     hasMatch: true  },
      { id: 's2', name: 'Análisis de plugs 2',         equivalent: undefined,                        hasMatch: false },
      { id: 's3', name: 'Análisis de plugs y Fourier', equivalent: 'Análisis de plugs y Fourier',    hasMatch: true  },
      { id: 's4', name: 'Análisis de plugs avanzado',  equivalent: 'Análisis de plugs avanzado',     hasMatch: true  },
    ],
  },
  {
    id: 'ghent-belgica',
    name: 'Ghent University',
    city: 'Gante, Bélgica',
    countryCode: 'BE',
    languages: ['Inglés (B2)', 'Neerlandés'],
    imageUrl: '',
    description:
      'La Universidad de Gante es una de las mejores universidades públicas de Bélgica. Es reconocida internacionalmente como una de las mejores politécnicas de España, destacando en rankings mundiales por su oferta académica en tecnología.',
    requirements: [
      'Tener cubierto entre el 44% y el 80% de los créditos de la carrera',
      'Promedio Mínimo 8.5 (promedios de 9.0+ tienen prioridad)',
    ],
    scholarships: [
      {
        name: 'Beca de Movilidad Internacional UNAM (DGECI)',
        description: 'Pago único de aprox. $95,000–$110,000 MXN para cubrir boleto de avión y los primeros meses de estancia.',
      },
      {
        name: 'Beca Santander Estudios',
        description: 'Convocatoria de $50,000 MXN adicionales (sujeta a disponibilidad anual).',
      },
    ],
    officialUrl: 'https://www.ugent.be',
    matchPercent: 80,
    requiredDocs: [
      'Historial académico oficial',
      'Carta de exposición de motivos',
      'Certificados de idiomas',
      'Pasaporte Mexicano',
      'Visa de Estudios',
      'Seguro de Gastos Médicos',
    ],
    subjects: [
      { id: 's1', name: 'Análisis de plugs',           equivalent: 'Análisis de plugs Español',  hasMatch: true  },
      { id: 's2', name: 'Análisis de plugs 2',         equivalent: undefined,                     hasMatch: false },
      { id: 's3', name: 'Análisis de plugs y Fourier', equivalent: 'Análisis de plugs y Fourier', hasMatch: true  },
      { id: 's4', name: 'Análisis de plugs avanzado',  equivalent: 'Análisis de plugs avanzado',  hasMatch: true  },
    ],
  },
  {
    id: 'paris-saclay',
    name: 'Université Paris-Saclay',
    city: 'París, Francia',
    countryCode: 'FR',
    languages: ['Francés', 'Inglés (B2)'],
    imageUrl: '',
    description:
      'Una de las universidades más importantes de Europa en ciencias e ingeniería, reconocida en los principales rankings mundiales por su investigación y calidad académica.',
    requirements: [
      'Tener cubierto entre el 50% y el 80% de los créditos de la carrera',
      'Promedio Mínimo 8.8',
      'Certificado de idioma B2 en francés o inglés',
    ],
    scholarships: [
      {
        name: 'Beca de Movilidad Internacional UNAM (DGECI)',
        description: 'Pago único de aprox. $95,000–$110,000 MXN.',
      },
    ],
    officialUrl: 'https://www.universite-paris-saclay.fr',
    matchPercent: 72,
    requiredDocs: [
      'Historial académico oficial',
      'Carta de exposición de motivos',
      'Certificados de idiomas',
      'Pasaporte Mexicano',
      'Visa de Estudios',
      'Seguro de Gastos Médicos',
    ],
    subjects: [
      { id: 's1', name: 'Análisis de plugs',           equivalent: 'Analyse Numérique',  hasMatch: true  },
      { id: 's2', name: 'Análisis de plugs 2',         equivalent: undefined,             hasMatch: false },
      { id: 's3', name: 'Análisis de plugs y Fourier', equivalent: 'Analyse de Fourier',  hasMatch: true  },
      { id: 's4', name: 'Análisis de plugs avanzado',  equivalent: undefined,             hasMatch: false },
    ],
  },
];
