'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import styles from './AboutPage.module.css';
import { DONNY, AI_LOGO, DONNY_2 } from '../../utils/img/assets';

const PILLARS = [
  {
    icon: '',
    title: 'Orientación real',
    desc: 'No solo te decimos qué carrera estudiar. Analizamos tu historial, tus intereses y tu contexto para darte un camino concreto y alcanzable.',
  },
  {
    icon: '',
    title: 'IA con propósito',
    desc: 'Usamos modelos de lenguaje de última generación entrenados con el contexto académico de la FES Acatlán, no soluciones genéricas.',
  },
  {
    icon: '',
    title: 'Tus datos, tuyos',
    desc: 'Tu historial académico y tus respuestas nunca se comparten con terceros. Existen únicamente para personalizar tu experiencia.',
  },
  {
    icon: '',
    title: 'Crece contigo',
    desc: 'Cada semestre que actualices tu información, PumaIA refina su análisis. El sistema aprende de tu evolución, no solo de tu punto de partida.',
  },
];

const TEAM = [
  {
    id: 't1',
    name: 'Avalos Villalobos Luis Gilberto',
    role: 'Desarrollo',
    photoUrl: '',
    github: 'https://github.com/GilbertoFen',
    linkedin: '#',
  },
  {
    id: 't2',
    name: 'Casas Lorenzo Saul',
    role: 'Desarrollo',
    photoUrl: '',
    github: 'https://github.com/ChinchyPear821',
    linkedin: '#',
  },
  {
    id: 't3',
    name: 'Islas Romero Jose Emmanuel',
    role: 'Desarrollo',
    photoUrl: '',
    github: 'https://github.com/Emmrom',
    linkedin: '#',
  },
  {
    id: 't4',
    name: 'Resendiz rodriguez Joaquin Raciel',
    role: 'Desarrollo',
    photoUrl: DONNY_2,
    github: 'https://github.com/Raciel55',
    linkedin: '#',
  },
];

// ─────────────────────────────────────────────────────

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />
      <Navbar />

      <main className={styles.main}>

        {/* Botón volver */}
        <button className={styles.backBtn} onClick={() => router.back()}>
          <BackArrowIcon /> Volver
        </button>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              La IA que entiende<br />
              <span className={styles.heroAccent}>tu carrera en la UNAM</span>
            </h1>
            <p className={styles.heroDesc}>
              PumaIA nació de una pregunta simple: ¿por qué los estudiantes de la FES Acatlán
              tienen que descubrir solos su camino profesional? Con tecnología de inteligencia
              artificial y el contexto real de tu historial académico, construimos la herramienta
              que hubiéramos querido tener cuando éramos estudiantes.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.heroCta} onClick={() => router.push('/chat')}>
                Hablar con PumaIA →
              </button>
              <a href="/faqs" className={styles.heroSecondary}>Ver preguntas frecuentes</a>
            </div>
          </div>

          {/* Tarjeta flotante decorativa */}
          <div className={styles.heroCard}>
            <div className={styles.heroCardInner}>
              <div className={styles.heroCardIcon}>
                <BrainIcon />
              </div>
              <div className={styles.heroCardText}>
                <p className={styles.heroCardTitle}>Análisis personalizado</p>
                <p className={styles.heroCardSub}>Basado en tu historial real</p>
              </div>
            </div>
            <div className={styles.heroCardStats}>
              <HeroStat num="100%" label="Enfocado en MAC" />
              <HeroStat num="24/7" label="Disponible" />
              <HeroStat num="FES" label="Acatlán" />
            </div>
          </div>
        </section>

        {/* ── Motivación / misión ── */}
        <section className={styles.missionSection}>
          <SectionLabel icon="" text="Motivación" />
          <div className={styles.missionGrid}>
            <div className={styles.missionText}>
              <h2 className={styles.sectionTitle}>
                Porque orientarse no debería ser tan difícil
              </h2>
              <p className={styles.sectionBody}>
                Cada semestre, miles de estudiantes en FES Acatlán toman decisiones
                importantes sobre su carrera — qué materias optar, si hacer un intercambio,
                qué habilidades desarrollar — sin información suficiente ni herramientas
                adaptadas a su contexto.
              </p>
              <p className={styles.sectionBody}>
                PumaIA centraliza tu historial académico, tus intereses y las oportunidades
                disponibles en un solo lugar, y usa inteligencia artificial para convertir
                esa información en orientación concreta: rutas profesionales, revalidaciones,
                becas y más.
              </p>
              <blockquote className={styles.quote}>
                "No somos un chatbot genérico. Somos una herramienta construida desde adentro,
                por estudiantes que conocen los pasillos de Acatlán."
              </blockquote>
            </div>
            <div className={styles.missionPillars}>
              {PILLARS.map((p) => (
                <div key={p.title} className={styles.pillar}>
                  <span className={styles.pillarIcon}>{p.icon}</span>
                  <div>
                    <p className={styles.pillarTitle}>{p.title}</p>
                    <p className={styles.pillarDesc}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tecnología ── */}
        <section className={styles.techSection}>
          <SectionLabel icon="" text="Tecnología" />
          <h2 className={styles.sectionTitle}>Construido con lo mejor</h2>
          <div className={styles.techGrid}>
            {['Next.js', 'TypeScript', 'Modelo de AI', 'Supabase', 'NestJS', 'Cloudinary'].map((t) => (
              <div key={t} className={styles.techChip}>{t}</div>
            ))}
          </div>
        </section>

        {/* ── Equipo ── */}
        <section className={styles.teamSection}>
          <SectionLabel icon="" text="Colaboradores" />
          <h2 className={styles.sectionTitle}>Hecho por estudiantes de la FES</h2>
          <p className={styles.teamDesc}>
           
          </p>
          <div className={styles.teamGrid}>
            {TEAM.map((member) => (
              <div key={member.id} className={styles.memberCard}>
                {/* Avatar — reemplaza con <img src={member.photoUrl} /> cuando tengas las fotos */}
                <div className={styles.memberAvatar}>
                  {member.photoUrl
                    ? <img src={member.photoUrl} alt={member.name} className={styles.memberPhoto} />
                    : <PersonIcon />
                  }
                </div>
                <p className={styles.memberName}>{member.name}</p>
                <p className={styles.memberRole}>{member.role}</p>
                <div className={styles.memberLinks}>
                  <a href={member.github} target="_blank" rel="noopener noreferrer"
                    className={styles.memberLink} title="GitHub">
                    <GithubIcon />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                    className={styles.memberLink} title="LinkedIn">
                    <LinkedinIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Agradecimientos */}
          <div className={styles.acknowledgement}>
            <UniversityIcon />
            <p>
              Proyecto desarrollado en la <strong>Facultad de Estudios Superiores Acatlán</strong>,
              Universidad Nacional Autónoma de México. Bajo la dirección del área de
              Matemáticas Aplicadas y Computación.
            </p>
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <a href="/faqs" className={styles.footerLink}>Preguntas frecuentes</a>
        <a href="https://www.acatlan.unam.mx" target="_blank" rel="noopener noreferrer"
          className={styles.footerLink}>FES Acatlán</a>
        <a href="https://www.unam.mx" target="_blank" rel="noopener noreferrer"
          className={styles.footerLink}>UNAM</a>
        <span className={styles.footerLink} style={{ marginLeft: 'auto' }}>
          © {new Date().getFullYear()} PUMAIA · FES Acatlán
        </span>
      </footer>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────
function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className={styles.sectionLabel}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function HeroStat({ num, label }: { num: string; label: string }) {
  return (
    <div className={styles.heroStat}>
      <span className={styles.heroStatNum}>{num}</span>
      <span className={styles.heroStatLabel}>{label}</span>
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
function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function BrainIcon() {
  return (
    <img src={AI_LOGO} alt="PumaIA" style={{ width: 40, height: 40 }} />
  );
}
function PersonIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function UniversityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}