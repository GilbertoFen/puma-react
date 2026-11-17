import { API_URL, fetchWithAuth } from '../utils/api';
import type {
  AdoptionItems,
  AttendanceItems,
  ChatEnvelope,
  Envelope,
  InviteStaffPayload,
  InviteStaffResponse,
  LabelingQueue,
  LabelingTopic,
  MeResponse,
  OperationsItems,
  PerformanceItems,
  PeriodItem,
  ProfessorCandidate,
  ProgressRow,
  QuestionnaireItem,
  QuestionnaireKind,
  ReportReceipt,
  ReportSection,
  ResendInvitationResponse,
  StaffMember,
  SummaryItems,
} from '../types/adminMetrics.types';

/** Error con el cuerpo que manda NestJS (p. ej. `candidates` en un 400 de invitación). */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function messageOf(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(' · ');
    if (typeof m === 'string') return m;
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(`${API_URL}${path}`, { ...init, redirectOn401: false });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const fallback =
      res.status === 401
        ? 'Tu sesión terminó. Vuelve a iniciar sesión.'
        : res.status === 403
          ? 'Tu cuenta no tiene permiso para ver esta sección.'
          : `Error ${res.status} al consultar el servidor.`;
    throw new ApiError(res.status, messageOf(body, fallback), body);
  }
  return body as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export interface PanelFilters {
  /** '' = periodo en curso (lo resuelve el backend). */
  periodId: string;
  weeks: number;
}

export const adminService = {
  me: () => request<MeResponse>('/autenticacion/me'),

  // Métricas (INSTITUTION_ADMIN / ANALYST). Cada consulta queda en AuditLog (METRICS_VIEWED).
  periods: () => request<Envelope<PeriodItem[]>>('/metrics/dashboard/periods'),
  summary: (f: PanelFilters) =>
    request<Envelope<SummaryItems>>(`/metrics/dashboard/summary${qs({ periodId: f.periodId })}`),
  adoption: (f: PanelFilters) =>
    request<Envelope<AdoptionItems>>(`/metrics/dashboard/adoption${qs({ weeks: f.weeks })}`),
  operations: (f: PanelFilters) =>
    request<Envelope<OperationsItems>>(
      `/metrics/dashboard/operations${qs({ periodId: f.periodId })}`,
    ),
  performance: (f: PanelFilters) =>
    request<Envelope<PerformanceItems>>(
      `/metrics/dashboard/performance${qs({ periodId: f.periodId })}`,
    ),
  progress: () => request<Envelope<ProgressRow[]>>('/metrics/dashboard/progress'),
  attendance: (f: PanelFilters) =>
    request<Envelope<AttendanceItems>>(
      `/metrics/dashboard/attendance${qs({ periodId: f.periodId, weeks: f.weeks })}`,
    ),
  chat: (f: PanelFilters) =>
    request<ChatEnvelope>(`/metrics/dashboard/chat${qs({ weeks: f.weeks })}`),
  questionnaires: (kind: QuestionnaireKind) =>
    request<Envelope<QuestionnaireItem[]>>(`/metrics/dashboard/questionnaires${qs({ kind })}`),

  // Reportes: se registra REPORT_GENERATED antes de imprimir.
  registerReport: (
    section: ReportSection,
    f: PanelFilters,
    extra: { kind?: QuestionnaireKind } = {},
  ) =>
    request<ReportReceipt>('/metrics/reports', {
      method: 'POST',
      body: JSON.stringify({
        section,
        ...(f.periodId ? { periodId: f.periodId } : {}),
        weeks: f.weeks,
        ...(extra.kind ? { kind: extra.kind } : {}),
      }),
    }),

  // Personal (solo INSTITUTION_ADMIN).
  staff: () => request<StaffMember[]>('/autenticacion/staff'),
  professorsWithoutAccount: (q: string) =>
    request<ProfessorCandidate[]>(
      `/autenticacion/staff/professors-without-account${qs({ q: q.trim() })}`,
    ),
  inviteStaff: (payload: InviteStaffPayload) =>
    request<InviteStaffResponse>('/autenticacion/invite-staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resendInvitation: (userId: string) =>
    request<ResendInvitationResponse>(`/autenticacion/staff/${userId}/resend-invitation`, {
      method: 'POST',
    }),

  // Etiquetado (solo ANALYST).
  labelingTopics: () => request<LabelingTopic[]>('/metrics/labeling/topics'),
  labelingQueue: (limit = 10) =>
    request<LabelingQueue>(`/metrics/labeling/queue${qs({ limit })}`),
  addLabels: (conversationId: string, topicIds: string[]) =>
    request<unknown>(`/metrics/labeling/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ topicIds }),
    }),
  skipConversation: (conversationId: string) =>
    request<unknown>(`/metrics/labeling/${conversationId}/skip`, { method: 'POST' }),
};
