'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from './HomeDrawer';
import FeatureCards from './FeatureCards';
import Carousel from './Carousel';
import { studentService } from '../../services/student.service';
import { StudentProfile } from '../../types';
import styles from './HomePage.module.css';
import PageLoader from '../loaders/PageLoader';
import AppFooter from '../AppFooter';
import { LOGO_ORACLE, LOGO_BBVA, LOGO_CHUTAZO, LOGO_IBM, LOGO_SANTANDER, LOGO_SLIM, AI_LOGO } from '../../utils/img/assets';
import { updateInfoService } from '../../services/updateInfo.service';
const COMPANIES_DATA = [
  { id: 'oracle', name: 'ORACLE', logo: LOGO_ORACLE },
  { id: 'bbva', name: 'BBVA', logo: LOGO_BBVA },
  { id: 'chutazo', name: 'CHUTAZO OFICIAL', logo: LOGO_CHUTAZO },
  { id: 'santander', name: 'SANTANDER', logo: LOGO_SANTANDER },
  { id: 'ibm', name: 'IBM', logo: LOGO_IBM },
  { id: 'slim', name: 'FUNDACION SLIM', logo: LOGO_SLIM },
];
export default function HomePage({
  user: initialUser,
  initialProfile
}: {
  user: any,
  initialProfile?: StudentProfile | null
}) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(initialProfile || null);
  const [user, setUser] = useState<any>(null);
  const userInitial = profile?.fullName?.charAt(0) || initialUser?.initial || "U";
  const displayName = profile?.fullName || initialUser?.nombre || "Usuario";
  if (!initialUser) return <PageLoader message="Iniciando PumaIA..." />;


  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ejecutamos todo en paralelo 
        await Promise.all([
          fetch('https://server-genai.onrender.com', { method: 'GET' }).catch(() => { }),
          (async () => {
            const summary = await updateInfoService.getProfileSummary();
            const local = JSON.parse(localStorage.getItem('userData') || '{}');
            const updated = { ...local, ...summary };
            localStorage.setItem('userData', JSON.stringify(updated));
            setUser(updated);
            window.dispatchEvent(new Event('avatarUpdated'));
          })(),
          initialUser?.cuenta ? studentService.getProfileByAccount(initialUser.cuenta).then(setProfile) : Promise.resolve()
        ]);
      } catch (err) {
        console.error("Error al inicializar la app:", err);
      } finally {
        setIsReady(true);
      }
    };

    if (initialUser) {
      initializeApp();
    } else {
      router.push('/');
    }
  }, [initialUser, router]);
  if (!isReady) {
    return <PageLoader message="Cargando contenido y recopilando datos..." />;
  }

  const goToChat = () => router.push('/chat');
  const goToUpdateInfo = () => router.push('/update-info');
  const goToExchange = () => router.push('/exchange');
  const goToAnalyze = () => router.push('/analyze');
  const goToAbout= () => router.push('/about-page');

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar
        showAcatlan
        userInitial={userInitial}
      />
      <div className={styles.goldLine} />

      <div className={styles.toolbar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <HamburgerIcon />
        </button>
        <span className={styles.toolbarGreeting}>
          Bienvenido al portal {displayName}
        </span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {drawerOpen && (
        <div
          className={styles.overlay}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <main className={styles.main}>
        {/* ── Sección hero / descripción ── */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>

            {/* Columna izquierda — texto */}
            <div className={styles.heroLeft}>
              <h1 className={styles.heroTitle}>
                Tu Orientador Profesional<br />de la FES Acatlán
              </h1>
              <p className={styles.heroSubtitle}>
                PumaIA analiza tu perfil académico, te orienta en tu trayectoria
                profesional y responde tus dudas en tiempo real. Todo en un solo lugar,
                diseñado por y para estudiantes de la UNAM.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Rutas profesionales personalizadas</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Respuestas en tiempo real</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Orientado a tu perfil</span>
                </div>
              </div>
            </div>

            {/* Columna derecha — logo PumaIA */}
            <div className={styles.heroRight}>
              <div className={styles.heroPoweredLogoWrap}>
                <img
                  src={AI_LOGO}
                  alt="PumaIA"
                  className={styles.heroPoweredLogo}
                  onClick={goToAbout}
                />
              </div>
              <div className={styles.heroPoweredText}>
                <span className={styles.heroPoweredBrand}>    PUMA IA</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <FeatureCards
            onPumaIA={goToChat}
            onExchange={goToExchange}
            onUpdate={goToUpdateInfo}
            onAnalyze={goToAnalyze}
          />
        </section>

        <section className={styles.section}>
          <Carousel />
        </section>

        {/* ── SECCIÓN DE LOGOS DE EMPRESAS DINÁMICA ── */}
        <section className={styles.companiesSection}>
          <h2 className={styles.companiesTitle}>Empresas que confían en PUMAIA</h2>
          <div className={styles.companiesGrid}>
            {COMPANIES_DATA.map((company) => (
              <div key={company.id} className={styles.companyPlaceholder}>
                <img
                  src={company.logo}
                  alt={`Logo de ${company.name}`}
                  className={styles.companyLogoImg}
                  title={company.name}
                />
              </div>
            ))}
          </div>
        </section>

      </main>
      <AppFooter variant="dark" />

    </div>
  );
}

export function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}