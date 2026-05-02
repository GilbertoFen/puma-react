import { API_URL } from '../utils/api';
//Consumo a Servicio del Login
export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<any> => {
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

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  }
};