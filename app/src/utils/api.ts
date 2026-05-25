export const API_URL = 'https://pumaia.onrender.com/api';

const fetchWithAuth = async (url: string, options: any = {}) => {
  const response = await fetch(url, options);
  
  if (response.status === 401) {

    localStorage.removeItem('token');
    window.location.href = '/'; 
    throw new Error('Sesión expirada');
  }
  
  return response;
};