'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import styles from './FaqsPage.module.css';

// ─────────────────────────────────────────────────────
// CONTENIDO — edita aquí para cambiar preguntas y grupos
// Para agregar un grupo nuevo: añade un objeto a FAQ_GROUPS
// Para agregar una pregunta: añade un objeto al array `items` del grupo
// ─────────────────────────────────────────────────────
type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqGroup = {
  id: string;
  label: string;
  items: FaqItem[];
};

const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'general',
    label: 'Preguntas frecuentes',
    items: [
      {
        id: 'q1',
        question: '¿Pregunta A?',
        answer:
          'Esta es la respuesta a la Pregunta A. Aquí va una explicación clara y detallada que ayude al usuario a entender el tema.',
      },
      {
        id: 'q2',
        question: '¿Cómo inicio sesión en el portal?',
        answer:
          'Ingresa tu número de cuenta UNAM y la contraseña que utilizas para los servicios escolares. Si no tienes contraseña aún, sigue el enlace "¿Olvidaste tu contraseña?" en la pantalla de inicio.',
      },
      {
        id: 'q3',
        question: '¿Mis datos están seguros?',
        answer:
          'Sí. La plataforma utiliza encriptación de extremo a extremo y no comparte tu información con terceros. Solo se usa para generar recomendaciones personalizadas dentro del sistema.',
      },
      {
        id: 'q4',
        question: '¿Puedo actualizar mis intereses después del cuestionario inicial?',
        answer:
          'Sí, en cualquier momento puedes ir a "Actualizar información" desde el menú principal para responder el cuestionario nuevamente o modificar tus respuestas anteriores.',
      },
    ],
  },
  {
    id: 'pumaia',
    label: 'Sobre PumaIA',
    items: [
      {
        id: 'q5',
        question: '¿Qué es PumaIA exactamente?',
        answer:
          'PumaIA es un asistente de inteligencia artificial desarrollado para estudiantes de la FES Acatlán. Te ayuda a orientar tu camino profesional basándose en tu historial académico e intereses personales.',
      },
      {
        id: 'q6',
        question: '¿Las recomendaciones de PumaIA son definitivas?',
        answer:
          'No. Las recomendaciones son orientativas y deben tomarse como punto de partida para explorar opciones. Te invitamos a contrastarlas con asesores académicos y profesionales del área.',
      },
    ],
  },
  {
    id: 'intercambio',
    label: 'Intercambios',
    items: [
      {
        id: 'q7',
        question: '¿Cómo funciona la sección de intercambios?',
        answer:
          'La sección de intercambios te guía paso a paso en el proceso de postulación a programas de movilidad estudiantil nacionales e internacionales disponibles para tu carrera.',
      },
    ],
  },
];


type Props = Record<string, never>;

export default function FaqsPage(_: Props) {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(FAQ_GROUPS.map((g) => g.id)) // todos abiertos por defecto
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

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />
      <Navbar />

      <main className={styles.main}>
        <div className={styles.card}>

          <button className={styles.backBtn} onClick={() => router.back()}>
            <BackArrowIcon /> volver
          </button>

          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>¿Qué es {'{nombre de la IA}'}?</h1>
            <p className={styles.heroText}>
              Un texto bastante largo explicando qué es la IA y para qué funciona. Aquí irá
              la descripción oficial de PumaIA, sus objetivos, el equipo detrás y cómo puede
              ayudarte a lo largo de tu trayectoria académica y profesional en la FES Acatlán.
            </p>
          </section>

          <div className={styles.divider} />

          <section className={styles.accordion}>
            {FAQ_GROUPS.map((group) => (
              <div key={group.id} className={styles.group}>
                <button
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{group.label} &gt;</span>
                  <ChevronIcon open={openGroups.has(group.id)} />
                </button>

                {openGroups.has(group.id) && (
                  <div className={styles.groupItems}>
                    {group.items.map((item) => (
                      <div key={item.id} className={styles.faqItem}>
                        <button
                          className={styles.question}
                          onClick={() => toggleItem(item.id)}
                        >
                          <span>{item.question}</span>
                          <ChevronIcon open={openItems.has(item.id)} />
                        </button>

                        {openItems.has(item.id) && (
                          <div className={styles.answer}>
                            <p>{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <a href="/faqs" className={styles.footerLink}>Preguntas frecuentes</a>
        <a href="#" className={styles.footerLink}>Cosas de footer</a>
      </footer>
    </div>
  );
}

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
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
