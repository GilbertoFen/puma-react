import { StudentProfile } from "../types/index";
import { API_URL } from "../utils/api";
export const studentService = {

    //informacion por numero de cuenta 
    async getProfileByAccount(accountNumber: number): Promise<StudentProfile> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/students/account/${accountNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) throw new Error('Alumno no encontrado');
            throw new Error('Error al conectar con el servidor');
        }

        return await response.json();
    }
};