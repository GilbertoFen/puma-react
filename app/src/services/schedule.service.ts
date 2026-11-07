import { API_URL, getAuthHeaders, getAuthToken } from '../utils/api';
import { lookupSubjectInCatalog } from '../utils/academic-catalog';
import { gradeService, Subject } from './grades.service';

export interface EnrolledScheduleSubject {
  index: number;
  code: string;
  name: string;
  officialName?: string;
  credits: number | null;
  group: string;
  rawSchedule: string;
  days: string;
  time: string;
  classroom?: string;
  professor?: string;
  matchStatus: 'matched' | 'pending';
  subjectID?: string;
  realSubjectId?: string;
}

export interface StudentScheduleData {
  accountNumber: string;
  studentName: string | null;
  period: string | null;
  plan: string | null;
  uploadedAt: string;
  subjects: EnrolledScheduleSubject[];
  totalCredits: number;
}

export const scheduleService = {
  /**
   * Envía el PDF del horario actual a procesar, valida titularidad contra el alumno
   * autenticado, realiza la correspondencia por clave contra la información académica
   * y recupera los créditos reales.
   */
  analyzeSchedulePDF: async (
    file: File,
    token?: string,
    expectedAccount?: string | number
  ): Promise<StudentScheduleData> => {
    const activeToken = token || getAuthToken() || undefined;

    // 1. Obtener número de cuenta esperado del alumno autenticado
    let authAccount = expectedAccount ? String(expectedAccount).trim() : '';
    if (!authAccount) {
      try {
        const rawUserData = localStorage.getItem('userData');
        if (rawUserData) {
          const parsed = JSON.parse(rawUserData);
          authAccount = String(parsed.cuenta || parsed.accountNumber || parsed.user?.cuenta || '').trim();
        }
      } catch (_) {}
    }

    // 2. Enviar el archivo a la ruta de análisis del horario
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/schedule/parse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'No fue posible leer el comprobante de horario.');
    }

    const { data } = await response.json();
    if (!data || !Array.isArray(data.subjects) || data.subjects.length === 0) {
      throw new Error('El comprobante no contiene asignaturas legibles.');
    }

    // 3. Validar titularidad de la cuenta contra el alumno autenticado
    const docAccount = data.accountNumber ? String(data.accountNumber).trim() : null;
    if (docAccount && authAccount && docAccount !== authAccount) {
      throw new Error(
        `El comprobante cargado pertenece a la cuenta ${docAccount}, pero tu sesión activa corresponde al alumno con cuenta ${authAccount}. Por seguridad institucional, no puedes subir documentos de otro alumno.`
      );
    }

    // 4. Recuperar materias existentes del alumno (tira DGAE / BD) para el cruce de datos
    let existingGrades: Subject[] = [];
    try {
      existingGrades = await gradeService.getMyGrades(activeToken);
    } catch (_) {
      // Si el backend no responde, continuamos con el catálogo académico del proyecto
    }

    // 5. Cruzar ambos documentos haciendo match principalmente por CLAVE
    let totalCredits = 0;
    const matchedSubjects: EnrolledScheduleSubject[] = data.subjects.map((sub: any, idx: number) => {
      const codeStr = String(sub.code).trim();

      // a) Buscar en catálogo académico oficial del proyecto por clave
      const catalogMatch = lookupSubjectInCatalog(codeStr, sub.name);

      // b) Buscar en materias de la tira DGAE registradas en el backend
      const gradeMatch = existingGrades.find((g: any) => {
        const gCode = String(g.code || g.subject?.code || '').trim();
        return gCode && gCode === codeStr;
      });

      let credits: number | null = null;
      let officialName = sub.name;
      let matchStatus: 'matched' | 'pending' = 'pending';
      let subjectID = gradeMatch?.subjectID || (gradeMatch as any)?.id;
      let realSubjectId = (gradeMatch as any)?.realSubjectId || (gradeMatch as any)?.subjectId;

      if (catalogMatch) {
        credits = catalogMatch.credits;
        officialName = catalogMatch.name;
        matchStatus = 'matched';
      } else if (gradeMatch && (gradeMatch as any).credits) {
        credits = Number((gradeMatch as any).credits);
        officialName = gradeMatch.subjectName || officialName;
        matchStatus = 'matched';
      } else {
        // No inventar datos si no hay coincidencia
        credits = null;
        matchStatus = 'pending';
      }

      if (credits !== null) {
        totalCredits += credits;
      }

      return {
        index: sub.index || idx + 1,
        code: codeStr,
        name: sub.name,
        officialName,
        credits,
        group: sub.group,
        rawSchedule: sub.rawSchedule,
        days: sub.days,
        time: sub.time,
        classroom: sub.classroom,
        professor: sub.professor,
        matchStatus,
        subjectID,
        realSubjectId,
      };
    });

    const finalAccount = docAccount || authAccount || '321191399';

    const scheduleData: StudentScheduleData = {
      accountNumber: finalAccount,
      studentName: data.studentName,
      period: data.period,
      plan: data.plan,
      uploadedAt: new Date().toISOString(),
      subjects: matchedSubjects,
      totalCredits,
    };

    // 6. Asociar y persistir la información al alumno autenticado
    scheduleService.saveStudentSchedule(scheduleData, activeToken);

    return scheduleData;
  },

  /**
   * Guarda el horario asociado a la cuenta del alumno autenticado en el almacenamiento de sesión
   * y sincroniza con el backend cuando haya endpoints disponibles.
   */
  saveStudentSchedule: (data: StudentScheduleData, token?: string) => {
    if (!data || !data.accountNumber) return;
    const key = `pumaia_student_schedule_${data.accountNumber}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem('pumaia_active_schedule', JSON.stringify(data));
    } catch (err) {
      console.warn('No se pudo guardar el horario en el almacenamiento local:', err);
    }

    // Intentar sincronizar con el backend NestJS si hay sesión
    const activeToken = token || getAuthToken() || undefined;
    if (activeToken) {
      scheduleService.syncScheduleWithBackend(data, activeToken).catch((err) => {
        console.info('Aviso de sincronización backend:', err.message);
      });
    }
  },

  /**
   * Consulta el horario del alumno autenticado.
   */
  getStudentSchedule: (accountNumber?: string | number): StudentScheduleData | null => {
    let acc = accountNumber ? String(accountNumber).trim() : '';
    if (!acc) {
      try {
        const rawUserData = localStorage.getItem('userData');
        if (rawUserData) {
          const parsed = JSON.parse(rawUserData);
          acc = String(parsed.cuenta || parsed.accountNumber || parsed.user?.cuenta || '').trim();
        }
      } catch (_) {}
    }

    try {
      if (acc) {
        const stored = localStorage.getItem(`pumaia_student_schedule_${acc}`);
        if (stored) return JSON.parse(stored);
      }
      const activeStored = localStorage.getItem('pumaia_active_schedule');
      if (activeStored) return JSON.parse(activeStored);
    } catch (_) {}

    return null;
  },

  /**
   * Intenta registrar los grupos en el backend NestJS si el contrato está disponible.
   * Valida estrictamente UUIDs para no enviar datos incompatibles a NestJS/Prisma.
   */
  syncScheduleWithBackend: async (
    data: StudentScheduleData,
    token: string
  ): Promise<any> => {
    const isUuid = (val?: string | null) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    // Solo podemos enviar al endpoint de secciones si tenemos subjectIds y periodIds reales en formato UUID
    const validItems = data.subjects
      .filter((s) => isUuid(s.realSubjectId || s.subjectID))
      .map((s) => ({
        subjectId: (s.realSubjectId || s.subjectID) as string,
      }));

    if (validItems.length === 0) {
      return {
        synced: false,
        pendingBackendContract:
          'El backend no cuenta con un endpoint dedicado a Comprobantes de Horario (PDF/materias inscritas sin UUID). La información se conserva asociada al alumno autenticado.',
      };
    }

    return {
      synced: false,
      note: 'Requiere contrato backend para vincular periodo académico activo y sección del alumno.',
    };
  },
};
