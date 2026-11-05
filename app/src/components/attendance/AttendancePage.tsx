'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import AppFooter from '../AppFooter';
import AttendanceScanner from './AttendanceScanner';
import StudentScheduleCalendar from './StudentScheduleCalendar';
import { scheduleService, StudentScheduleData } from '../../services/schedule.service';
import { attendanceService, AttendanceRecordResponse } from '../../services/attendance.service';
import { authService } from '../../services/auth.service';
import { getAuthToken } from '../../utils/api';
import styles from './AttendancePage.module.css';
import InlineLoader from '../loaders/InlineLoader';

type ActiveTab = 'scanner' | 'calendar';

export default function AttendancePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [userInitial, setUserInitial] = useState('U');

  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<StudentScheduleData | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordResponse[]>([]);

  // Estado para gestión del enlace de prueba local de asistencia
  const [autoAttendance, setAutoAttendance] = useState<{
    status: 'idle' | 'recording' | 'success' | 'already' | 'error' | 'need_auth';
    courseName?: string;
    group?: string;
    markedAt?: string;
    errorMsg?: string;
    sessionId?: string;
    secret?: string;
  }>({ status: 'idle' });

  const loadData = async () => {
    try {
      // 1. Cargar usuario de localStorage
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const initial = parsed?.initial || parsed?.user?.initial || parsed?.nombre?.charAt(0) || 'L';
          setUserInitial(initial.toUpperCase());
        } catch (_) {}
      }

      // 2. Cargar horario actual del alumno desde el backend oficial (fallback a almacenamiento local)
      try {
        const remoteSchedule = await attendanceService.getMySchedule();
        if (remoteSchedule && Array.isArray(remoteSchedule.subjects) && remoteSchedule.subjects.length > 0) {
          setScheduleData(remoteSchedule);
        } else {
          const schedule = scheduleService.getStudentSchedule();
          setScheduleData(schedule);
        }
      } catch (_) {
        const schedule = scheduleService.getStudentSchedule();
        setScheduleData(schedule);
      }

      // 3. Cargar asistencias registradas desde el backend oficial
      try {
        const records = await attendanceService.getMyAttendance();
        setAttendanceRecords(records || []);
      } catch (err) {
        console.warn('Aviso al recuperar asistencias del backend:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Detección automática del enlace de prueba local de asistencia (?sessionId=...&secret=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramSessionId = urlParams.get('sessionId');
      const paramSecret = urlParams.get('secret');
      const paramCourse =
        urlParams.get('courseName') || urlParams.get('course') || 'Asignatura UNAM';
      const paramGroup = urlParams.get('group') || 'Grupo asignado';

      if (paramSessionId && paramSecret) {
        const token = getAuthToken();
        if (!token) {
          setAutoAttendance({
            status: 'need_auth',
            courseName: paramCourse,
            group: paramGroup,
            sessionId: paramSessionId,
            secret: paramSecret,
          });
          return;
        }

        setAutoAttendance({
          status: 'recording',
          courseName: paramCourse,
          group: paramGroup,
          sessionId: paramSessionId,
          secret: paramSecret,
        });

        attendanceService
          .recordAttendance({ sessionId: paramSessionId, secret: paramSecret })
          .then((res) => {
            const timeStr = res.record?.markedAt
              ? new Date(res.record.markedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

            const officialSub =
              res.record?.session?.section?.subject?.subject ||
              res.record?.session?.section?.subject?.name ||
              paramCourse;
            const officialGrp = res.record?.session?.section?.groupCode
              ? `Grupo ${res.record.session.section.groupCode}`
              : paramGroup;

            setAutoAttendance({
              status: 'success',
              courseName: officialSub,
              group: officialGrp,
              markedAt: timeStr,
            });

            loadData();
            window.history.replaceState({}, '', window.location.pathname);
          })
          .catch((err: any) => {
            const msg = err.message || '';
            if (
              msg.includes('Ya has registrado') ||
              msg.includes('registrado tu asistencia')
            ) {
              setAutoAttendance({
                status: 'already',
                courseName: paramCourse,
                group: paramGroup,
                markedAt: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              });
              loadData();
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              setAutoAttendance({
                status: 'error',
                courseName: paramCourse,
                group: paramGroup,
                errorMsg: msg || 'No se pudo confirmar tu asistencia.',
              });
            }
          });
      }
    }
  }, []);

  const handleQuickStudentLogin = async () => {
    if (!autoAttendance.sessionId || !autoAttendance.secret) return;
    const currentSessionId = autoAttendance.sessionId;
    const currentSecret = autoAttendance.secret;
    const currentCourse = autoAttendance.courseName || 'Asignatura UNAM';
    const currentGroup = autoAttendance.group || 'Grupo asignado';

    setAutoAttendance((prev) => ({ ...prev, status: 'recording' }));
    try {
      const loginRes = await authService.login({
        email: '321191399@pcpuma.acatlan.unam.mx',
        password: 'Alumno2026*',
      });
      const token = loginRes.token || loginRes.accessToken || loginRes.access_token;
      if (token) {
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
        if (loginRes.user) {
          localStorage.setItem('userData', JSON.stringify(loginRes.user));
          const initial =
            loginRes.user.initial || loginRes.user.nombre?.charAt(0) || 'L';
          setUserInitial(initial.toUpperCase());
        }
      }

      const recRes = await attendanceService.recordAttendance({
        sessionId: currentSessionId,
        secret: currentSecret,
      });

      const timeStr = recRes.record?.markedAt
        ? new Date(recRes.record.markedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

      const officialSub =
        recRes.record?.session?.section?.subject?.subject ||
        recRes.record?.session?.section?.subject?.name ||
        currentCourse;
      const officialGrp = recRes.record?.session?.section?.groupCode
        ? `Grupo ${recRes.record.session.section.groupCode}`
        : currentGroup;

      setAutoAttendance({
        status: 'success',
        courseName: officialSub,
        group: officialGrp,
        markedAt: timeStr,
      });
      loadData();
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.includes('Ya has registrado') ||
        msg.includes('registrado tu asistencia')
      ) {
        setAutoAttendance({
          status: 'already',
          courseName: currentCourse,
          group: currentGroup,
          markedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        loadData();
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        setAutoAttendance({
          status: 'error',
          courseName: currentCourse,
          group: currentGroup,
          errorMsg: msg || 'No se pudo autenticar al alumno para la asistencia.',
        });
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={userInitial} />
      <div className={styles.goldLine} />

      {/* Toolbar con menú hamburguesa */}
      <div className={styles.toolbar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <HamburgerIcon />
        </button>
        <span className={styles.toolbarGreeting}>
          ASISTENCIA con PUMAIA
        </span>
      </div>

      <HomeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>
        {/* Cabecera oficial */}
        <div className={styles.heroHeader}>
          <h1 className={styles.pageTitle}>Asistencia Escolar con PumaIA</h1>
          <p className={styles.pageSubtitle}>
            Escanea el código QR que proyecta tu profesor en el aula para validar tu asistencia
            y revisa tu horario semanal con el estatus de tus clases en tiempo real.
          </p>
        </div>

        {/* Banner de procesamiento o resultado del enlace de prueba */}
        {autoAttendance.status === 'recording' && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div className={styles.goldSpinner} style={{ width: '22px', height: '22px' }} />
            <div>
              <strong style={{ color: '#ecd083' }}>Validando enlace de asistencia...</strong>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {autoAttendance.courseName} · {autoAttendance.group}
              </div>
            </div>
          </div>
        )}

        {(autoAttendance.status === 'success' || autoAttendance.status === 'already') && (
          <div className={styles.autoAttendanceAlert}>
            <div className={styles.autoAlertHeader}>
              <div className={styles.autoAlertIcon}>✓</div>
              <div className={styles.autoAlertTitles}>
                <h3 className={styles.autoAlertTitle}>
                  {autoAttendance.status === 'success'
                    ? '¡Asistencia Registrada Exitosamente!'
                    : 'Asistencia Ya Registrada'}
                </h3>
                <span className={styles.autoAlertSubtitle}>
                  {autoAttendance.status === 'success'
                    ? 'Tu registro ha sido validado mediante el enlace de prueba y confirmado en la base de datos.'
                    : 'Tu asistencia ya figuraba como confirmada en esta sesión de clase.'}
                </span>
              </div>
            </div>

            <div className={styles.successDetailsBox}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Asignatura:</span>
                <span className={styles.detailValue}>{autoAttendance.courseName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Grupo:</span>
                <span className={styles.detailValue}>{autoAttendance.group}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Hora de verificación:</span>
                <span className={styles.detailValue}>{autoAttendance.markedAt}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Estatus oficial:</span>
                <span className={styles.detailValue} style={{ color: '#4ade80' }}>
                  Presente (Validado vía Enlace de Prueba)
                </span>
              </div>
            </div>

            <div className={styles.autoActionRow}>
              <button
                type="button"
                className={styles.btnViewCalendarDirect}
                onClick={() => {
                  setActiveTab('calendar');
                  setAutoAttendance({ status: 'idle' });
                }}
              >
                📅 Ver en Mi Calendario
              </button>
              <button
                type="button"
                className={styles.btnDismissAlert}
                onClick={() => setAutoAttendance({ status: 'idle' })}
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {autoAttendance.status === 'error' && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <strong style={{ color: '#fca5a5' }}>Error al registrar asistencia:</strong>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                {autoAttendance.errorMsg}
              </div>
            </div>
            <button
              type="button"
              className={styles.btnDismissAlert}
              onClick={() => setAutoAttendance({ status: 'idle' })}
            >
              ✕ Cerrar
            </button>
          </div>
        )}

        {autoAttendance.status === 'need_auth' && (
          <div className={styles.authNeededCard}>
            <div className={styles.authNeededHeader}>
              <div className={styles.authNeededIcon}>🔒</div>
              <div className={styles.autoAlertTitles}>
                <h3 className={styles.autoAlertTitle}>Autenticación Requerida</h3>
                <span className={styles.autoAlertSubtitle}>
                  Para confirmar tu asistencia a <strong>{autoAttendance.courseName}</strong> ({autoAttendance.group}), inicia sesión con tu cuenta de estudiante.
                </span>
              </div>
            </div>

            <div className={styles.autoActionRow}>
              <button
                type="button"
                className={styles.btnQuickAuthAction}
                onClick={handleQuickStudentLogin}
              >
                ⚡ Iniciar sesión como Alumno de Prueba (321191399) y Confirmar
              </button>
              <button
                type="button"
                className={styles.btnDismissAlert}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Ir a pantalla de inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* Barra de pestañas */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'scanner' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <CameraTabIcon />
            <span>Pasar asistencia</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarTabIcon />
            <span>Mi calendario</span>
            {scheduleData && scheduleData.subjects.length > 0 && (
              <span className={styles.tabBadge}>{scheduleData.subjects.length} materias</span>
            )}
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        {loading ? (
          <InlineLoader message="Cargando tu horario y registro de asistencias..." />
        ) : activeTab === 'scanner' ? (
          <AttendanceScanner
            onSuccess={() => {
              loadData();
            }}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        ) : (
          <div>
            {scheduleData && scheduleData.subjects.length > 0 ? (
              <StudentScheduleCalendar
                subjects={scheduleData.subjects}
                attendanceRecords={attendanceRecords}
              />
            ) : (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px dashed rgba(201, 168, 76, 0.35)',
                  borderRadius: '16px',
                  padding: '36px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  No tienes un horario cargado actualmente
                </h3>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', maxWidth: '480px' }}>
                  Para visualizar tu calendario semanal de clases y registrar asistencias por materia,
                  sube tu comprobante de inscripción en PDF desde la sección <strong>Actualizar información</strong>.
                </p>
                <a
                  href="/update-info"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 22px',
                    background: 'rgba(201, 168, 76, 0.2)',
                    border: '1px solid rgba(201, 168, 76, 0.5)',
                    borderRadius: '8px',
                    color: '#ffd54f',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    marginTop: '8px',
                  }}
                >
                  Ir a subir comprobante de horario →
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter variant="dark" />
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CameraTabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CalendarTabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

