/**
 * Formas de respuesta del backend para el panel de administración.
 * Fuente de verdad: PUMAIA/src/metrics (dashboard.controller, sections/*, metrics.service,
 * labeling/*, reports/*) y PUMAIA/src/autenticacion (staff/*, invite-staff, me).
 *
 * Convención del backend: una celda por debajo de METRICS_MIN_GROUP llega en null
 * (y, en algunas secciones, con `suppressed: true`). En el front se muestra como
 * "Protegido · menos de {minGroupSize} alumnos", nunca como 0.
 */

export type RoleType = 'STUDENT' | 'PROFESSOR' | 'INSTITUTION_ADMIN' | 'ANALYST';
export type QuestionnaireKind = 'ONBOARDING' | 'CHECK_IN' | 'TERM_SURVEY';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SCALE' | 'TEXT';
export type TopicGroup =
  | 'PERMANENCIA'
  | 'ACADEMICO'
  | 'TRAMITES'
  | 'BIENESTAR'
  | 'EMPLEABILIDAD'
  | 'OTRO';
export type ConsentKind = 'TERMS_AND_NOTICE' | 'ANALYTICS' | 'IMPROVEMENT';

/** Sobre común (MetricsService.envelope). */
export interface Envelope<T> {
  minGroupSize: number;
  generatedAt: string;
  filters: Record<string, string | null>;
  notes: string[];
  items: T;
}

// --- periods ---------------------------------------------------------------
export interface PeriodItem {
  id: string;
  code: string;
  startsAt: string | null;
  endsAt: string | null;
  current: boolean;
}

// --- summary ---------------------------------------------------------------
export interface SummaryItems {
  registeredStudents: number;
  analyticsConsentRate: number | null;
  transcriptUploadedRate: number | null;
  sections: { total: number; withProfessor: number; rate: number | null };
  conversationsThisWeek: number;
}

// --- adoption --------------------------------------------------------------
export interface FunnelStep {
  step: 'REGISTERED' | 'ACCEPTED_TERMS' | 'UPLOADED_TRANSCRIPT' | 'JOINED_SECTION' | 'CHATTED';
  label: string;
  count: number | null;
  rateOfRegistered: number | null;
}
export interface AdoptionItems {
  funnel: FunnelStep[];
  activeStudentsByWeek: { week: string; activeStudents: number | null }[];
}

// --- operations ------------------------------------------------------------
export interface OperationsItems {
  sections: {
    total: number;
    noList: number;
    pendingConfirmation: number;
    confirmed: number;
    confirmedRate: number | null;
  };
  professors: {
    active: number;
    withAccount: number;
    withoutAccount: number;
    withAccountRate: number | null;
  };
  consents: {
    kind: ConsentKind;
    noticeVersion: string | null;
    granted: number;
    revoked: number;
    outdatedVersion: number;
    noResponse: number;
  }[];
}

// --- performance -----------------------------------------------------------
export interface PerformanceItems {
  failRateBySubject: {
    subjectId: string;
    subjectName: string;
    semester: number | null;
    failRate: number;
    completedStudents: number | null;
  }[];
  averageHistogram: { bin: string; students: number | null }[];
  averageByPeriod: {
    periodId: string;
    period: string;
    students: number | null;
    averageGrade: number | null;
  }[];
  mostRetaken: {
    subjectId: string;
    subjectName: string;
    semester: number | null;
    studentsRetaking: number | null;
  }[];
}

// --- progress --------------------------------------------------------------
export interface ProgressRow {
  semester: number;
  studentsWithTranscript: number | null;
  studentsWithoutTranscript: number | null;
  expectedCredits: number | null;
  averageEarnedCredits: number | null;
  onTrack: number | null;
  slightDelay: number | null;
  delay: number | null;
  suppressed: boolean;
}

// --- attendance ------------------------------------------------------------
export interface AttendanceRates {
  students: number | null;
  records: number | null;
  presentRate: number | null;
  lateRate: number | null;
  absentRate: number | null;
  excusedRate: number | null;
}
export interface AttendanceItems {
  byWeek: ({ week: string } & AttendanceRates)[];
  bySubject: ({ subjectId: string; subject: string } & AttendanceRates)[];
  bySection: ({
    sectionId: string;
    subject: string;
    groupCode: string;
    sessions: number;
  } & AttendanceRates)[];
  openSessionsExcluded: number;
}

// --- chat ------------------------------------------------------------------
export interface FeedbackRow {
  useful: number | null;
  notUseful: number | null;
  usefulRate: number | null;
  notUsefulRate: number | null;
}
export interface ChatItems {
  coverage: {
    eligibleConversations: number;
    labeledConversations: number;
    labeledRate: number | null;
  };
  topicsByGroup: {
    topicGroup: TopicGroup;
    conversations: number | null;
    topics: { topicCode: string; label: string; conversations: number | null }[];
  }[];
  queriesByWeek: { week: string; queries: number | null }[];
  feedback: { total: FeedbackRow; byWeek: ({ week: string } & FeedbackRow)[] };
}
export type ChatEnvelope = Envelope<ChatItems> & { analyticsNoticeVersion: string | null };

// --- questionnaires --------------------------------------------------------
export interface QuestionnaireItem {
  questionCode: string;
  text: string;
  type: QuestionType;
  category: string | null;
  questionnaireVersion: number | string;
  respondents: number | null;
  averageScale: number | null;
  optionDistribution:
    | { optionLabel: string; value: string; count: number | null; suppressed: boolean }[]
    | null;
  suppressed: boolean;
  suppressionReason: 'MIN_GROUP' | 'DIFFERENCING' | null;
}

// --- reports ---------------------------------------------------------------
export type ReportSection = 'full' | 'summary' | 'academic' | 'attendance' | 'chat' | 'suggestions';
export interface ReportReceipt {
  section: ReportSection;
  filters: { periodId: string | null; weeks: number | null; kind: string | null };
  generatedAt: string;
  generatedBy: { name: string | null; email: string | null };
  minGroupSize: number;
}

// --- staff -----------------------------------------------------------------
export interface StaffMember {
  id: string;
  email: string;
  name: string;
  lastNameP: string;
  lastNameM: string | null;
  status: 'INVITED' | 'ACTIVE' | 'DELETED';
  createdAt: string;
  lastLoginAt: string | null;
  roles: RoleType[];
  invitedAt: string | null;
  professorId: string | null;
}
export interface ProfessorCandidate {
  id: string;
  name: string;
  lastNameP: string;
  lastNameM: string | null;
}
export interface InviteStaffPayload {
  email: string;
  name: string;
  lastNameP: string;
  lastNameM?: string;
  role: Exclude<RoleType, 'STUDENT'>;
  professorId?: string;
  createNewProfessor?: boolean;
}
export interface InviteStaffResponse {
  message: string;
  /** true solo si el proveedor de correo aceptó la invitación. */
  emailSent: boolean;
  /** Código seguro del fallo (p. ej. NO_PROVIDER_CONFIGURED), sin contenido del correo. */
  emailError: string | null;
  user: { id: string; email: string; status: string; roles: RoleType[] };
}
export interface ResendInvitationResponse {
  emailSent: boolean;
  emailError: string | null;
  userId: string;
  email: string;
}

// --- labeling --------------------------------------------------------------
export interface LabelingTopic {
  id: string;
  code: string;
  label: string;
  topicGroup: TopicGroup;
}
export interface LabelingConversation {
  id: string;
  createdAt: string;
  messages: { role: string; content: string; createdAt: string }[];
}
export interface LabelingQueue {
  pending: number;
  conversations: LabelingConversation[];
}

// --- me --------------------------------------------------------------------
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  lastNameP: string;
  lastNameM: string | null;
  status: string;
  roles: RoleType[];
}
