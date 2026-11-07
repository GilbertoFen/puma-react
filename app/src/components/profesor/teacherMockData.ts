import { TeacherProfile } from './teacherTypes';

export const FALLBACK_TEACHER_STUDENTS = [
  { id: 'std-101', name: 'Aguilar Mendoza Rodrigo', accountNumber: '318029341', currentStatus: 'pendiente' },
  { id: 'std-102', name: 'Benítez Cruz Ximena Sofía', accountNumber: '319204918', currentStatus: 'pendiente' },
  { id: 'std-103', name: 'Cabrera Romero Diego Emiliano', accountNumber: '318392015', currentStatus: 'pendiente' },
  { id: 'std-104', name: 'Domínguez Morales Valeria', accountNumber: '320194827', currentStatus: 'pendiente' },
  { id: 'std-105', name: 'Espinoza Galindo Carlos Andrés', accountNumber: '319402914', currentStatus: 'pendiente' },
  { id: 'std-106', name: 'Flores Navarrete Mariana', accountNumber: '318957204', currentStatus: 'pendiente' },
  { id: 'std-107', name: 'García Villanueva Héctor', accountNumber: '320491823', currentStatus: 'pendiente' },
  { id: 'std-108', name: 'Hernández Beltrán Fernanda', accountNumber: '318284910', currentStatus: 'pendiente' },
  { id: 'std-109', name: 'Juárez Santillán Camila', accountNumber: '319028471', currentStatus: 'pendiente' },
  { id: 'std-110', name: 'López Calderón Sebastián', accountNumber: '320394819', currentStatus: 'pendiente' },
];

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  id: 'dabfd7c2-c718-4017-bc27-86db61021506',
  accountNumber: 'DOCENTE',
  name: 'Prof. Josué Castañeda Landa',
  email: 'josue.landa@acatlan.unam.mx',
  role: 'Profesor de Carrera · MAC',
  department: 'División de Matemáticas e Ingeniería',
  institution: 'FES Acatlán · UNAM',
  semester: 'Semestre 2027-1',
  avatarInitial: 'J',
  courses: [],
};

// Clave segura para persistencia local de sesión docente sin chocar con estudiantes
export const TEACHER_SESSION_STORAGE_KEY = 'pumaia_teacher_session_v1';
