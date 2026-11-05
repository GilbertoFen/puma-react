import { StudentProfile } from '../types/index';
import { API_URL, getAuthHeaders } from '../utils/api';

export const studentService = {
  async getProfileByAccount(accountNumber: number): Promise<StudentProfile> {
    const response = await fetch(`${API_URL}/students/account/${accountNumber}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('Alumno no encontrado');
      if (response.status === 403) throw new Error('No tienes autorización para consultar esta cuenta');
      throw new Error('Error al conectar con el servidor');
    }

    return await response.json();
  },

  /**
   * Método auxiliar para confirmar/actualizar nombre del alumno cuando needsNameConfirmation=true.
   * Contrato esperado: PATCH /api/students/profile-name { name, lastNameP, lastNameM? }
   * Nota de auditoría: si la ruta no está registrada en el backend actual, responderá 404.
   */
  async updateProfileName(data: {
    name: string;
    lastNameP: string;
    lastNameM?: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/students/profile-name`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.message || 'Error al actualizar el nombre del estudiante.',
      );
    }

    return await response.json();
  },
};
