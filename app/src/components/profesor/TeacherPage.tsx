'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './TeacherPage.module.css';
import '../../pages/LoginPage.css';
import {
  TeacherProfile,
  TeacherCourse,
  AttendanceStatus,
} from './teacherTypes';
import { FALLBACK_TEACHER_STUDENTS } from './teacherMockData';
import { TeacherAttendanceService } from './teacherAttendanceService';
import { fullName } from '../../context/SessionContext';
import { usePortalGuard } from '../../hooks/usePortalGuard';
import Navbar from '../Navbar';
import TeacherLoginModal from './TeacherLoginModal';
import TeacherHeader from './TeacherHeader';
import TeacherScheduleCalendar from './TeacherScheduleCalendar';
import TeacherGroupsPanel from './TeacherGroupsPanel';
import TeacherQrModal from './TeacherQrModal';
import TeacherStudentsModal from './TeacherStudentsModal';
import AppFooter from '../AppFooter';

export default function TeacherPage() {
  // Sesión única (SessionContext). Sin rol PROFESSOR, el guard manda a la ruta que corresponde.
  const session = usePortalGuard('/profesores');
  const isLoadingSession = session.status === 'loading' || session.redirecting;
  const sessionUser = session.allowed ? session.user : null;
  const teacherProfile = useMemo<TeacherProfile | null>(
    () =>
      sessionUser
        ? {
            id: sessionUser.professor?.id ?? '',
            accountNumber: 'DOCENTE',
            name: fullName(sessionUser),
            email: sessionUser.email,
            role: 'Profesor',
            department: 'Matemáticas Aplicadas y Computación',
            institution: 'FES Acatlán · UNAM',
            semester: '',
            avatarInitial: (sessionUser.name.charAt(0) || 'P').toUpperCase(),
            courses: [],
          }
        : null,
    [sessionUser],
  );
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [qrModalCourse, setQrModalCourse] = useState<TeacherCourse | null>(null);
  const [studentsModalCourse, setStudentsModalCourse] = useState<TeacherCourse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sincronización con los grupos reales del profesor en /api/sections
  useEffect(() => {
    if (!teacherProfile) return;

    setIsLoadingSections(true);
    TeacherAttendanceService.fetchProfessorSections(teacherProfile.id)
      .then((sections) => {
        if (!Array.isArray(sections) || sections.length === 0) return;

        const dayNameMap: Record<number, { day: any; index: number }> = {
          1: { day: 'Lunes', index: 1 },
          2: { day: 'Martes', index: 2 },
          3: { day: 'Miércoles', index: 3 },
          4: { day: 'Jueves', index: 4 },
          5: { day: 'Viernes', index: 5 },
          6: { day: 'Sábado', index: 6 },
          7: { day: 'Domingo', index: 7 },
        };

        const mappedCourses: TeacherCourse[] = sections.map((sec: any, idx: number) => {
          const meetings = sec.meetings || [];
          const daysList = meetings
            .map((m: any) => dayNameMap[m.weekday]?.day)
            .filter(Boolean);
          const daysText = daysList.join(' y ') || 'Días de clase';

          let startTimeText = '20:00';
          let endTimeText = '22:00';
          let startH = 20;
          let endH = 22;

          if (meetings.length > 0) {
            const s = new Date(meetings[0].startTime);
            const e = new Date(meetings[0].endTime);
            startH = s.getUTCHours();
            endH = e.getUTCHours();
            startTimeText = `${startH.toString().padStart(2, '0')}:${s.getUTCMinutes().toString().padStart(2, '0')}`;
            endTimeText = `${endH.toString().padStart(2, '0')}:${e.getUTCMinutes().toString().padStart(2, '0')}`;
          }

          const scheduleText = `${daysText} · ${startTimeText} - ${endTimeText} hrs`;
          const displayTime = `${startTimeText} - ${endTimeText} hrs`;

          const scheduleSlots = meetings.map((m: any) => {
            const info = dayNameMap[m.weekday] || { day: 'Lunes', index: 1 };
            const s = new Date(m.startTime);
            const e = new Date(m.endTime);
            const slotStartH = s.getUTCHours();
            const slotEndH = e.getUTCHours();
            const slotDisplayTime = `${slotStartH.toString().padStart(2, '0')}:${s.getUTCMinutes().toString().padStart(2, '0')} - ${slotEndH.toString().padStart(2, '0')}:${e.getUTCMinutes().toString().padStart(2, '0')} hrs`;
            return {
              day: info.day,
              dayIndex: info.index,
              startHour: slotStartH,
              endHour: slotEndH,
              displayTime: slotDisplayTime,
            };
          });

          // Alumnos inscritos desde la lista oficial del grupo y matrículas
          const studentMap = new Map<string, any>();
          if (Array.isArray(sec.roster)) {
            sec.roster.forEach((r: any) => {
              const stId = r.linkedStudentId || r.id;
              const userObj = r.linkedStudent?.user;
              const name = userObj
                ? `${userObj.lastNameP} ${userObj.lastNameM || ''} ${userObj.name}`.trim()
                : r.fullName;
              studentMap.set(stId, {
                id: stId,
                accountNumber: String(r.accountNumber),
                name,
                currentStatus: 'pendiente' as AttendanceStatus,
              });
            });
          }
          if (Array.isArray(sec.enrollments)) {
            sec.enrollments.forEach((enr: any) => {
              const st = enr.student;
              if (st && !studentMap.has(st.id)) {
                const userObj = st.user;
                const name = userObj
                  ? `${userObj.lastNameP} ${userObj.lastNameM || ''} ${userObj.name}`.trim()
                  : 'Alumno';
                studentMap.set(st.id, {
                  id: st.id,
                  accountNumber: String(st.accountNumber),
                  name,
                  currentStatus: 'pendiente' as AttendanceStatus,
                });
              }
            });
          }

          const students = Array.from(studentMap.values());

          return {
            id: sec.id,
            code: sec.subject?.code ? `MAC-${sec.subject.code}` : `MAC-1${idx + 1}01`,
            name: sec.subject?.subject || sec.subject?.name || 'Asignatura MAC',
            group: `Grupo ${sec.groupCode}`,
            schedule: scheduleText,
            classroom: sec.meetings?.[0]?.room || 'Edificio A-8',
            colorTag: idx % 2 === 0 ? 'gold' : 'blue',
            scheduleSlots,
            students:
              students.length > 0
                ? students
                : FALLBACK_TEACHER_STUDENTS,
          };
        });

        setCourses(mappedCourses);
        setSelectedCourseId((prev) => prev || mappedCourses[0]?.id || '');
        // Ya no se guardan los grupos (con nombres de alumnos) en localStorage.
      })
      .catch((err) => {
        if (err?.message === 'ACCESO_DENEGADO') {
          // La sesión ya no es válida: se vuelve a consultar /me (y, si no hay sesión, se ve la portada).
          void session.reload();
        }
      })
      .finally(() => {
        setIsLoadingSections(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherProfile]);

  const handleLogout = async () => {
    try {
      // Limpia el caché de grupos de versiones anteriores del portal.
      if (teacherProfile?.id) localStorage.removeItem(`pumaia_teacher_courses_${teacherProfile.id}`);
      await session.logout();
    } catch (e) {
      console.warn('Error al cerrar sesión docente:', e);
    }
    setCourses([]);
    setSelectedCourseId('');
    setQrModalCourse(null);
    setStudentsModalCourse(null);
    showToast('Sesión de profesor cerrada.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleUpdateStudentStatus = (
    courseId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    const backendStatusMap: Record<AttendanceStatus, 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'> = {
      presente: 'PRESENT',
      falta: 'ABSENT',
      pendiente: 'EXCUSED',
    };
    TeacherAttendanceService.updateAttendanceRecord(
      studentId,
      backendStatusMap[status],
      'Actualización manual desde Portal Docente',
    ).catch(() => {});

    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          students: c.students.map((st) => {
            if (st.id !== studentId) return st;
            return { ...st, currentStatus: status };
          }),
        };
      })
    );
  };

  const handleResetStudentAttendance = async (courseId: string, studentId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          students: c.students.map((st) => {
            if (st.id !== studentId) return st;
            return { ...st, currentStatus: 'pendiente' as AttendanceStatus };
          }),
        };
      })
    );
    setToastMessage('Asistencia revertida para pruebas. El alumno puede volver a registrarse.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetAllAttendances = async (courseId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          students: c.students.map((st) => ({
            ...st,
            currentStatus: 'pendiente' as AttendanceStatus,
          })),
        };
      })
    );
    setToastMessage('Todas las asistencias han sido reiniciadas para pruebas.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStudentScannedFromQr = (studentId: string) => {
    if (!qrModalCourse) return;
    handleUpdateStudentStatus(qrModalCourse.id, studentId, 'presente');
  };

  const selectedCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0] || null;

  const studentsCountMap: Record<string, number> = {};
  courses.forEach((c) => {
    studentsCountMap[c.id] = c.students.length;
  });

  if (isLoadingSession) {
    return (
      <div className={styles.root}>
        <div className={styles.bgMesh} />
        <div className={styles.loadingScreen}>
          <div className={styles.goldSpinner} />
          <p className={styles.loadingText}>Iniciando entorno seguro del Portal Docente...</p>
        </div>
      </div>
    );
  }

  if (!teacherProfile) {
    return (
      <div className="page login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-mesh" />
        <Navbar />
        <div className="gold-line" />

        <main className="login-main">
          <div className="login-hero">
            <h1 className="login-title">
              Portal de asistencia<br />para docentes
            </h1>
            <p className="login-subtitle">
              Área dedicada a profesores de Matemáticas Aplicadas y Computación para proyección de códigos QR dinámicos, control de asistencias y calendario de clases.
            </p>
          </div>

          <TeacherLoginModal />
        </main>

        <div className="gold-line" style={{ marginTop: 'auto' }} />
        <AppFooter variant="dark" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <TeacherHeader teacher={teacherProfile} onLogout={handleLogout} />

      <div className={styles.statusBarStrip}>
        <div className={styles.statusBarInner}>
          <div className={styles.statusLeft}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>
              Ciclo Escolar 2027-1
            </span>
          </div>

          <div className={styles.statusRight}>
            <span className={styles.selectedCoursePill}>
              Asignatura activa:{' '}
              {selectedCourse ? (
                <>
                  <strong>{selectedCourse.name}</strong> ({selectedCourse.group})
                </>
              ) : (
                <strong>
                  {isLoadingSections ? 'Cargando asignaturas...' : 'Sin asignaturas'}
                </strong>
              )}
            </span>
          </div>
        </div>
      </div>

      <main className={styles.mainLayout}>
        <div className={styles.columnsContainer}>
          <section className={styles.leftColumnCalendar}>
            <TeacherScheduleCalendar
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={(id) => setSelectedCourseId(id)}
            />
          </section>

          <aside className={styles.rightColumnGroups}>
            <TeacherGroupsPanel
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={(id) => setSelectedCourseId(id)}
              onOpenQrModal={(course) => setQrModalCourse(course)}
              onOpenStudentsModal={(course) => setStudentsModalCourse(course)}
              studentsCountMap={studentsCountMap}
            />
          </aside>
        </div>
      </main>

      {qrModalCourse && (
        <TeacherQrModal
          course={qrModalCourse}
          teacher={teacherProfile}
          students={
            courses.find((c) => c.id === qrModalCourse.id)?.students ||
            qrModalCourse.students
          }
          onClose={() => setQrModalCourse(null)}
          onStudentScanned={handleStudentScannedFromQr}
          onResetStudentAttendance={(stId) =>
            handleResetStudentAttendance(qrModalCourse.id, stId)
          }
          onResetAllAttendances={() =>
            handleResetAllAttendances(qrModalCourse.id)
          }
        />
      )}

      {studentsModalCourse && (
        <TeacherStudentsModal
          course={studentsModalCourse}
          students={
            courses.find((c) => c.id === studentsModalCourse.id)?.students ||
            studentsModalCourse.students
          }
          onClose={() => setStudentsModalCourse(null)}
          onUpdateStatus={(studentId, status) =>
            handleUpdateStudentStatus(studentsModalCourse.id, studentId, status)
          }
          onResetAttendance={(studentId) => {
            TeacherAttendanceService.fetchProfessorSections(teacherProfile.id).then((secs) => {
              // Reset in backend
            }).catch(() => {});
            handleResetStudentAttendance(studentsModalCourse.id, studentId);
          }}
        />
      )}

      {toastMessage && (
        <div className={styles.floatingToast}>
          <span className={styles.toastCheck}>✓</span>
          <span className={styles.toastText}>{toastMessage}</span>
        </div>
      )}

      <AppFooter variant="dark" />
    </div>
  );
}
