'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import { gradeService, Subject } from '../../services/grades.service';
import { updateInfoService } from '../../services/updateInfo.service';
import styles from './ProfilePage.module.css';
import AcademicHistoryManager from "../update-info/AcademicHistoryManager";
import ExperienceCard from '../profile/ExperienceCard';
import PageLoader from '../loaders/PageLoader';
import InlineLoader from '../loaders/InlineLoader';

export default function ProfilePage() {
  const router = useRouter();

  // --- ESTADOS DE DATOS REALES ---
  const [user, setUser] = useState<any>(null);
  const [profileSummary, setProfileSummary] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null); // <-- Nuevo estado para el informe de IA

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAI, setLoadingAI] = useState(true); // <-- Cargador independiente para la IA

  // --- ESTADOS DE UI ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setPhone(parsedUser.telefono || '');
    }
    setLoadingUser(false);

    const fetchProfileAndHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingHistory(false);
        setLoadingProfile(false);
        setLoadingAI(false);
        return;
      }
      try {
        // Los tres fetch corren en paralelo optimizando la velocidad del ruteador
        const [gradesData, summaryData, aiData] = await Promise.allSettled([
          gradeService.getMyGrades(token),
          updateInfoService.getProfileSummary(),
          updateInfoService.getSavedAiAnalysis() // <-- Descarga real de Supabase
        ]);

        if (gradesData.status === 'fulfilled') setSubjects(gradesData.value);
        setLoadingHistory(false);

        if (summaryData.status === 'fulfilled') setProfileSummary(summaryData.value);
        setLoadingProfile(false);

        if (aiData.status === 'fulfilled' && aiData.value.hasAnalysis) {
          setAiAnalysis(aiData.value.data);
        }
        setLoadingAI(false); // ← Análisis de IA resuelto

      } catch (error) {
        console.error("Error al cargar la información del perfil:", error);
        setLoadingHistory(false);
        setLoadingProfile(false);
        setLoadingAI(false);
      }
    };

    fetchProfileAndHistory();
  }, []);

  if (loadingUser) return <PageLoader message="Cargando tu perfil..." />;
  if (!user) return <PageLoader message="Verificando sesión..." />;

  // Función auxiliar para extraer el número entero del string "Match: 95%."
  const extractMatchNumber = (desc: string): string => {
    if (!desc) return '0';
    const match = desc.match(/Match:\s*(\d+)%/i);
    return match ? match[1] : '0';
  };

  // Preparamos las 3 primeras rutas profesionales mapeándolas dinámicamente si existen
  const topThreeCareers = aiAnalysis ? [
    { title: aiAnalysis.optionA, desc: aiAnalysis.descriptionA },
    { title: aiAnalysis.optionB, desc: aiAnalysis.descriptionB },
    { title: aiAnalysis.optionC, desc: aiAnalysis.descriptionC },
  ].filter(c => c.title) : [];

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={user.initial} />
      <div className={styles.goldLine} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          <HamburgerIcon />
        </button>
        <span className={styles.toolbarTitle}>Mi perfil</span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>

        {/* Hero de perfil */}
        <section className={styles.heroCard}>
          <div className={styles.avatarWrap}>
            {user.fotoPerfil ? (
              <img src={user.fotoPerfil} alt="Foto" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarInitial}>{user.initial}</div>
            )}
            <button className={styles.avatarEditBtn} title="Cambiar foto">
              <CameraIcon />
            </button>
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{user.nombre}</h1>
            <p className={styles.heroCareer}>{user.carrera}</p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>{user.semestre}</span>
              <span className={styles.badge}>Cuenta: {user.cuenta}</span>
            </div>
          </div>
          <button
            className={styles.editInfoBtn}
            onClick={() => router.push('/update-info')}
          >
            <EditIcon /> Actualizar información
          </button>
        </section>

        <div className={styles.grid}>

          {/* Columna izquierda */}
          <div className={styles.colLeft}>

            {/* Información de contacto */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><PersonIcon /> Información de contacto</h2>
                <button className={styles.cardEditBtn}
                  onClick={() => setEditingContact((v) => !v)}>
                  {editingContact ? 'Guardar' : <EditIcon />}
                </button>
              </div>
              <div className={styles.fieldList}>
                <Field label="Correo institucional" value={user.email || `${user.cuenta}@pcpuma.acatlan.unam.mx`} />
                <Field
                  label="Teléfono"
                  value={phone || '—'}
                  editing={editingContact}
                  onChange={setPhone}
                  placeholder="55 1234 5678"
                />
              </div>
            </div>

            {/* Información académica */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><BookIcon /> Información académica</h2>
              </div>
              <div className={styles.fieldList}>
                <Field label="Carrera" value={user.carrera} />
                <Field label="Semestre" value={user.semestre} />
                <Field label="Número de cuenta" value={user.cuenta} />
                <Field label="Facultad" value="FES Acatlán" />
                <Field label="Universidad" value="UNAM" />
              </div>
            </div>

            {/* Tarjeta relacional de Experiencia */}
            <div style={{ position: 'relative' }}>
              {loadingProfile && (
                <InlineLoader variant="overlay" message="Cargando experiencia..." />
              )}
              <ExperienceCard data={profileSummary} />
            </div>
          </div>

          {/* Columna derecha */}
          <div className={styles.colRight}>

            {/* ── SECCIÓN DINÁMICA: Ruta profesional sugerida (MUESTRA LAS 3 MEJORES) ── */}
            <div className={styles.card} style={{ position: 'relative' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><StarIcon /> Rutas sugeridas por PumaIA</h2>
                <button className={styles.cardLinkBtn}
                  onClick={() => router.push('/update-info')}>
                  Ver análisis completo →
                </button>
              </div>

              {loadingAI && (
                <InlineLoader variant="overlay" message="Calculando compatibilidades..." />
              )}

              {!loadingAI && topThreeCareers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {topThreeCareers.map((ruta, idx) => {
                    const pct = extractMatchNumber(ruta.desc);
                    return (
                      <div key={idx} className={styles.topCareer} style={{ borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < 2 ? '16px' : '0' }}>
                        <div className={styles.topCareerHeader}>
                          <span className={styles.topCareerTitle}>{ruta.title}</span>
                          <span className={styles.topCareerMatch}>{pct}%</span>
                        </div>
                        <div className={styles.matchBar}>
                          <div className={styles.matchFill} style={{ width: `${pct}%` }} />
                        </div>
                        <p className={styles.topCareerDesc}>{ruta.desc}</p>
                      </div>
                    );
                  })}
                </div>
              ) : !loadingAI && (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '12px' }}>
                    Aún no has generado tu primer análisis profesional con Inteligencia Artificial.
                  </p>
                  <button
                    className={styles.cardLinkBtn}
                    style={{ background: 'rgba(201,168,76,0.1)', padding: '6px 14px', borderRadius: '6px', color: '#c9a84c' }}
                    onClick={() => router.push('/update-info')}
                  >
                    Generar análisis ahora
                  </button>
                </div>
              )}
            </div>

            {/* Historial Académico */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Historial Académico</h2>
              </div>
              {loadingHistory && (
                <InlineLoader variant="overlay" message="Cargando materias..." />
              )}

              {!loadingHistory && subjects.length > 0 ? (
                <AcademicHistoryManager
                  initialSubjects={subjects}
                  isCollapsible={false}
                />
              ) : !loadingHistory && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  Aún no has subido tu historial académico.
                </p>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponentes auxiliares e iconos se mantienen exactamente iguales...

// ── Sub-componentes ────────────────────────────────────
type FieldProps = {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
};

function Field({ label, value, editing, onChange, placeholder }: FieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {editing && onChange ? (
        <input
          className={styles.fieldInput}
          value={value === '—' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <span className={styles.fieldValue}>{value}</span>
      )}
    </div>
  );
}

type ActivityItemProps = { icon: string; text: string; date: string };
function ActivityItem({ icon, text, date }: ActivityItemProps) {
  return (
    <li className={styles.activityItem}>
      <span className={styles.activityIcon}>{icon}</span>
      <span className={styles.activityText}>{text}</span>
      <span className={styles.activityDate}>{date}</span>
    </li>
  );
}

// ── Íconos ────────────────────────────────────────────
function HamburgerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function CameraIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
}
function PersonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
}
function BookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}
function StarIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function BoltIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
