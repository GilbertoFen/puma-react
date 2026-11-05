import { API_URL, getAuthHeaders } from '../utils/api';

export interface AttendanceRecordResponse {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: 'QR' | 'MANUAL';
  markedAt: string;
  session?: {
    id: string;
    sectionId: string;
    status: string;
    startsAt: string;
    endsAt?: string;
    section?: {
      id: string;
      code?: string;
      name?: string;
      group?: string;
      groupCode?: string;
      subject?: {
        id: string;
        name?: string;
        subject?: string;
        code: string | number;
      };
    };
  };
}

export const attendanceService = {
  /**
   * Registra la asistencia del alumno autenticado enviando sessionId y el token/secreto del QR.
   */
  recordAttendance: async (dto: {
    sessionId: string;
    secret: string;
  }): Promise<{ success: boolean; message: string; record: AttendanceRecordResponse }> => {
    const res = await fetch(`${API_URL}/attendance/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        sessionId: dto.sessionId,
        secret: dto.secret,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'No fue posible registrar la asistencia.');
    }

    return {
      success: true,
      message: 'Asistencia registrada correctamente.',
      record: data,
    };
  },

  /**
   * Consulta las asignaturas y horario oficial del alumno autenticado desde la base de datos.
   */
  getMySchedule: async (): Promise<any> => {
    const res = await fetch(`${API_URL}/attendance/my-schedule`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar horario oficial.');
    }

    return res.json();
  },

  /**
   * Consulta las asistencias registradas por el alumno autenticado.
   */
  getMyAttendance: async (sectionId?: string): Promise<AttendanceRecordResponse[]> => {
    const query = sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : '';
    const res = await fetch(`${API_URL}/attendance/my-attendance${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar asistencias.');
    }

    return res.json();
  },
};

