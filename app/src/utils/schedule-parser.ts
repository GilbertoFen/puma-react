/**
 * Lector y analizador del comprobante de inscripción / horario actual del alumno.
 * Extrae número de cuenta, periodo, plan y asignaturas inscritas (clave, nombre,
 * grupo, días, horario y profesor).
 *
 * Diseñado para soportar formatos variables de la UAE y DGAE (FES Acatlán / UNAM)
 * sin depender de posiciones fijas de texto ni cadenas exactas.
 */

export interface RawScheduleSubject {
  index: number;
  code: string;
  name: string;
  group: string;
  rawSchedule: string;
  days: string;
  time: string;
  classroom?: string;
  professor?: string;
}

export interface ParsedScheduleResult {
  accountNumber: string | null;
  studentName: string | null;
  period: string | null;
  plan: string | null;
  subjects: RawScheduleSubject[];
  rawText?: string;
}

export interface PdfTextItem {
  str: string;
  transform: number[];
}

/**
 * Normaliza nombres de profesores y textos con posibles caracteres dañados (ej.  -> Ñ).
 */
export function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\uFFFD/g, 'Ñ')
    .replace(/CASTA\s*EDA/gi, 'CASTAÑEDA')
    .replace(/_{2,}.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formatea los días de clase a partir de la cadena de horario del PDF.
 */
export function formatDays(rawSchedule: string): string {
  const daysFound: string[] = [];
  if (/\bLU\b/i.test(rawSchedule)) daysFound.push('Lunes');
  if (/\bMA\b/i.test(rawSchedule)) daysFound.push('Martes');
  if (/\bMI\b/i.test(rawSchedule)) daysFound.push('Miércoles');
  if (/\bJU\b/i.test(rawSchedule)) daysFound.push('Jueves');
  if (/\bVI\b/i.test(rawSchedule)) daysFound.push('Viernes');
  if (/\bSA\b/i.test(rawSchedule)) daysFound.push('Sábado');

  return daysFound.length > 0 ? daysFound.join(', ') : rawSchedule;
}

/**
 * Extrae el semestre más alto a partir de los prefijos de dos dígitos de los grupos (11 al 18).
 * 11.. -> 1°
 * 12.. -> 2°
 * 13.. -> 3°
 * 14.. -> 4°
 * 15.. -> 5°
 * 16.. -> 6°
 * 17.. -> 7°
 * 18.. -> 8°
 */
export function extractMaxSemesterFromGroups(groups: string[]): number | null {
  if (!groups || groups.length === 0) return null;

  const validPrefixes = groups
    .map((g) => (g || '').trim())
    .map((g) => parseInt(g.slice(0, 2), 10))
    .filter((p) => !isNaN(p) && p >= 11 && p <= 18);

  if (validPrefixes.length === 0) return null;

  const maxPrefix = Math.max(...validPrefixes);
  return maxPrefix - 10;
}

/**
 * Formatea el rango horario (inicio y fin) a partir de la cadena de horario.
 */
export function formatTime(rawSchedule: string): string {
  const hourMatches = Array.from(rawSchedule.matchAll(/(\d{1,2}:\d{2})/g)).map(m => m[1]);
  if (hourMatches.length >= 2) {
    return `${hourMatches[0]} - ${hourMatches[1]}`;
  }
  if (hourMatches.length === 1) {
    return hourMatches[0];
  }
  return rawSchedule;
}

/**
 * Analizador posicional y de columnas dinámicas a partir de los elementos del PDF.
 */
export function parseScheduleFromItems(items: PdfTextItem[]): ParsedScheduleResult {
  const fullRaw = items
    .map(i => i.str)
    .join(' ')
    .replace(/\s+/g, ' ');

  // 1. Número de cuenta
  const accMatch = fullRaw.match(/(?:N[UÚ]M\.?\s*CTA\.?|CUENTA:?)\s*(\d{8,10})/i);
  const accountNumber = accMatch ? accMatch[1] : null;

  // 2. Periodo escolar
  const periodMatch = fullRaw.match(/(?:Inscripci[oó]n\s+Aceptada[^\n\r\._]*|Verificaci[oó]n\s+de\s+la\s+inscripci[oó]n[^\n\r\._]*)/i);
  let period = periodMatch ? periodMatch[0].trim() : null;
  if (period) {
    period = period.split(/\b(?:Num|ASIGNATURA)\b/i)[0].trim();
  }

  // 3. Plan de estudios
  const planMatch = fullRaw.match(/(?:PLAN\s+ESTU\.?|PLAN:?)\s*(\d{4})/i);
  const plan = planMatch ? planMatch[1] : null;

  // 4. Nombre del alumno
  const nameMatch = fullRaw.match(/ALUMNO\s+([A-Z\sÑÁÉÍÓÚ]+?)(?=\s+N[UÚ]M|\s+GEN|\s+P[áa]gina|\s+FACULTAD|$)/i);
  const studentName = nameMatch ? cleanText(nameMatch[1]) : null;

  // 5. Localizar cabecera de la tabla
  let xClave = -1;
  let headerY = -1;
  for (const it of items) {
    const s = it.str.trim().toUpperCase();
    if (s === 'CLAVE') {
      xClave = it.transform[4];
      headerY = it.transform[5];
    }
  }

  const bodyItems = items.filter(it => it.transform && it.transform[5] < (headerY > 0 ? headerY - 5 : 99999));

  // Buscar códigos de 4 dígitos en la columna de clave
  const codeItems: PdfTextItem[] = [];
  for (const it of bodyItems) {
    const s = it.str.trim();
    if (/^[12]\d{3}$/.test(s)) {
      if (xClave > 0 && Math.abs(it.transform[4] - xClave) < 35) {
        codeItems.push(it);
      } else if (xClave < 0) {
        codeItems.push(it);
      }
    }
  }

  // Agrupar filas por coordenada Y
  const uniqueCodeRows: PdfTextItem[] = [];
  codeItems.sort((a, b) => b.transform[5] - a.transform[5]);
  for (const ci of codeItems) {
    if (!uniqueCodeRows.some(r => Math.abs(r.transform[5] - ci.transform[5]) <= 4)) {
      uniqueCodeRows.push(ci);
    }
  }

  const subjects: RawScheduleSubject[] = [];

  for (let i = 0; i < uniqueCodeRows.length; i++) {
    const codeItem = uniqueCodeRows[i];
    const code = codeItem.str.trim();
    const currY = codeItem.transform[5];
    const prevY = i > 0 ? uniqueCodeRows[i - 1].transform[5] : (currY + 25);
    const nextY = (i + 1 < uniqueCodeRows.length) ? uniqueCodeRows[i + 1].transform[5] : (currY - 25);

    const topY = currY + (prevY - currY) / 2;
    const botY = currY - (currY - nextY) / 2;

    const rowItems = bodyItems.filter(it => it.transform[5] <= topY && it.transform[5] > botY && it.str.trim());
    rowItems.sort((a, b) => a.transform[4] - b.transform[4]);

    // Grupo de 4 dígitos ubicado a la derecha de la clave
    const groupItem = rowItems.find(it => it.transform[4] > codeItem.transform[4] + 30 && /^[12]\d{3}$/.test(it.str.trim()));
    const group = groupItem ? groupItem.str.trim() : '';

    // Elementos entre clave y grupo corresponden al nombre de la asignatura
    const nameItems = rowItems.filter(it => it.transform[4] > codeItem.transform[4] && (!groupItem || it.transform[4] < groupItem.transform[4]));
    nameItems.sort((a, b) => Math.abs(a.transform[5] - b.transform[5]) > 2 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]);
    const name = cleanText(nameItems.map(it => it.str.trim()).filter(Boolean).join(' '));

    // Elementos posteriores al grupo: horario, salón y profesor
    const afterGroup = groupItem ? rowItems.filter(it => it.transform[4] > groupItem.transform[4]) : [];

    const schedItems: PdfTextItem[] = [];
    const profItems: PdfTextItem[] = [];
    let classroom = '';

    for (const it of afterGroup) {
      const s = it.str.trim();
      if (/INF\.EN\s+JEFA|[A-Z]-\d+|SALON\s+\w+/i.test(s)) {
        classroom = s;
      } else if (/(?:LU|MA|MI|JU|VI|SA|\d{1,2}:\d{2}|y|a|;|:)/i.test(s) && !/(?:DELGADILLO|ARMANDO|ESQUERRO|HERNANDEZ|MENDOZA|CAMPILLO|LANDA|ANTONIO|JAVIER|RICARDO|DANIEL|JOSUE|VALENZUELA|GARCIAMIGUEL)/i.test(s)) {
        schedItems.push(it);
      } else {
        profItems.push(it);
      }
    }

    schedItems.sort((a, b) => Math.abs(a.transform[5] - b.transform[5]) > 2 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]);
    profItems.sort((a, b) => Math.abs(a.transform[5] - b.transform[5]) > 2 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]);

    const rawSchedule = schedItems.map(it => it.str.trim()).join(' ');
    const professor = cleanText(profItems.map(it => it.str.trim()).join(' '));

    subjects.push({
      index: i + 1,
      code,
      name,
      group,
      rawSchedule,
      days: formatDays(rawSchedule),
      time: formatTime(rawSchedule),
      classroom,
      professor,
    });
  }

  // Si por alguna anomalía visual no se extrajeron filas por coordenadas, usar extractor textual de respaldo
  if (subjects.length === 0) {
    const textBased = parseScheduleFromText(fullRaw);
    return {
      accountNumber: accountNumber || textBased.accountNumber,
      studentName: studentName || textBased.studentName,
      period: period || textBased.period,
      plan: plan || textBased.plan,
      subjects: textBased.subjects,
      rawText: fullRaw,
    };
  }

  return {
    accountNumber,
    studentName,
    period,
    plan,
    subjects,
    rawText: fullRaw,
  };
}

/**
 * Extractor de respaldo por patrones de expresiones regulares sobre el texto plano.
 */
export function parseScheduleFromText(fullText: string): ParsedScheduleResult {
  const text = fullText.replace(/\s+/g, ' ');

  const accMatch = text.match(/(?:N[UÚ]M\.?\s*CTA\.?|CUENTA:?)\s*(\d{8,10})/i);
  const accountNumber = accMatch ? accMatch[1] : null;

  const periodMatch = text.match(/(?:Inscripci[oó]n\s+Aceptada[^\n\r\._]*|Verificaci[oó]n\s+de\s+la\s+inscripci[oó]n[^\n\r\._]*)/i);
  let period = periodMatch ? periodMatch[0].trim() : null;
  if (period) {
    period = period.split(/\b(?:Num|ASIGNATURA)\b/i)[0].trim();
  }

  const planMatch = text.match(/(?:PLAN\s+ESTU\.?|PLAN:?)\s*(\d{4})/i);
  const plan = planMatch ? planMatch[1] : null;

  const nameMatch = text.match(/ALUMNO\s+([A-Z\sÑÁÉÍÓÚ]+?)(?=\s+N[UÚ]M|\s+GEN|\s+P[áa]gina|\s+FACULTAD|$)/i);
  const studentName = nameMatch ? cleanText(nameMatch[1]) : null;

  const rowRegex = /(\d{1,2})\s+(\d{4})\s+(.+?)\s+([12]\d{3})\s+((?:(?:LU|MA|MI|JU|VI|SA)[,;\s:y\dap\.-]+)+?)(?:\s+(INF\.EN\s+JEFA|[A-Z]-\d+|SALON\s+\w+))?\s+([^0-9_]+?)(?=\s+\d{1,2}\s+\d{4}\b|\s+En\s+la\s+Inscripci|\s+Firma|\s+AVISO|\s*$)/gi;

  const subjects: RawScheduleSubject[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(text)) !== null) {
    const idx = match[1];
    const code = match[2];
    const name = cleanText(match[3]);
    const group = match[4].trim();
    const rawSchedule = match[5].trim();
    const classroom = (match[6] || '').trim();
    const professor = cleanText(match[7]);

    subjects.push({
      index: Number(idx),
      code,
      name,
      group,
      rawSchedule,
      days: formatDays(rawSchedule),
      time: formatTime(rawSchedule),
      classroom,
      professor,
    });
  }

  return {
    accountNumber,
    studentName,
    period,
    plan,
    subjects,
    rawText: text,
  };
}

