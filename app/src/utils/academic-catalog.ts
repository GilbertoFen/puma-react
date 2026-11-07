// Catálogo académico oficial del Plan 1644 (Licenciatura en Matemáticas Aplicadas y Computación - FES Acatlán)
// y funciones de correspondencia académica por clave y nombre normalizado.

export interface AcademicSubjectDef {
  code: string;
  name: string;
  credits: number;
  semester?: number | string;
  type: 'OBL' | 'OPT';
}

export const MAC_PLAN_1644_CATALOG: Record<string, AcademicSubjectDef> = {
  // Primer Semestre (54 créditos)
  '1106': { code: '1106', name: 'ÁLGEBRA SUPERIOR', credits: 12, semester: 1, type: 'OBL' },
  '1107': { code: '1107', name: 'CÁLCULO I', credits: 12, semester: 1, type: 'OBL' },
  '1111': { code: '1111', name: 'ORGANIZACIÓN DE COMPUTADORAS', credits: 6, semester: 1, type: 'OBL' },
  '1112': { code: '1112', name: 'PROGRAMACIÓN I', credits: 10, semester: 1, type: 'OBL' },
  '1113': { code: '1113', name: 'SOLUCIÓN ALGORÍTMICA DE PROBLEMAS', credits: 6, semester: 1, type: 'OBL' },
  '1208': { code: '1208', name: 'LÓGICA MATEMÁTICA', credits: 8, semester: 1, type: 'OBL' },

  // Segundo Semestre (56 créditos)
  '1206': { code: '1206', name: 'ÁLGEBRA LINEAL', credits: 12, semester: 2, type: 'OBL' },
  '1207': { code: '1207', name: 'CÁLCULO II', credits: 12, semester: 2, type: 'OBL' },
  '1211': { code: '1211', name: 'GEOMETRÍA DEL ESPACIO', credits: 8, semester: 2, type: 'OBL' },
  '1212': { code: '1212', name: 'INGLÉS INTERMEDIO I', credits: 8, semester: 2, type: 'OBL' },
  '1213': { code: '1213', name: 'PROGRAMACIÓN II', credits: 10, semester: 2, type: 'OBL' },
  '1214': { code: '1214', name: 'REDES DE CÓMPUTO', credits: 6, semester: 2, type: 'OBL' },

  // Tercer Semestre (54 créditos)
  '1306': { code: '1306', name: 'CÁLCULO III', credits: 12, semester: 3, type: 'OBL' },
  '1309': { code: '1309', name: 'PROGRAMACIÓN ORIENTADA A OBJETOS', credits: 10, semester: 3, type: 'OBL' },
  '1311': { code: '1311', name: 'ESTRUCTURAS DE DATOS', credits: 10, semester: 3, type: 'OBL' },
  '1312': { code: '1312', name: 'INGLÉS INTERMEDIO II', credits: 8, semester: 3, type: 'OBL' },
  '1313': { code: '1313', name: 'MÉTODOS NUMÉRICOS I', credits: 6, semester: 3, type: 'OBL' },
  '1408': { code: '1408', name: 'MATEMÁTICAS DISCRETAS', credits: 8, semester: 3, type: 'OBL' },

  // Cuarto Semestre (56 créditos)
  '1308': { code: '1308', name: 'MÉTODOS NUMÉRICOS II', credits: 6, semester: 4, type: 'OBL' },
  '1310': { code: '1310', name: 'TEORÍA DE GRÁFICAS', credits: 8, semester: 4, type: 'OBL' },
  '1406': { code: '1406', name: 'BASES DE DATOS', credits: 10, semester: 4, type: 'OBL' },
  '1410': { code: '1410', name: 'PROBABILIDAD', credits: 12, semester: 4, type: 'OBL' },
  '1411': { code: '1411', name: 'CÁLCULO IV', credits: 12, semester: 4, type: 'OBL' },
  '1412': { code: '1412', name: 'INGLÉS AVANZADO I', credits: 8, semester: 4, type: 'OBL' },

  // Quinto Semestre (52 créditos)
  '1506': { code: '1506', name: 'ECUACIONES DIFERENCIALES I', credits: 8, semester: 5, type: 'OBL' },
  '1511': { code: '1511', name: 'ESTADÍSTICA I', credits: 12, semester: 5, type: 'OBL' },
  '1512': { code: '1512', name: 'INGENIERÍA DE SOFTWARE', credits: 6, semester: 5, type: 'OBL' },
  '1513': { code: '1513', name: 'INGLÉS AVANZADO II', credits: 8, semester: 5, type: 'OBL' },
  '1514': { code: '1514', name: 'OPTIMIZACIÓN I', credits: 12, semester: 5, type: 'OBL' },
  '1515': { code: '1515', name: 'SEMINARIO SOBRE MÉXICO ACTUAL', credits: 6, semester: 5, type: 'OBL' },

  // Sexto Semestre (56 créditos)
  '1606': { code: '1606', name: 'ESTADÍSTICA II', credits: 12, semester: 6, type: 'OBL' },
  '1607': { code: '1607', name: 'PROCESOS ESTOCÁSTICOS', credits: 12, semester: 6, type: 'OBL' },
  '1608': { code: '1608', name: 'OPTIMIZACIÓN II', credits: 12, semester: 6, type: 'OBL' },
  '1609': { code: '1609', name: 'ECUACIONES DIFERENCIALES II', credits: 8, semester: 6, type: 'OBL' },
  '1610': { code: '1610', name: 'DESARROLLO WEB', credits: 6, semester: 6, type: 'OBL' },
  '1611': { code: '1611', name: 'SEMINARIO SOBRE ÉTICA Y RESPONSABILIDAD SOCIAL', credits: 6, semester: 6, type: 'OBL' },

  // Séptimo y Octavo Semestre - Obligatoria y Optativas
  '1716': { code: '1716', name: 'INVESTIGACIÓN EN MATEMÁTICAS APLICADAS Y COMPUTACIÓN', credits: 6, semester: 7, type: 'OBL' },

  // Asignaturas Optativas de Formación (8 créditos c/u)
  '1036': { code: '1036', name: 'ANÁLISIS DE ALGORITMOS', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1045': { code: '1045', name: 'SISTEMAS OPERATIVOS', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1049': { code: '1049', name: 'ADMINISTRACIÓN DE BASES DE DATOS', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1059': { code: '1059', name: 'SISTEMAS INTELIGENTES', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1086': { code: '1086', name: 'ELEMENTOS DE FINANZAS E INVERSIÓN', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1060': { code: '1060', name: 'COMPILADORES', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1061': { code: '1061', name: 'COMPUTACIÓN GRÁFICA', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1062': { code: '1062', name: 'CRIPTOGRAFÍA', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1063': { code: '1063', name: 'MINERÍA DE DATOS', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1064': { code: '1064', name: 'SEGURIDAD INFORMÁTICA', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1065': { code: '1065', name: 'INTELIGENCIA ARTIFICIAL', credits: 8, semester: 'Optativa', type: 'OPT' },
  '1066': { code: '1066', name: 'APRENDIZAJE DE MÁQUINAS', credits: 8, semester: 'Optativa', type: 'OPT' },
};

export function normalizeSubjectName(text: string): string {
  if (!text) return '';
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca una materia por clave (4 dígitos) con prioridad absoluta.
 * Si no coincide la clave, intenta coincidencia por nombre normalizado contra el catálogo académico.
 */
export function lookupSubjectInCatalog(
  code?: string | number | null,
  name?: string | null
): AcademicSubjectDef | null {
  if (code) {
    const cleanCode = String(code).trim().padStart(4, '0');
    if (MAC_PLAN_1644_CATALOG[cleanCode]) {
      return MAC_PLAN_1644_CATALOG[cleanCode];
    }
  }

  if (name) {
    const norm = normalizeSubjectName(name);
    for (const def of Object.values(MAC_PLAN_1644_CATALOG)) {
      if (normalizeSubjectName(def.name) === norm) {
        return def;
      }
    }
  }

  return null;
}

