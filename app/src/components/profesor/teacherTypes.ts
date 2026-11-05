/**
 * CONTRATOS Y TIPOS PARA EL MÓDULO DOCENTE PUMAIA (FES ACATLÁN - MAC)
 * Preparado para conexión reactiva con NestJS / Supabase
 */

export type AttendanceStatus = 'presente' | 'pendiente' | 'falta';

export interface StudentAttendance {
  id: string;
  name: string;
  accountNumber: string; // Número de cuenta UNAM (9 dígitos)
  currentStatus: AttendanceStatus;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface ScheduleSlot {
  day: DayOfWeek;
  dayIndex: number; // 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie
  startHour: number; // Ej. 7 (07:00)
  endHour: number; // Ej. 9 (09:00)
  displayTime: string; // "07:00 - 09:00 hrs"
}

export interface TeacherCourse {
  id: string;
  name: string;
  code: string;
  group: string;
  schedule: string;
  classroom: string;
  colorTag: 'gold' | 'blue' | 'navy' | 'cyan';
  scheduleSlots: ScheduleSlot[];
  students: StudentAttendance[];
}

export interface TeacherProfile {
  id: string;
  accountNumber: string;
  name: string;
  email: string;
  role: string;
  department: string;
  institution: string;
  semester: string;
  avatarInitial: string;
  courses: TeacherCourse[];
}

/**
 * 🔒 BLINDAJE LÓGICO: PAYLOAD DEL QR DINÁMICO
 * Payload de un solo uso (One-Time Token) codificado dentro del código QR
 */
export interface QrTokenPayload {
  sessionId: string;
  courseId: string;
  groupId: string;
  dynamicSalt: string;
  expiresAt: number; // Unix timestamp en milisegundos
}

/**
 * 🔒 BLINDAJE LÓGICO: CONTRATO DE ESCANEO
 * Interfaz esperada por el endpoint móvil/web al validar la asistencia del estudiante
 */
export interface StudentScanRequest {
  qrToken: string; // Payload serializado o firmado del QR
  studentToken: string; // Token de autenticación del alumno
  studentEmail: string; // Correo institucional del alumno
  studentName: string; // Nombre completo del alumno
  timestamp: number;
}

export interface StudentScanResponse {
  success: boolean;
  message: string;
  registeredAt: string;
  attendanceRecordId: string;
}

