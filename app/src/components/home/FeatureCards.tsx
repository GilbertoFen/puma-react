'use client';
import React from 'react';
import styles from './FeatureCards.module.css';
import { AI_LOGO, EXCHANGE_ICON, UPDATE_INFO_ICON } from '../../utils/img/assets';

type FeatureCard = {
  id: string;
  icon: React.FC;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
};

type Props = {
  onPumaIA: () => void;
  onExchange: () => void; // Añadido
  onUpdate: () => void;   // Añadido
};
export default function FeatureCards({ onPumaIA, onExchange, onUpdate }: Props) {
  const CARDS: FeatureCard[] = [
    {
      id: 'pumaia',
      icon: PumaIACardIcon,
      title: 'PumaIA',
      description: 'Explora la IA y descubre tu verdadero camino profesional',
      actionLabel: 'Ver más información',
      onAction: onPumaIA,
    },
    {
      id: 'intercambio',
      icon: ExchangeCardIcon,
      title: 'Intercambio',
      description: 'Descubre cómo realizar un intercambio paso a paso según tus necesidades',
      actionLabel: 'Ver más información',
      onAction: onExchange,
    },
    {
      id: 'actualizar',
      icon: UpdateCardIcon,
      title: 'Actualizar información',
      description: 'Actualiza tus datos en cualquier momento para continuar descubriendo tus verdaderos intereses',
      actionLabel: 'Ver más información',
      onAction: onUpdate,
    },
  ];

  return (
    <div className={styles.grid}>
      {CARDS.map((card) => (
        <div key={card.id} className={styles.card}>
          <div className={styles.iconWrap}>
            <card.icon />
          </div>

          <div className={styles.content}>
            <div className={styles.titleRow}>
              <span className={styles.badge}>
                <SparkleIcon /> {card.title}
              </span>
            </div>
            <p className={styles.description}>{card.description}</p>
            <button
              className={`${styles.actionBtn} ${!card.onAction ? styles.disabled : ''}`}
              onClick={card.onAction}
              disabled={!card.onAction}
            >
              {card.actionLabel}
            </button>
          </div>
        </div>
      ))}
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

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
