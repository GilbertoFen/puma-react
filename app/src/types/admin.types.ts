/**
 * Contratos de datos e interfaces TypeScript para el módulo de Administración
 * y Supervisión Académica PumaIA (FES Acatlán - MAC).
 *
 * Diseñados para blindar el frontend ante la integración futura con NestJS (pumaAPI),
 * Supabase y agentes de inferencia GenAI sin requerir refactorizaciones de la UI.
 */

export interface AdminUser {
  id: string;
  accountNumber: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  institution?: string;
  avatarInitial?: string;
}

export interface MetricDetail {
  key: string;
  label: string;
  value: number | string;
  formattedValue: string;
  subValue?: string;
  status?: 'normal' | 'warning' | 'alert';
  notes?: string;
  historicalTrend?: { period: string; rate: number }[];
}

export interface MacroMetric {
  id: string;
  label: string;
  mainValueProb: string;   // e.g. "14.2%" o "0.32"
  mainValueRatio: string;  // e.g. "1 de cada 7 alumnos"
  breakdownType:
    | 'cohort_generations'
    | 'subjects_table'
    | 'semester_retention'
    | 'credits_distribution'
    | 'prereq_chain';
  change?: string;
  isPositive?: boolean;
  status?: 'normal' | 'warning' | 'alert';
  description: string;
  details: MetricDetail[];
}

export interface AnomalyObservation {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'preventive' | 'optimization';
  detectedAt: string;
  entityType: 'subject' | 'cohort' | 'schedule' | 'enrollment';
  aiGenerated: boolean;
  modelConfidence?: number;
  impactMetrics?: string;
  recommendedAction?: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface RealTimeScheduleItem {
  id: string;
  subjectName: string;
  groupCode: string;
  professorName: string;
  classroom: string;
  day: DayOfWeek;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "09:00"
  startHour: number; // 7, 8, etc.
  endHour: number;   // 9, 11, etc.
  semester: number;
  area: 'Matemáticas' | 'Computación' | 'Modelación' | 'Optativa';
  currentStatus: 'ongoing' | 'upcoming' | 'completed';
  enrolledStudents: number;
  capacity: number;
  averageAttendanceRate: number; // Porcentaje agregado 0 - 100 (sin PII)
  historicalPassRate: number;    // Porcentaje de acreditación histórica
  colorTag: 'gold' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
}

export type ReportType = 'failed_subjects' | 'cohort_dropout' | 'general_trajectory';

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface AcademicReport {
  id: string;
  type: ReportType;
  title: string;
  generationDate: string;
  cycle: string;
  executiveSummary: string;
  keyInsights: string[];
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INTERFACES PARA EL DASHBOARD INSTITUCIONAL DE ADMINISTRACIÓN (PDF)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AdminGeneralIndicators {
  registeredStudents: {
    total: number;
    estimatedEnrollment: number;
    percentage: number;
  };
  activatedAnalysis: {
    percentage: number;
    count: number;
    note: string;
  };
  privacyRule: {
    threshold: number;
    note: string;
  };
}

export interface TopicConcern {
  id: string;
  category: string;
  studentsCount: number | string;
  variationPercentage: number;
  trend: 'up' | 'down' | 'same';
  trendText: string;
}

export interface AdministrativeProcedure {
  id: string;
  procedureName: string;
  studentsCount: number | string;
  isRestricted?: boolean;
}

export interface WhereTheyGetStuckSubject {
  id: string;
  subjectName: string;
  studentsCount: number | string;
  failureRate: number;
  trend: string;
  trendDirection: 'up' | 'down' | 'same';
}

export interface SemesterProgressCategory {
  semester: number;
  semesterLabel: string;
  onTrack: number; // Al corriente
  oneOrTwoBehind: number; // Una o dos materias atrás
  moreBehind: number; // Más atrás
  totalStudents: number;
  isEmptyDueToPrivacy?: boolean;
}

export interface UsageAndSatisfactionData {
  activeStudentsMonth: number;
  monthlyEvolution: { month: string; activeCount: number }[];
  averageSatisfaction: number; // 1 a 5
  responsesCount: number;
}

export interface WellbeingSummary {
  studentsCount: number;
  monthlyVariation: number;
  trendDirection: 'up' | 'down' | 'same';
  supportUrl: string;
  isAboveThreshold: boolean;
  threshold: number;
}

