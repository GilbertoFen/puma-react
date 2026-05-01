'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import UpdateHero from './UpdateHero';
import QuestionnaireSection from './QuestionnaireSection';
import ReportSection from './ReportSection';
import DocumentsSection from './DocumentsSection';
import { MOCK_ANSWERS, MOCK_REPORT, MOCK_DOCUMENTS, MOCK_USER } from '../../mock/mockData';
import styles from './UpdateInfoPage.module.css';

type Tab = 'questionnaire' | 'report' | 'documents';

const TABS: { id: Tab; label: string }[] = [
  { id: 'questionnaire', label: 'Mis respuestas' },
  { id: 'report',        label: 'Análisis profesional' },
  { id: 'documents',     label: 'Documentos' },
];

export default function UpdateInfoPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('questionnaire');
  const [heroVisible, setHeroVisible] = useState(true);

  // Al hacer click en el hero se colapsa y se muestra el contenido
  const handleHeroDismiss = () => setHeroVisible(false);

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={MOCK_USER.initial} />
      <div className={styles.goldLine} />

      {/* Toolbar con hamburguesa */}
      <div className={styles.toolbar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <HamburgerIcon />
        </button>
        <span className={styles.toolbarTitle}>Actualizar información</span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia') router.push('/chat');
          if (section === 'perfil') router.push('/profile');
          if (section === 'ajustes') router.push('/settings');
        }}
      />

      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>
        {/* Hero — visible al entrar, se colapsa al hacer click */}
        {heroVisible && <UpdateHero onDismiss={handleHeroDismiss} />}

        {/* Tabs de navegación */}
        {!heroVisible && (
          <div className={styles.content}>
            <nav className={styles.tabs}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className={styles.tabContent}>
              {activeTab === 'questionnaire' && (
                <QuestionnaireSection answers={MOCK_ANSWERS} />
              )}
              {activeTab === 'report' && (
                <ReportSection report={MOCK_REPORT} />
              )}
              {activeTab === 'documents' && (
                <DocumentsSection documents={MOCK_DOCUMENTS} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
// importarlo como funcion 
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
