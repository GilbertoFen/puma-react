'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import AppFooter from '../AppFooter';
import '../../pages/LoginPage.css';
import styles from './AdminPage.module.css';
import { API_URL, getAuthHeaders, getAuthToken } from '../../utils/api';
import { authService } from '../../services/auth.service';
import {
  AdminUser,
  MacroMetric,
  RealTimeScheduleItem,
  AcademicReport,
  DayOfWeek,
} from '../../types/admin.types';
import {
  ADMIN_SESSION_STORAGE_KEY,
  MACRO_METRICS_DATA,
  REPORTS_CATALOG,
  ANOMALY_OBSERVATIONS_DATA,
  REAL_TIME_SCHEDULE_DATA,
} from './adminMockData';

import AdminLoginModal from './AdminLoginModal';
import AdminHeader from './AdminHeader';
import AdminPdfDashboard from './AdminPdfDashboard';
import AdminMacroMetricsGrid from './AdminMacroMetricsGrid';
import AdminMetricDetailModal from './AdminMetricDetailModal';
import AdminReportsBar from './AdminReportsBar';
import AdminReportModal from './AdminReportModal';
import AdminObservationsSection from './AdminObservationsSection';
import AdminScheduleCalendar from './AdminScheduleCalendar';
import AdminScheduleDetailModal from './AdminScheduleDetailModal';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  const [metricsData, setMetricsData] = useState<MacroMetric[]>(MACRO_METRICS_DATA);
  const [selectedMetric, setSelectedMetric] = useState<MacroMetric | null>(null);
  const [activeReportModal, setActiveReportModal] = useState<AcademicReport | null>(null);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<RealTimeScheduleItem | null>(null);
  const [scheduleItems, setScheduleItems] = useState<RealTimeScheduleItem[]>(REAL_TIME_SCHEDULE_DATA);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCycle] = useState('Semestre 2026-1');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: AdminUser = JSON.parse(stored);
        setAdminUser(parsed);
      }
    } catch (e) {
      console.warn('Error al leer sesión administrativa:', e);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Sincronización con los endpoints reales de /api/metrics/* protegidos con k-anonimato >= 10
  useEffect(() => {
    if (!adminUser) return;

    const fetchInstitutionalMetrics = async () => {
      const token = getAuthToken();
      if (!token) return;

      const headers = getAuthHeaders();

      try {
        const [perfRes, riskRes, attRes, topicsRes, satRes] = await Promise.all([
          fetch(`${API_URL}/metrics/academic-performance`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_URL}/metrics/retention-risk`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_URL}/metrics/attendance`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_URL}/metrics/chat-topics`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_URL}/metrics/satisfaction`, {
            headers,
            credentials: 'include',
          }),
        ]);

        if (
          perfRes.status === 401 ||
          perfRes.status === 403 ||
          riskRes.status === 401 ||
          riskRes.status === 403
        ) {
          localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          setAdminUser(null);
          return;
        }

        const perfData = perfRes.ok ? await perfRes.json() : [];
        const riskData = riskRes.ok ? await riskRes.json() : [];
        const attData = attRes.ok ? await attRes.json() : [];
        const topicsData = topicsRes.ok ? await topicsRes.json() : [];
        const satData = satRes.ok ? await satRes.json() : [];

        if (
          Array.isArray(perfData) &&
          perfData.length === 0 &&
          Array.isArray(riskData) &&
          riskData.length === 0
        ) {
          return;
        }

        setMetricsData((prev) => {
          const updated = [...prev];

          if (Array.isArray(perfData) && perfData.length > 0 && updated[0]) {
            updated[0] = {
              ...updated[0],
              details: perfData.map((p: any, idx: number) => ({
                key: `perf_${p.subjectId || idx}`,
                value: p.kAnonymityProtected ? 0 : parseFloat(String(p.passRate)) || 0,
                label: p.subjectName || 'Materia',
                formattedValue: p.kAnonymityProtected
                  ? 'RESTRINGIDO (<10)'
                  : `${p.passRate} aprob. / Prom: ${p.averageGrade}`,
                subValue: `Muestra: ${p.totalStudents} alumnos`,
                notes: p.kAnonymityProtected
                  ? 'Protegido por k-anonimato institucional (umbral < 10 estudiantes únicos)'
                  : `Reprobación: ${p.failRate}`,
              })),
            };
          }

          if (Array.isArray(riskData) && riskData.length > 0 && updated[1]) {
            updated[1] = {
              ...updated[1],
              details: riskData.map((r: any, idx: number) => ({
                key: `risk_${idx}`,
                value: r.kAnonymityProtected ? 0 : parseFloat(String(r.riskRate)) || 0,
                label: `${r.career} · ${r.semester}° Semestre`,
                formattedValue: r.kAnonymityProtected
                  ? 'RESTRINGIDO (<10)'
                  : String(r.riskRate),
                subValue: `Cohorte: ${r.totalStudents} alumnos`,
                notes: r.kAnonymityProtected
                  ? 'Protegido por k-anonimato (< 10 alumnos)'
                  : `NP: ${r.notPresentedCount} · Bajas: ${r.withdrawnCount}`,
              })),
            };
          }

          if (Array.isArray(attData) && attData.length > 0 && updated[2]) {
            updated[2] = {
              ...updated[2],
              details: attData.map((a: any, idx: number) => ({
                key: `att_${a.sectionId || idx}`,
                value: a.kAnonymityProtected ? 0 : parseFloat(String(a.presentPercentage)) || 0,
                label: `${a.subject} (Gpo. ${a.groupCode})`,
                formattedValue: a.kAnonymityProtected
                  ? 'RESTRINGIDO (<10)'
                  : String(a.presentPercentage),
                subValue: `Asistentes únicos: ${a.attendeesCount}`,
                notes: a.kAnonymityProtected
                  ? 'Protegido por k-anonimato (< 10 alumnos)'
                  : `Inasistencia: ${a.absencePercentage} · Retardo: ${a.latePercentage}`,
              })),
            };
          }

          if (Array.isArray(topicsData) && topicsData.length > 0 && updated[3]) {
            updated[3] = {
              ...updated[3],
              details: topicsData.map((t: any, idx: number) => ({
                key: `topic_${t.topicCode || idx}`,
                value: typeof t.totalQueries === 'number' ? t.totalQueries : 0,
                label: `${t.label} (${t.topicGroup})`,
                formattedValue: t.kAnonymityProtected
                  ? 'RESTRINGIDO (<10)'
                  : `${t.totalQueries} consultas`,
                subValue: `Alumnos únicos: ${t.totalStudents || '<10'}`,
                notes: t.kAnonymityProtected
                  ? 'Excluido por k-anonimato (< 10 estudiantes únicos con consentimiento ANALYTICS)'
                  : `Confianza promedio: ${t.averageConfidence ?? 'N/A'}`,
              })),
            };
          }

          if (Array.isArray(satData) && satData.length > 0 && updated[4]) {
            updated[4] = {
              ...updated[4],
              details: satData.map((s: any, idx: number) => ({
                key: `sat_${s.questionCode || idx}`,
                value: s.kAnonymityProtected ? 0 : parseFloat(String(s.averageScale)) || 0,
                label: s.text || s.questionCode,
                formattedValue: s.kAnonymityProtected
                  ? 'RESTRINGIDO (<10)'
                  : `Escala prom: ${s.averageScale}`,
                subValue: `Muestra única: ${s.sampleCount} alumnos`,
                notes: s.kAnonymityProtected
                  ? 'Protegido por k-anonimato (< 10 estudiantes únicos)'
                  : `Categoría: ${s.category || 'General'}`,
              })),
            };
          }

          return updated;
        });
      } catch (err) {
        console.warn('Error consultando métricas reales del backend:', err);
      }
    };

    fetchInstitutionalMetrics();

    const fetchRealSections = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_URL}/sections`, {
          headers,
          credentials: 'include',
        });
        if (!res.ok) return;
        const sections = await res.json();
        if (!Array.isArray(sections)) return;

        const dayNameMap: Record<number, DayOfWeek> = {
          1: 'Lunes',
          2: 'Martes',
          3: 'Miércoles',
          4: 'Jueves',
          5: 'Viernes',
          6: 'Sábado',
        };

        const colors: ('gold' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber')[] = [
          'gold',
          'cyan',
          'purple',
          'emerald',
          'rose',
          'amber',
        ];

        const mapped: RealTimeScheduleItem[] = [];

        sections.forEach((sec: any) => {
          const meetings = sec.meetings || [];
          meetings.forEach((m: any, mIdx: number) => {
            const sDate = new Date(m.startTime);
            const eDate = new Date(m.endTime);
            const startHour = sDate.getUTCHours();
            const endHour = eDate.getUTCHours();
            const startTime = `${startHour.toString().padStart(2, '0')}:${sDate.getUTCMinutes().toString().padStart(2, '0')}`;
            const endTime = `${endHour.toString().padStart(2, '0')}:${eDate.getUTCMinutes().toString().padStart(2, '0')}`;

            const day = dayNameMap[m.weekday] || 'Lunes';
            const profName = sec.professor
              ? `${sec.professor.name} ${sec.professor.lastNameP}`.trim()
              : 'Profesor por asignar';

            const enrolled = sec._count?.enrollments || sec.enrollments?.length || 0;
            const capacity = sec.capacity || 40;
            const colorTag = colors[(sec.subject?.code || mIdx) % colors.length] || 'gold';

            mapped.push({
              id: `${sec.id}-${m.id || mIdx}`,
              subjectName: sec.subject?.subject || sec.subject?.name || 'Asignatura',
              groupCode: `Grupo ${sec.groupCode}`,
              professorName: profName,
              classroom: m.room || 'Edificio A-8',
              day,
              startTime,
              endTime,
              startHour,
              endHour,
              semester: sec.subject?.semester || 1,
              area: sec.subject?.category?.name || 'Computación',
              currentStatus: 'upcoming',
              enrolledStudents: enrolled,
              capacity,
              averageAttendanceRate: 85,
              historicalPassRate: 80,
              colorTag,
            });
          });
        });

        if (mapped.length > 0) {
          setScheduleItems(mapped);
        }
      } catch (err) {
        console.warn('Error fetching real admin schedule from backend:', err);
      }
    };

    fetchRealSections();
  }, [adminUser]);

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    showToast(`Bienvenido al Panel Directivo, ${user.fullName}`);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      await authService.logout();
    } catch (e) {
      console.warn('Error al eliminar sesión:', e);
    }
    setAdminUser(null);
    setSelectedMetric(null);
    setActiveReportModal(null);
    setSelectedScheduleItem(null);
    showToast('Sesión de coordinación cerrada.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const handleGenerateGeneralReport = () => {
    const report = REPORTS_CATALOG['general_trajectory'];
    if (report) {
      setActiveReportModal(report);
    }
  };

  const handleGenerateIndicatorReport = (metric: MacroMetric) => {
    const indicatorReport: AcademicReport = {
      id: `report_${metric.id}`,
      type: 'general_trajectory',
      title: `Ficha Técnica Institucional: ${metric.label}`,
      cycle: selectedCycle,
      generationDate: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      executiveSummary: `Ficha técnica macroscópica emitida para el indicador "${metric.label}". La cohorte evaluada registra una tasa agregada del ${metric.mainValueProb} (${metric.mainValueRatio}). ${metric.description}`,
      keyInsights: [
        `Tasa agregada del indicador: ${metric.mainValueProb}`,
        `Expresión en razón poblacional: ${metric.mainValueRatio}`,
        `Evolución histórica registrada: ${metric.change || 'Estable'}`,
        `Volumen de desglose evaluado: ${metric.details.length} elementos sin PII estudiantil.`,
      ],
      columns: [
        { key: 'label', label: 'Concepto / Segmento Evaluado', align: 'left' },
        { key: 'formattedValue', label: 'Tasa / Valor', align: 'center' },
        { key: 'subValue', label: 'Razón / Alcance', align: 'center' },
        { key: 'notes', label: 'Diagnóstico Curricular', align: 'left' },
      ],
      rows: metric.details.map((d) => ({
        label: d.label,
        formattedValue: d.formattedValue,
        subValue: d.subValue || 'N/A',
        notes: d.notes || 'En seguimiento estándar',
      })),
    };
    setSelectedMetric(null);
    setActiveReportModal(indicatorReport);
  };

  const handleDownloadReport = (format: 'PDF' | 'CSV', title: string) => {
    showToast(`Descarga completada: ${title} (${format})`);
  };

  if (isLoadingSession) {
    return (
      <div className={styles.root}>
        <div className={styles.bgMesh} />
        <div className={styles.loadingScreen}>
          <div className={styles.spinnerLarge} />
          <span>Iniciando Portal de Supervisión PumaIA...</span>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="page login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-mesh" />
        <Navbar />
        <div className="gold-line" />

        <main className="login-main">
          <div className="login-hero">
            <h1 className="login-title">
              Acceso de Supervisión<br />Directiva
            </h1>
            <p className="login-subtitle">
              Área de gestión y analítica académica para la Coordinación de Matemáticas Aplicadas y Computación.
            </p>
          </div>

          <AdminLoginModal onLoginSuccess={handleLoginSuccess} />
        </main>

        <div className="gold-line" style={{ marginTop: 'auto' }} />
        <AppFooter variant="dark" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <AdminHeader
        user={adminUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        {activeTab === 'dashboard' && (
          <>
            <AdminPdfDashboard />

            <div style={{ marginTop: '20px' }}>
              <AdminReportsBar onGenerateGeneralReport={handleGenerateGeneralReport} />
            </div>
          </>
        )}

        {activeTab === 'calendar' && (
          <AdminScheduleCalendar
            scheduleItems={scheduleItems}
            onSelectScheduleItem={setSelectedScheduleItem}
          />
        )}
      </main>

      <AdminMetricDetailModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        onGenerateIndividualReport={handleGenerateIndicatorReport}
      />

      <AdminReportModal
        report={activeReportModal}
        onClose={() => setActiveReportModal(null)}
        onDownload={handleDownloadReport}
      />

      <AdminScheduleDetailModal
        item={selectedScheduleItem}
        onClose={() => setSelectedScheduleItem(null)}
      />

      {toastMessage && (
        <div className={styles.toastNotification}>
          <span className={styles.toastIcon}>✔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <AppFooter variant="dark" />
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function FilterCrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
