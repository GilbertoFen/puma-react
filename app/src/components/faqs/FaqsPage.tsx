'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import styles from './FaqsPage.module.css';

type FaqItem = { id: string; question: string; answer: string };
type FaqGroup = { id: string; label: string; icon: string; items: FaqItem[] };

// ─────────────────────────────────────────────────────
// CONTENIDO — edita aquí
// ─────────────────────────────────────────────────────
const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'general',
    label: 'Preguntas generales',
    icon: '',
    items: [
      {
        id: 'q1',
        question: '¿Cómo inicio sesión en el portal?',
        answer: 'Ingresa tu número de cuenta UNAM y la contraseña que utilizas para los servicios escolares.',
      },
      {
        id: 'q3',
        question: '¿Puedo actualizar mis intereses después del cuestionario inicial?',
        answer: 'Sí, en cualquier momento puedes ir a "Actualizar información" desde el menú principal para responder el cuestionario nuevamente o modificar tus respuestas anteriores.',
      },
    ],
  },
  {
    id: 'pumaia',
    label: 'Sobre PumaIA',
    icon: '',
    items: [
      {
        id: 'q4',
        question: '¿Qué es PumaIA exactamente?',
        answer: 'PumaIA es un asistente de inteligencia artificial desarrollado para estudiantes de la FES Acatlán. Te ayuda a orientar tu camino profesional basándose en tu historial académico e intereses personales.',
      },
      {
        id: 'q5',
        question: '¿Las recomendaciones de PumaIA son definitivas?',
        answer: 'No. Las recomendaciones son orientativas y deben tomarse como punto de partida para explorar opciones. Te invitamos a contrastarlas con asesores académicos y profesionales del área.',
      },
    ],
  },
  {
    id: 'academico',
    label: 'Historial académico',
    icon: '',
    items: [
      {
        id: 'q7',
        question: '¿Cómo subo mi historial académico?',
        answer: 'Ve a "Actualizar información" → pestaña "Documentos" y sube tu historial en PDF. El sistema lo procesará automáticamente para extraer tus materias y calificaciones.',
      },
      {
        id: 'q8',
        question: '¿Qué pasa si una calificación aparece incorrecta?',
        answer: 'Puedes editar tus calificaciones manualmente desde la sección de Actualizar Información en tu perfil. Los cambios se guardan en tu perfil de inmediato.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────

type Props = Record<string, never>;

export default function FaqsPage(_: Props) {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set([FAQ_GROUPS[0].id]) // solo el primero abierto por defecto
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalQuestions = FAQ_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />
      <Navbar />

      <main className={styles.main}>

        {/* Botón volver */}
        <button className={styles.backBtn} onClick={() => router.back()}>
          <BackArrowIcon /> Volver
        </button>

        {/* Hero */}
        <section className={styles.hero}>
          <span className={styles.heroBadge}>
             Centro de ayuda
          </span>
          <h1 className={styles.heroTitle}>
            ¿En qué podemos<br />
            <span>ayudarte?</span>
          </h1>
          <p className={styles.heroText}>
            Encuentra respuestas sobre PumaIA, tu historial académico, intercambios
            y más. Si no encuentras lo que buscas, puedes contactarnos desde la
            sección de ajustes.
          </p>
         
        </section>

        {/* Acordeón */}
        <section className={styles.accordion}>
          {FAQ_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            return (
              <div key={group.id} className={styles.group}>
                <button
                  className={`${styles.groupHeader} ${isOpen ? styles.groupHeaderOpen : ''}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className={styles.groupLabel}>
                    <span className={styles.groupIcon}>{group.icon}</span>
                    {group.label}
                    <span className={styles.groupCount}>({group.items.length})</span>
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>

                {isOpen && (
                  <div className={styles.groupItems}>
                    {group.items.map((item) => {
                      const itemOpen = openItems.has(item.id);
                      return (
                        <div key={item.id} className={styles.faqItem}>
                          <button
                            className={`${styles.question} ${itemOpen ? styles.questionOpen : ''}`}
                            onClick={() => toggleItem(item.id)}
                          >
                            <span className={styles.questionText}>{item.question}</span>
                            <ChevronIcon open={itemOpen} />
                          </button>

                          {itemOpen && (
                            <div className={styles.answer}>
                              <div className={styles.answerInner}>
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>

      <footer className={styles.footer}>
        <a href="/faqs" className={styles.footerLink}>Preguntas frecuentes</a>
        <a href="https://www.acatlan.unam.mx" target="_blank" rel="noopener noreferrer"
          className={styles.footerLink}>FES Acatlán</a>
        <a href="https://www.unam.mx" target="_blank" rel="noopener noreferrer"
          className={styles.footerLink}>Página oficial UNAM</a>
        <span className={styles.footerLink} style={{ marginLeft: 'auto' }}>
          © {new Date().getFullYear()} PUMAIA
        </span>
      </footer>
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────
function BackArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
