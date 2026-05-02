export interface UserData {
  nombre: string;
  cuenta: number;
  carrera: string;
  semestre: string;
  initial: string;
}

export interface StudentProfile {
  accountNumber: number;
  fullName: string;
  academicInfo: {
    semester: string;
    average: number;
    career: string;
  };
  interest: string | null;
}