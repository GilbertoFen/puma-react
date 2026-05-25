import { API_URL } from '../utils/api';
export const authService = {
  login: async (credentials: { accountNumber: number; password: string }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/autenticacion/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la autenticación');
      }

      return data;
    } catch (error) {
      console.error("AuthService Login Error:", error);
      throw error;
    }
  },
  register: async (userData: any): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/autenticacion/register`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la cuenta');
      }

      return data;
    } catch (error) {
      console.error("AuthService Register Error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  }
};