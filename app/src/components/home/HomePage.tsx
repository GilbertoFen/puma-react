'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from './HomeDrawer';
import FeatureCards from './FeatureCards';
import Carousel from './Carousel';
import styles from './HomePage.module.css';

type User = {
  nombre: string;
  initial: string;
};

const MOCK_USER: User = {
  nombre: 'Jose Emmanuel Resendiz Lorenzo',
  initial: 'E',
};

export default function HomePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const goToChat = () => router.push('/chat');
  const goToSettings = () => router.push('/settings');
  const goToProfile = () => router.push('/profile');
  const goToUpdateInfo = () => router.push('/update-info');
  const goToExchange = () => router.push('/exchange');


  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar
        showAcatlan
        userInitial={"E"}
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
          Bienvenido al portal {MOCK_USER.nombre}
        </span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia') goToChat()
          if (section === 'ajustes') goToSettings();
          if(section==='perfil') goToProfile();
          if(section==='intercambio') goToExchange();
          if(section==='actualizar') goToUpdateInfo();
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
          <FeatureCards onPumaIA={goToChat} />
        </section>

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
          <a href="#" className={styles.footerLink}>Cosas de footer</a>
        </footer>
      </main>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
