'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import UpdateHero from './UpdateHero';
import QuestionnaireSection from './QuestionnaireSection';
import ReportSection from './ReportSection';
import DocumentsSection from './DocumentsSection';
import { MOCK_ANSWERS, MOCK_REPORT, MOCK_DOCUMENTS } from '../../mock/mockData';
import styles from './UpdateInfoPage.module.css';
import { questionnaireService } from '../../services/questionnarie.service';
import { QUESTIONS } from '../../utils/questions';
import { updateInfoService } from '../../services/updateInfo.service';
import InlineLoader from '../loaders/InlineLoader';
import AppFooter from '../AppFooter';
type Tab = 'questionnaire' | 'report' | 'documents';

const TABS: { id: Tab; label: string }[] = [
  { id: 'questionnaire', label: 'Mis respuestas' },
  { id: 'documents', label: 'Documentos' },
];

export default function UpdateInfoPage() {
  const router = useRouter();
  const [userInitial, setUserInitial] = useState<string>('U');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('questionnaire');
  const [heroVisible, setHeroVisible] = useState(true);


  const [realAnswers, setRealAnswers] = useState<any[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    const fetchUserAnswers = async () => {
      try {
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Si tienes guardado parsedUser.initial o parsedUser.user.initial lo inyectamos aquí
            const initial = parsedUser?.initial || parsedUser?.user?.initial || parsedUser?.nombre?.charAt(0) || 'L';
            setUserInitial(initial.toUpperCase());
          } catch (err) {
            console.error("Error al extraer iniciales del localStorage:", err);
          }
        }

        // Trae el objeto estructurado clave-valor { id_pregunta: valor_respuesta }
        const userAnswersObj = await questionnaireService.getAnswers();
        const aiData = await updateInfoService.getSavedAiAnalysis().catch(() => ({ hasAnalysis: false, data: null }))
        await fetch('https://server-genai.onrender.com', { method: 'GET' }).catch(() => { });
        // Mapeamos el arreglo QUESTIONS para armar la lista final combinando pregunta + respuesta
        const formatted = QUESTIONS.map((q) => ({
          questionId: q.id,
          question: q.question,
          answer: userAnswersObj[q.id] ?? 'Sin responder',
          type: q.type
        }));

        setRealAnswers(formatted);
        setAiReport(aiData);
      } catch (error) {
        console.error("Error al obtener las respuestas verdaderas:", error);
      } finally {
        setLoadingAnswers(false);
        setLoadingAI(false)

      }
    };

    fetchUserAnswers();
  }, []);
  const handleUpdateAnswer = (questionId: string, newAnswer: any) => {
    setRealAnswers((prev) => 
      prev.map((ans) => 
        ans.questionId === questionId ? { ...ans, answer: newAnswer } : ans
      )
    );
  };

  // Al hacer click en el hero se colapsa y se muestra el contenido
  const handleHeroDismiss = () => setHeroVisible(false);


  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={userInitial} />
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
      />

      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>
        {/* Hero — visible al entrar, se colapsa al hacer click */}
        {/*heroVisible && <UpdateHero onDismiss={handleHeroDismiss} />*/}

        {/* Tabs de navegación */}
        {heroVisible && (
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
                loadingAnswers ? (
                  <InlineLoader message="Obteniendo respuestas y datos del alumno..." />
                ) : (
                  <QuestionnaireSection 
                    answers={realAnswers} 
                    onUpdateAnswer={handleUpdateAnswer} 
                  />
                )
              )}
              {activeTab === 'documents' && (

                <div className={styles.card}>
                  <DocumentsSection documents={MOCK_DOCUMENTS} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <AppFooter variant='dark' />

    </div>
  );
}
// importarlo como funcion 
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
