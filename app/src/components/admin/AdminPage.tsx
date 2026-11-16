'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Navbar from '../Navbar';
import AppFooter from '../AppFooter';
import '../../pages/LoginPage.css';
import styles from './AdminPage.module.css';
import s from './panel/AdminPanel.module.css';
import { API_URL, fetchWithAuth } from '../../utils/api';
import { adminService, type PanelFilters } from '../../services/admin.service';
import { fullName } from '../../context/SessionContext';
import { usePortalGuard } from '../../hooks/usePortalGuard';
import type { DayOfWeek, RealTimeScheduleItem } from '../../types/admin.types';
import type { QuestionnaireKind, ReportReceipt, ReportSection, RoleType } from '../../types/adminMetrics.types';

import AdminLoginModal from './AdminLoginModal';
import AdminHeader, { type AdminTab } from './AdminHeader';
import AdminScheduleCalendar from './AdminScheduleCalendar';
import AdminScheduleDetailModal from './AdminScheduleDetailModal';
import { PanelContext, type PanelContextValue, periodLabel, useAsync } from './panel/common';
import { fmtDateTime } from './panel/charts';
import SummaryTab from './panel/SummaryTab';
import AcademicTab from './panel/AcademicTab';
import AttendanceTab from './panel/AttendanceTab';
import ChatTab from './panel/ChatTab';
import SuggestionsTab from './panel/SuggestionsTab';
import StaffTab from './panel/StaffTab';
import LabelingTab from './panel/LabelingTab';

interface PanelUser {
  id: string;
  email: string;
  fullName: string;
  roles: RoleType[];
}

export default function AdminPage() {
  // Sesión única (SessionContext). Si la cuenta no tiene rol de admin/analista, el guard la manda a su ruta.
  const session = usePortalGuard('/admin');
  const user: PanelUser | null =
    session.allowed && session.user
      ? {
          id: session.user.id,
          email: session.user.email,
          fullName: fullName(session.user),
          roles: session.user.roles as RoleType[],
        }
      : null;

  const handleLogout = async () => {
    await session.logout();
  };

  if (session.status === 'loading' || session.redirecting) {
    return (
      <div className={styles.root}>
        <div className={styles.bgMesh} />
        <div className={styles.loadingScreen}>
          <div className={styles.spinnerLarge} />
          <span>{session.redirecting ? 'Llevándote a tu portal…' : 'Verificando sesión…'}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-mesh" />
        <Navbar />
        <div className="gold-line" />
        <main className="login-main">
          <div className="login-hero">
            <h1 className="login-title">
              Panel de
              <br />
              administración
            </h1>
            <p className="login-subtitle">
              Cifras agregadas de PumaIA para la coordinación. Sin listas ni datos de alumnos individuales.
            </p>
          </div>
          <AdminLoginModal />
        </main>
        <div className="gold-line" style={{ marginTop: 'auto' }} />
        <AppFooter variant="dark" />
      </div>
    );
  }

  return <AdminPanel user={user} onLogout={handleLogout} />;
}

// ---------------------------------------------------------------------------
// Panel con sesión
// ---------------------------------------------------------------------------

interface PrintJob {
  section: ReportSection;
  receipt: ReportReceipt;
  kind?: QuestionnaireKind;
}

const SECTION_TITLE: Record<ReportSection, string> = {
  full: 'Reporte general',
  summary: 'Resumen',
  academic: 'Académico',
  attendance: 'Asistencia',
  chat: 'Chat y cuestionarios',
  suggestions: 'Sugerencias (datos de ejemplo)',
};

function AdminPanel({ user, onLogout }: { user: PanelUser; onLogout: () => void }) {
  const isAdmin = user.roles.includes('INSTITUTION_ADMIN');
  const isAnalyst = user.roles.includes('ANALYST');

  const tabs = useMemo(() => {
    const t: { id: AdminTab; label: string }[] = [
      { id: 'summary', label: 'Resumen' },
      { id: 'academic', label: 'Académico' },
      { id: 'attendance', label: 'Asistencia' },
      { id: 'chat', label: 'Chat y cuestionarios' },
      { id: 'suggestions', label: 'Sugerencias' },
    ];
    if (isAdmin) t.push({ id: 'staff', label: 'Personal e invitaciones' });
    t.push({ id: 'calendar', label: 'Horarios' });
    if (isAnalyst) t.push({ id: 'labeling', label: 'Etiquetado' });
    return t;
  }, [isAdmin, isAnalyst]);

  const [tab, setTab] = useState<AdminTab>('summary');
  const [filters, setFilters] = useState<PanelFilters>({ periodId: '', weeks: 12 });
  const periods = useAsync(() => adminService.periods(), []);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 5000);
  }, []);

  /** 1) Registra REPORT_GENERATED en el backend. 2) Monta la copia imprimible. 3) Imprime cuando cargó. */
  const printReport = useCallback(
    async (section: ReportSection, extra: { kind?: QuestionnaireKind } = {}) => {
      setReportBusy(true);
      try {
        const receipt = await adminService.registerReport(section, filters, extra);
        setPrintJob({ section, receipt, kind: extra.kind });
      } catch (e) {
        setReportBusy(false);
        showToast(
          `No se generó el reporte: ${e instanceof Error ? e.message : 'no se pudo registrar en la bitácora'}.`,
        );
      }
    },
    [filters, showToast],
  );

  useEffect(() => {
    if (!printJob) return;
    let cancelled = false;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      setPrintJob(null);
      setReportBusy(false);
    };
    const tick = () => {
      if (cancelled) return;
      const root = printRef.current;
      const busy = !root || root.querySelector('[data-loading="true"]') !== null;
      if (busy && Date.now() - started < 20000) {
        timer = setTimeout(tick, 250);
        return;
      }
      window.addEventListener('afterprint', finish, { once: true });
      window.print();
    };
    timer = setTimeout(tick, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('afterprint', finish);
    };
  }, [printJob]);

  const baseCtx: Omit<PanelContextValue, 'printing'> = {
    filters,
    setFilters,
    periods: periods.data?.items ?? [],
    periodsError: periods.error,
    printReport: (section, extra) => void printReport(section, extra),
    reportBusy,
  };

  const headerUser = { fullName: user.fullName, roles: user.roles };

  return (
    <PanelContext.Provider value={{ ...baseCtx, printing: false }}>
      <div className={styles.root}>
        <div className={styles.bgMesh} />
        <AdminHeader user={headerUser} tabs={tabs} activeTab={tab} onTabChange={setTab} onLogout={onLogout} />

        <main className={styles.main}>
          {tab === 'summary' && <SummaryTab />}
          {tab === 'academic' && <AcademicTab />}
          {tab === 'attendance' && <AttendanceTab />}
          {tab === 'chat' && <ChatTab />}
          {tab === 'suggestions' && <SuggestionsTab onGoTo={setTab} />}
          {tab === 'staff' && isAdmin && <StaffTab />}
          {tab === 'calendar' && <ScheduleTab />}
          {tab === 'labeling' && isAnalyst && <LabelingTab />}
        </main>

        {toast && (
          <div className={styles.toastNotification} role="status">
            <span>{toast}</span>
          </div>
        )}
        <AppFooter variant="dark" />
      </div>

      {printJob &&
        createPortal(
          <PanelContext.Provider value={{ ...baseCtx, printing: true }}>
            <div className={s.printPortal} ref={printRef}>
              <PrintHeader job={printJob} filters={filters} periodText={periodLabel(filters, baseCtx.periods)} />
              <PrintBody job={printJob} />
              <footer className={s.printFooter}>
                Solo cifras agregadas; ninguna lista ni nombre de alumnos. Las celdas con menos de{' '}
                {printJob.receipt.minGroupSize} alumnos aparecen como “Protegido”. Sin ranking ni comparación de
                profesores. Este reporte quedó registrado en la bitácora de auditoría.
              </footer>
            </div>
          </PanelContext.Provider>,
          document.body,
        )}
    </PanelContext.Provider>
  );
}

function PrintHeader({ job, filters, periodText }: { job: PrintJob; filters: PanelFilters; periodText: string }) {
  const by = job.receipt.generatedBy;
  return (
    <header className={s.printHeader}>
      <p className={s.printSubtitle}>PumaIA · Panel de administración · FES Acatlán, UNAM</p>
      <h1 className={s.printTitle}>{SECTION_TITLE[job.section]}</h1>
      <dl className={s.printMeta}>
        <div>
          <dt>Periodo:</dt>
          <dd>{periodText}</dd>
        </div>
        <div>
          <dt>Series semanales:</dt>
          <dd>últimas {filters.weeks} semanas</dd>
        </div>
        <div>
          <dt>Fecha de generación:</dt>
          <dd>{fmtDateTime(job.receipt.generatedAt)}</dd>
        </div>
        <div>
          <dt>Generado por:</dt>
          <dd>{[by.name, by.email ? `(${by.email})` : null].filter(Boolean).join(' ') || '—'}</dd>
        </div>
        <div>
          <dt>Umbral de privacidad:</dt>
          <dd>{job.receipt.minGroupSize} alumnos por celda</dd>
        </div>
      </dl>
    </header>
  );
}

function PrintBody({ job }: { job: PrintJob }) {
  const block = (key: string, node: React.ReactNode) => (
    <section key={key} className={s.printSection}>
      {node}
    </section>
  );
  switch (job.section) {
    case 'full':
      return (
        <>
          {block('summary', <SummaryTab />)}
          {block('academic', <AcademicTab />)}
          {block('attendance', <AttendanceTab />)}
          {block('chat', <ChatTab initialKind={job.kind} />)}
        </>
      );
    case 'summary':
      return block('summary', <SummaryTab />);
    case 'academic':
      return block('academic', <AcademicTab />);
    case 'attendance':
      return block('attendance', <AttendanceTab />);
    case 'chat':
      return block('chat', <ChatTab initialKind={job.kind} />);
    case 'suggestions':
      return block('suggestions', <SuggestionsTab />);
  }
}

// ---------------------------------------------------------------------------
// Horarios (pestaña existente; ahora sin datos inventados)
// ---------------------------------------------------------------------------

const DAY_BY_WEEKDAY: Record<number, DayOfWeek> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};
const COLORS: RealTimeScheduleItem['colorTag'][] = ['gold', 'cyan', 'purple', 'emerald', 'rose', 'amber'];

interface SectionDto {
  id: string;
  groupCode: string;
  capacity?: number | null;
  subject?: { subject?: string; name?: string; semester?: number | null; code?: number | string } | null;
  professor?: { name: string; lastNameP: string } | null;
  meetings?: { id?: string; weekday: number; startTime: string; endTime: string; room?: string | null }[];
  _count?: { enrollments?: number };
}

function statusFor(weekday: number, start: Date, end: Date, now: Date): RealTimeScheduleItem['currentStatus'] {
  // Los horarios se guardan como hora local en UTC (ver getUTCHours).
  const today = now.getDay();
  if (weekday !== today) return 'upcoming';
  const mins = now.getHours() * 60 + now.getMinutes();
  const s0 = start.getUTCHours() * 60 + start.getUTCMinutes();
  const e0 = end.getUTCHours() * 60 + end.getUTCMinutes();
  if (mins < s0) return 'upcoming';
  if (mins < e0) return 'ongoing';
  return 'completed';
}

function ScheduleTab() {
  const [selected, setSelected] = useState<RealTimeScheduleItem | null>(null);
  const sections = useAsync(async () => {
    const res = await fetchWithAuth(`${API_URL}/sections`, { redirectOn401: false });
    if (!res.ok) throw new Error(`No se pudieron cargar los horarios (error ${res.status}).`);
    const data = (await res.json()) as SectionDto[];
    const now = new Date();
    const items: RealTimeScheduleItem[] = [];
    data.forEach((sec, si) => {
      (sec.meetings ?? []).forEach((m, mi) => {
        const day = DAY_BY_WEEKDAY[m.weekday];
        if (!day) return;
        const sd = new Date(m.startTime);
        const ed = new Date(m.endTime);
        const hhmm = (d: Date) =>
          `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        items.push({
          id: `${sec.id}-${m.id ?? mi}`,
          subjectName: sec.subject?.subject || sec.subject?.name || 'Materia sin nombre',
          groupCode: `Grupo ${sec.groupCode}`,
          professorName: sec.professor
            ? `${sec.professor.name} ${sec.professor.lastNameP}`.trim()
            : 'Profesor por asignar',
          classroom: m.room || null,
          day,
          startTime: hhmm(sd),
          endTime: hhmm(ed),
          startHour: sd.getUTCHours(),
          endHour: Math.max(sd.getUTCHours() + 1, ed.getUTCMinutes() > 0 ? ed.getUTCHours() + 1 : ed.getUTCHours()),
          semester: sec.subject?.semester ?? null,
          area: null,
          currentStatus: statusFor(m.weekday, sd, ed, now),
          enrolledStudents: sec._count?.enrollments ?? 0,
          capacity: sec.capacity ?? null,
          colorTag: COLORS[si % COLORS.length],
        });
      });
    });
    return items;
  }, []);

  if (sections.loading && !sections.data) {
    return (
      <div className={s.stateBox}>
        <span className={s.spinner} aria-hidden /> Cargando horarios…
      </div>
    );
  }
  if (sections.error) {
    return (
      <div className={`${s.stateBox} ${s.stateError}`} role="alert">
        <span>{sections.error}</span>
        <button type="button" className={s.btnGhost} onClick={sections.reload}>
          Reintentar
        </button>
      </div>
    );
  }
  if (!sections.data || sections.data.length === 0) {
    return <div className={s.stateBox}>No hay grupos con horario registrado.</div>;
  }
  return (
    <>
      <AdminScheduleCalendar scheduleItems={sections.data} onSelectScheduleItem={setSelected} />
      <AdminScheduleDetailModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
