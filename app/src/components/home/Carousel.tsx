'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './Carousel.module.css';
import { FES_IMAGE_1 } from '../../utils/img/assets';
type CarouselSlide = {
  id: string;
  imageSrc: string;
  title: string;
  description: string;
};

const SLIDES: CarouselSlide[] = [
  {
    id: 'fes-1',
    imageSrc: FES_IMAGE_1, 
    title: 'Facultad de estudios superiores Acatlán',
    description: 'Información de la FES y enlaces a sus sitios oficiales',
  },
  {
    id: 'fes-2',
    imageSrc: FES_IMAGE_1,
    title: 'Laboratorios y tecnología',
    description: 'Conoce los laboratorios y recursos tecnológicos disponibles para estudiantes',
  },
  {
    id: 'fes-3',
    imageSrc: FES_IMAGE_1,
    title: 'Vida universitaria',
    description: 'Actividades culturales, deportivas y de vinculación en la FES Acatlán',
  },
  {
    id: 'fes-4',
    imageSrc: FES_IMAGE_1,
    title: 'Programas de becas',
    description: 'Descubre las becas y apoyos económicos disponibles para ti',
  },
];

const AUTO_ADVANCE_MS = 5000;

export default function Carousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    setActive((idx + SLIDES.length) % SLIDES.length);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleDot = (idx: number) => {
    goTo(idx);
    resetTimer();
  };

  const handlePrev = () => { goTo(active - 1); resetTimer(); };
  const handleNext = () => { goTo(active + 1); resetTimer(); };

  const slide = SLIDES[active];

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Imagen */}
        <div className={styles.imageCol}>
          {slide.imageSrc ? (
            <img
              src={slide.imageSrc}
              alt={slide.title}
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <ImagePlaceholderIcon />
              <span>Imagen por agregar</span>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className={styles.textCol}>
          <h3 className={styles.slideTitle}>{slide.title}</h3>
          <p className={styles.slideDescription}>{slide.description}</p>
        </div>

        {/* Flechas de navegación */}
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={handlePrev} aria-label="Anterior">
          <ChevronLeftIcon />
        </button>
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={handleNext} aria-label="Siguiente">
          <ChevronRightIcon />
        </button>
      </div>

      {/* Dots */}
      <div className={styles.dots}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            onClick={() => handleDot(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
