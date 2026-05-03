'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from './HomeDrawer';
import FeatureCards from './FeatureCards';
import Carousel from './Carousel';
import { studentService } from '../../services/student.service'; // Asegura la ruta
import { StudentProfile } from '../../types'; // Asegura la ruta
import styles from './HomePage.module.css';

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
      setProfile(JSON.parse(savedProfile)); // Lo cargamos instantáneamente
    } else if (initialUser?.cuenta) {
      // Si no hay nada en cache, hacemos la petición como respaldo
      studentService.getProfileByAccount(initialUser.cuenta)
        .then(data => setProfile(data));
    }
  }, [initialUser]);
  const goToChat = () => router.push('/chat');
  const goToSettings = () => router.push('/settings');
  const goToProfile = () => router.push('/profile');
  const goToUpdateInfo = () => router.push('/update-info');
  const goToExchange = () => router.push('/exchange');

  // Si no hay perfil aún, mostramos la inicial del login o una por defecto
  const userInitial = profile?.fullName?.charAt(0) || initialUser?.initial || "U";
  const displayName = profile?.fullName || initialUser?.nombre || "Usuario";

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
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia') goToChat();
          if (section === 'ajustes') goToSettings();
          if (section === 'perfil') goToProfile();
          if (section === 'intercambio') goToExchange();
          if (section === 'actualizar') goToUpdateInfo();
        }}
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

        <section className={styles.companiesSection}>
          <h2 className={styles.companiesTitle}>Empresas que confían en PUMAIA</h2>
          <div className={styles.companiesGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.companyPlaceholder} />
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <a href="#" className={styles.footerLink}>Preguntas frecuentes</a>
          <span className={styles.footerLink}>© 2026 PUMAIA - FES Acatlán</span>
        </footer>
      </main>
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