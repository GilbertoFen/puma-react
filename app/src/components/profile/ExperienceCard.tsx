'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './ExperienceCard.module.css';

interface ExperienceCardProps {
  data: {
    courses?: any[];
    schoolarships?: any[];
    contests?: any[];
    experiences?: any[];
  } | null;
}

export default function ExperienceCard({ data }: ExperienceCardProps) {
  const router = useRouter();

  // Referencias a los arreglos de la BD con arreglos vacíos como respaldo seguro
  const cursos = data?.courses || [];
  const becas = data?.schoolarships || [];
  const concursos = data?.contests || [];
  const experiencias = data?.experiences || [];

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}><TrophyIcon /> Experiencia y logros</h2>
      </div>

      {/* 📚 SECCIÓN: Cursos */}
      <ExperienceSection label="Cursos" icon="📚">
        {cursos.length > 0 ? (
          cursos.map((c: any) => (
            <ItemRow 
              key={c.id}
              primary={c.course?.name || 'Curso registrado'}
              secondary="Acreditado"
            />
          ))
        ) : (
          <p className={styles.emptyText} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', paddingLeft: '24px' }}>
            No has registrado cursos aún.
          </p>
        )}
      </ExperienceSection>

      {/* 🏆 SECCIÓN: Concursos */}
      <ExperienceSection label="Concursos" icon="🏆">
        {concursos.length > 0 ? (
          concursos.map((cn: any) => (
            <ItemRow 
              key={cn.id}
              primary={cn.contest?.name || 'Concurso'}
              secondary="Participación registrada"
            />
          ))
        ) : (
          <p className={styles.emptyText} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', paddingLeft: '24px' }}>
            No has registrado concursos.
          </p>
        )}
      </ExperienceSection>

      {/* 🎓 SECCIÓN: Becas */}
      <ExperienceSection label="Becas" icon="🎓">
        {becas.length > 0 ? (
          becas.map((b: any) => (
            <ItemRow 
              key={b.id}
              primary={b.schoolarship?.name || 'Beca académica'}
              secondary="Asignada"
              badge="Activa"
            />
          ))
        ) : (
          <p className={styles.emptyText} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', paddingLeft: '24px' }}>
            No has registrado becas.
          </p>
        )}
      </ExperienceSection>

      {/* 💼 SECCIÓN: Experiencia Profesional */}
      <ExperienceSection label="Experiencia profesional" icon="💼">
        {experiencias.length > 0 ? (
          experiencias.map((e: any) => (
            <ItemRow 
              key={e.id}
              primary={e.areaExpertise?.name || 'Puesto profesional'}
              secondary="Experiencia vinculada"
            />
          ))
        ) : (
          <p className={styles.emptyText} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', paddingLeft: '24px' }}>
            No has agregado experiencia profesional.
          </p>
        )}
      </ExperienceSection>

      {/* CTA de redirección */}
      <button
        className={styles.editBtn}
        onClick={() => router.push('/update-info')}
      >
        <EditIcon /> Agregar o modificar datos de experiencia
      </button>
    </div>
  );
}

// Subcomponentes internos permanecen idénticos para respetar al 100% tus clases CSS
type SectionProps = { label: string; icon: string; children: React.ReactNode };
function ExperienceSection({ label, icon, children }: SectionProps) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{icon} {label}</p>
      <div className={styles.itemList}>{children}</div>
    </div>
  );
}

type ItemRowProps = { primary: string; secondary: string; badge?: string };
function ItemRow({ primary, secondary, badge }: ItemRowProps) {
  return (
    <div className={styles.item}>
      <div className={styles.itemText}>
        <span className={styles.itemPrimary}>{primary}</span>
        <span className={styles.itemSecondary}>{secondary}</span>
      </div>
      {badge && (
        <span className={`${styles.badge} ${badge === 'Activa' ? styles.badgeActive : styles.badgePending}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────
function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/>
      <line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4h10l1 7a5 5 0 0 1-10 0V4"/>
      <path d="M7 4H4v3a3 3 0 0 0 3 3M17 4h3v3a3 3 0 0 1-3 3"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
