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
import { LOGO_ORACLE, LOGO_BBVA, LOGO_CHUTAZO, LOGO_IBM, LOGO_SANTANDER, LOGO_SLIM } from '../../utils/img/assets';
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
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(initialProfile || null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('student_profile');

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else if (initialUser?.cuenta) {
      studentService.getProfileByAccount(initialUser.cuenta)
        .then(data => setProfile(data));
    }
  }, [initialUser]);
  const goToChat = () => router.push('/chat');
  const goToSettings = () => router.push('/settings');
  const goToProfile = () => router.push('/profile');
  const goToUpdateInfo = () => router.push('/update-info');
  const goToExchange = () => router.push('/exchange');
  const goToHome = () => router.push('/home');

  // Si no hay perfil aún, mostramos la inicial del login o una por defecto
  const userInitial = profile?.fullName?.charAt(0) || initialUser?.initial || "U";
  const displayName = profile?.fullName || initialUser?.nombre || "Usuario";
  if (!initialUser) return <PageLoader message="Iniciando PumaIA..." />;

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
        <section className={styles.section}>
          <FeatureCards
            onPumaIA={goToChat}
            onExchange={goToExchange}
            onUpdate={goToUpdateInfo}
          />        </section>

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