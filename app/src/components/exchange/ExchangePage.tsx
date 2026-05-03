'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import ExchangeHero from './ExchangeHero';
import CountrySelector from './CountrySelector';
import LanguageFilter from './LanguageFilter';
import UniversityCard from './UniversityCard';
import { MOCK_UNIVERSITIES } from '../../mock/mockExchangeData';
import { COUNTRIES } from '../../utils/const';
import type { Language } from '../../types/exchange.types';
import styles from './ExchangePage.module.css';

// Nombre simulado del usuario — vendrá del contexto/sesión
const USER_NAME = 'Emmanuel';
const USER_SEMESTRE = '6to';
const USER_SEMESTRE_PREVISTO = '7mo';

export default function ExchangePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtrado — cuando el back esté listo, este useMemo se reemplaza por un fetch
  const filtered = useMemo(() => {
    return MOCK_UNIVERSITIES.filter((u) => {
      const countryOk = selectedCountry === 'all' || u.countryCode === selectedCountry;
      const langOk =
        selectedLanguage === 'all' ||
        u.languages.includes(selectedLanguage as Language);
      return countryOk && langOk;
    });
  }, [selectedCountry, selectedLanguage]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial="E" />
      <div className={styles.goldLine} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          <HamburgerIcon />
        </button>
        {/* Badge "C..." que se ve en el diseño — placeholder del nombre del componente */}
        <span className={styles.componentBadge}>
          <SparkleIcon /> Intercambios
        </span>
        <span className={styles.toolbarGreeting}>
          Bienvenido al portal (no se) Jose Emmanuel Resendiz Lorenzo
        </span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia')     router.push('/chat');
          if (section === 'perfil')     router.push('/profile');
          if (section === 'actualizar') router.push('/update-info');
          if (section === 'ajustes')    router.push('/settings');
        }}
      />
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>
        {/* Hero de introducción */}
        <ExchangeHero />

        {/* CTA principal */}
        <div className={styles.ctaRow}>
          <h2 className={styles.ctaTitle}>¡Comienza el proceso de Intercambio!</h2>
        </div>

        {/* Filtros */}
        <div className={styles.filtersRow}>
          <CountrySelector
            countries={COUNTRIES}
            selected={selectedCountry}
            onChange={setSelectedCountry}
          />
          <LanguageFilter
            selected={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        </div>

        {/* Lista de universidades */}
        <div className={styles.universityList}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay universidades disponibles con los filtros seleccionados.</p>
            </div>
          ) : (
            filtered.map((university) => (
              <UniversityCard
                key={university.id}
                university={university}
                expanded={expandedId === university.id}
                onToggleExpand={() => toggleExpand(university.id)}
                userName={USER_NAME}
                currentSemester={USER_SEMESTRE}
                targetSemester={USER_SEMESTRE_PREVISTO}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <a href="/faqs" className={styles.footerLink}>Preguntas frecuentes</a>
        <a href="#" className={styles.footerLink}>Cosas de footer</a>
      </footer>
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

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
