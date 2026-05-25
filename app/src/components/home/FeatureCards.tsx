'use client';
import React, { useState } from 'react';
import styles from './FeatureCards.module.css';
import { AI_LOGO, EXCHANGE_ICON, UPDATE_INFO_ICON, AI_ANALYZE } from '../../utils/img/assets';


type FeatureCard = {
  id: string;
  icon: React.FC;
  title: string;
  shortDesc: string;
  hoverTitle: string;
  hoverBody: string;
  actionLabel: string;
  onAction?: () => void;
  highlight?: boolean;
};

type Props = {
  onPumaIA: () => void;
  onExchange: () => void;
  onUpdate: () => void;
  onAnalyze: () => void;
};

export default function FeatureCards({ onPumaIA, onExchange, onUpdate, onAnalyze }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const CARDS: FeatureCard[] = [
    {
      id: 'pumaia',
      icon: PumaIACardIcon,
      title: 'PumaIA',
      shortDesc: 'Explora la IA y descubre tu verdadero camino profesional',
      hoverTitle: '¿Qué puedo hacer con PumaIA?',
      hoverBody: 'Hazle preguntas sobre tu carrera, pídele un plan de estudios personalizado, consulta sobre intercambios o simplemente conversa sobre tus dudas académicas. PumaIA conoce tu historial y tu contexto.',
      actionLabel: 'Ir al chat →',
      onAction: onPumaIA,
    },
    {
      id: 'analyze',
      icon: AnalyzeCardIcon,
      title: 'Análisis profesional',
      shortDesc: 'Descubre las rutas profesionales donde tienes mayor potencial',
      hoverTitle: '¿Cómo funciona el análisis?',
      hoverBody: 'PumaIA cruza tu historial académico, materias cursadas, calificaciones, idiomas e intereses para identificar las 3 rutas profesionales con mayor compatibilidad con tu perfil actual.',
      actionLabel: 'Ver mi análisis →',
      onAction: onAnalyze,
      highlight: true,
    },
    // {
    //   id: 'intercambio',
    //   icon: ExchangeCardIcon,
    //   title: 'Intercambio',
    //   shortDesc: 'Descubre cómo realizar un intercambio paso a paso según tus necesidades',
    //   hoverTitle: '¿Qué incluye la sección de intercambios?',
    //   hoverBody: 'Filtra universidades por país e idioma, revisa qué materias puedes revalidar, consulta becas disponibles y organiza la documentación necesaria. Todo en un solo lugar.',
    //   actionLabel: 'Explorar opciones →',
    //   onAction: onExchange,
    // },
    {
      id: 'actualizar',
      icon: UpdateCardIcon,
      title: 'Actualizar información',
      shortDesc: 'Actualiza tus datos para que el análisis sea más preciso',
      hoverTitle: '¿Qué puedo actualizar?',
      hoverBody: 'Sube tu historial académico en PDF, agrega cursos, idiomas, experiencia profesional y responde nuevamente el cuestionario de intereses. Entre más datos tenga PumaIA, mejores serán sus recomendaciones.',
      actionLabel: 'Actualizar ahora →',
      onAction: onUpdate,
    },
  ];

  return (
    <div className={styles.grid}>
      {CARDS.map((card) => {
        const isHovered = hoveredId === card.id;
        return (
          <div
            key={card.id}
            className={`${styles.card} ${card.highlight ? styles.cardHighlight : ''}`}
            onMouseEnter={() => setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(null)}
          >

            {/* Vista normal */}
            <div className={`${styles.cardFront} ${isHovered ? styles.cardFrontHidden : ''}`}>
              <div className={styles.iconWrap}>
                <card.icon />
              </div>
              <div className={styles.content}>
                <span className={styles.badge}><SparkleIcon /> {card.title}</span>
                <p className={styles.description}>{card.shortDesc}</p>
                <button
                  className={styles.actionBtn}
                  onClick={card.onAction}
                >
                  Ver más información
                </button>
              </div>
            </div>

            <div className={`${styles.cardBack} ${isHovered ? styles.cardBackVisible : ''}`}>
              <p className={styles.hoverTitle}>{card.hoverTitle}</p>
              <p className={styles.hoverBody}>{card.hoverBody}</p>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnHover}`}
                onClick={card.onAction}
              >
                {card.actionLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PumaIACardIcon() {
  return (
    <img
      src={AI_LOGO}
      alt="PumaIA"
      style={{ width: '90%', height: '90%', objectFit: 'contain' }}
    />
  );
}

function ExchangeCardIcon() {
  return (
    <img
      src={EXCHANGE_ICON}
      alt="Intercambio"
      style={{ width: '70%', height: '70%', objectFit: 'contain' }}
    />
  );
}

function UpdateCardIcon() {
  return (
    <img
      src={UPDATE_INFO_ICON}
      alt="Actualizar Información"
      style={{ width: '70%', height: '70%', objectFit: 'contain' }}
    />

  );
}

function AnalyzeCardIcon() {
  return (

    <img
      src={AI_ANALYZE}
      alt="Analizar con PumaIA"
      style={{ width: '90%', height: '90%', objectFit: 'contain' }}
    />
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
