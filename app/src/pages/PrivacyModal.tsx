'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './PrivacyModal.module.css';

type Item = { lead?: string; text: string };
type Block = { subtitle?: string; paragraph?: string; items?: Item[] };
type Section = { title: string; blocks: Block[] };

export const PRIVACY_LAST_UPDATE = '18 de octubre de 2026';

// ─────────────────────────────────────────────────────
// CONTENIDO — edita aquí sin tocar el layout
// ─────────────────────────────────────────────────────
const SUMMARY = [
  'Tu información se usa únicamente para analítica académica, orientación curricular y asistencia personalizada.',
  'No se vende, no se renta y no se difunde a empresas ni a personas externas.',
  'Puedes consultar, corregir o revocar el uso de tus datos cuando quieras.',
];

const SECTIONS: Section[] = [
  {
    title: 'Identidad y Responsables del Tratamiento',
    blocks: [
      {
        paragraph:
          'El proyecto académico y de desarrollo tecnológico PumaIA, adscrito a la comunidad de la Licenciatura en Matemáticas Aplicadas y Computación (MAC) de la Facultad de Estudios Superiores Acatlán (UNAM), es el responsable del resguardo, integridad y tratamiento confidencial de los datos recabados a través de su plataforma web, interfaces de programación (APIs) y microservicios.',
      },
    ],
  },
  {
    title: 'Declaración de Veracidad y Responsabilidad del Alumno',
    blocks: [
      {
        paragraph:
          'Al acceder, registrarse o interactuar con el ecosistema de PumaIA, el estudiante manifiesta de manera expresa, libre y bajo protesta de decir verdad que:',
        items: [
          {
            lead: 'Autenticidad de la información:',
            text: 'Toda la información proporcionada a través de formularios, el cuestionario inicial de perfil, los check-ins de seguimiento y los documentos cargados al sistema (incluyendo tiras de materias, historiales académicos en formato PDF, constancias de cursos, comprobantes de idiomas y proyectos) es fidedigna, vigente y corresponde en su totalidad a su persona.',
          },
          {
            lead: 'Efectividad de los modelos:',
            text: 'El alumno reconoce que la precisión, coherencia y pertinencia de los modelos analíticos, motores de recomendación curricular, sugerencias de intercambio institucional y proyecciones profesionales dependen directamente de la veracidad y exactitud de los datos que él mismo declare o confirme en la plataforma.',
          },
          {
            lead: 'Uso de cuentas institucionales:',
            text: 'Las credenciales, el número de cuenta UNAM y el correo institucional asignado son intransferibles. El estudiante es el único responsable de salvaguardar el acceso a su sesión.',
          },
        ],
      },
    ],
  },
  {
    title: 'Datos Personales Recabados',
    blocks: [
      {
        paragraph:
          'Para cumplir exclusivamente con las funciones de orientación y analítica, PumaIA recopila las siguientes categorías de datos:',
        items: [
          {
            lead: 'Identificación y contacto:',
            text: 'Nombre completo, número de cuenta UNAM, correo institucional (@pcpuma.acatlan.unam.mx) y número telefónico de contacto voluntario.',
          },
          {
            lead: 'Académicos y trayectoria escolar:',
            text: 'Carreras cursadas, semestre lectivo, calificaciones, promedio general acumulado, materias acreditadas, recursadas o dadas de baja, créditos acumulados y seriación curricular vinculada a MAC.',
          },
          {
            lead: 'Sociodemográficos y contextuales:',
            text: 'Tiempo de traslado a la facultad, municipio o zona de residencia, situación laboral, horas de trabajo semanales y acceso a equipo de cómputo propio e internet.',
          },
          {
            lead: 'Perfil técnico y extracurricular:',
            text: 'Registro de cursos concluidos, concursos académicos o de código, niveles acreditados de idiomas, becas asignadas y áreas de experiencia laboral.',
          },
          {
            lead: 'Interacciones y métricas de uso:',
            text: 'Consultas académicas realizadas al asistente conversacional, indicadores anónimos de interacción, respuestas al cuestionario psicométrico/vocacional y evaluaciones de satisfacción sobre trámites y servicios (CSAT).',
          },
        ],
      },
    ],
  },
  {
    title: 'Finalidades del Tratamiento (para qué usamos tu información)',
    blocks: [
      {
        paragraph:
          'Toda la información recopilada tiene fines estrictamente académicos, analíticos y de soporte estudiantil. En ningún momento los datos se emplearán con fines comerciales, de publicidad de terceros o ajenos a la comunidad universitaria. Las finalidades se clasifican en:',
      },
      {
        subtitle: 'Finalidades primarias (operación del sistema)',
        items: [
          {
            lead: 'Análisis de perfil y rutas profesionales:',
            text: 'Alimentar los modelos de recomendación y herramientas de Inteligencia Artificial para identificar aptitudes, sugerir trayectorias especializadas de egreso de MAC y proyectar áreas de oportunidad académica.',
          },
          {
            lead: 'Gestión de trámites y movilidad estudiantil:',
            text: 'Contrastar las materias cursadas contra planes de estudio de universidades de destino para la validación automática de materias aptas a revalidar y la gestión de listas de documentación oficial requerida.',
          },
          {
            lead: 'Asistencia académica personalizada:',
            text: 'Brindar contexto al modelo conversacional de orientación para responder dudas específicas sobre asignaturas, seriación, trámites escolares y reglamentación interna de la facultad.',
          },
        ],
      },
      {
        subtitle: 'Finalidades analíticas y preventivas',
        items: [
          {
            lead: 'Generación de métricas e indicadores de rendimiento:',
            text: 'Estimar probabilidades de rezago o cuellos de botella por asignaturas de alta reprobación (materias candado), permitiendo al alumno balancear sus cargas semestrales.',
          },
          {
            lead: 'Detección preventiva de deserción y vulnerabilidad:',
            text: 'Identificar oportunamente caídas drásticas de rendimiento para generar alertas tempranas de acompañamiento estudiantil.',
          },
          {
            lead: 'Canalización institucional de apoyo:',
            text: 'Facilitar el contacto voluntario hacia programas de tutoría docente o servicios psicopedagógicos de la FES Acatlán en casos de alta sobrecarga o riesgo detectado.',
          },
          {
            lead: 'Optimización de servicios escolares:',
            text: 'Proporcionar reportes estadísticos globales y completamente anonimizados a la Coordinación de MAC sobre las dudas administrativas y trámites con mayor índice de fricción en la carrera.',
          },
        ],
      },
    ],
  },
  {
    title: 'Cláusula de Confidencialidad y No Difusión',
    blocks: [
      {
        items: [
          {
            lead: 'No venta ni difusión a terceros:',
            text: 'PumaIA no comercializa, no renta, no transfiere y jamás difundirá la información personal o académica de los estudiantes a empresas, entidades privadas ni personas externas no autorizadas.',
          },
          {
            lead: 'Uso de datos en modelos de IA:',
            text: 'Las interacciones y datos compartidos a través de las interfaces de programación (FastAPI / Gemini) se procesan exclusivamente para generar la respuesta inmediata y el análisis contextual del estudiante. Los datos privados no se utilizan para entrenar modelos públicos abiertos ni para divulgación pública.',
          },
          {
            lead: 'Disociación estadística:',
            text: 'Todo análisis remitido a comités académicos o coordinación para mejoras del plan de estudios se entrega de manera consolidada, cuantitativa y desasociada de la identidad o número de cuenta de los participantes.',
          },
        ],
      },
    ],
  },
  {
    title: 'Almacenamiento Seguro y Medidas de Protección',
    blocks: [
      {
        paragraph:
          'Los datos del alumno se encuentran protegidos mediante protocolos de seguridad técnica y administrativa de estándar industrial:',
        items: [
          {
            lead: 'Bases de datos encriptadas:',
            text: 'Toda la persistencia de datos (PostgreSQL/Supabase) cuenta con políticas de cifrado en reposo y en tránsito mediante certificados TLS/SSL seguros.',
          },
          {
            lead: 'Políticas de control de acceso (Row-Level Security):',
            text: 'La arquitectura aísla el historial de cada estudiante para que únicamente el titular de la sesión activa autenticada con token JWT firmado pueda consultar o modificar su propia información.',
          },
          {
            lead: 'Resguardo de contraseñas:',
            text: 'Las contraseñas jamás se almacenan en texto plano; son procesadas con algoritmos de hashing unidireccional no reversible (bcrypt).',
          },
          {
            lead: 'Separación de métricas sensibles:',
            text: 'Las predicciones estadísticas y los indicadores de bienestar se almacenan en estructuras analíticas desacopladas de las tablas principales de identidad personal, limitando su visibilidad y evitando exposiciones indebidas.',
          },
        ],
      },
    ],
  },
  {
    title: 'Derechos del Titular y Control de Información',
    blocks: [
      {
        paragraph: 'El alumno conserva en todo momento el control sobre sus datos y puede:',
        items: [
          { text: 'Consultar el desglose de su información almacenada desde la sección Mi Perfil.' },
          {
            text: 'Modificar, añadir o corregir respuestas del cuestionario, calificaciones, cursos, idiomas y proyectos desde la pestaña Actualizar Información.',
          },
          {
            text: 'Solicitar el cierre de su cuenta o la revocación del uso de sus datos personales para fines analíticos contactando a los administradores a través de la sección de soporte o el correo institucional del proyecto.',
          },
        ],
      },
    ],
  },
  {
    title: 'Consentimiento Expreso',
    blocks: [
      {
        paragraph:
          'Al presionar «Aceptar», iniciar sesión o continuar con el uso de la plataforma PumaIA, declaro que he leído en su totalidad este Aviso de Privacidad; confirmo que los datos proporcionados son verídicos y vigentes, y otorgo mi consentimiento para que sean tratados exclusivamente para los fines de analítica académica, orientación curricular y asistencia personalizada aquí descritos, bajo las condiciones de confidencialidad y seguridad establecidas.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
};

export default function PrivacyModal({ open, onClose, onAccept }: Props) {
  const [mounted, setMounted] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Bloquea el scroll del fondo y cierra con Escape
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const checkEnd = () => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedEnd(true);
  };

  // Si el contenido cabe sin scroll (pantallas muy altas), habilita el botón
  useEffect(() => {
    if (open) setTimeout(checkEnd, 50);
  }, [open]);

  // Portal: el login-card tiene backdrop-filter, lo que atraparía un position:fixed dentro de la tarjeta
  if (!mounted || !open) return null;

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerIcon}><ShieldIcon /></div>
          <div className={styles.headerText}>
            <h2 id="privacy-title" className={styles.title}>Aviso de Privacidad</h2>
            <p className={styles.subtitle}>
              PumaIA · FES Acatlán, UNAM · Última actualización: {PRIVACY_LAST_UPDATE}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </header>
        <div className={styles.goldLine} />

        {/* Cuerpo con scroll */}
        <div className={styles.body} ref={bodyRef} onScroll={checkEnd}>
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>En resumen</p>
            <ul className={styles.summaryList}>
              {SUMMARY.map((s) => (
                <li key={s}><CheckIcon /> <span>{s}</span></li>
              ))}
            </ul>
          </div>

          <p className={styles.intro}>
            Aviso de privacidad integral, consentimiento y declaración de veracidad de datos.
          </p>

          {SECTIONS.map((section, i) => (
            <section key={section.title} className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionNum}>{i + 1}</span>
                {section.title}
              </h3>

              {section.blocks.map((block, bi) => (
                <div key={bi} className={styles.block}>
                  {block.subtitle && <h4 className={styles.subtitleBlock}>{block.subtitle}</h4>}
                  {block.paragraph && <p className={styles.paragraph}>{block.paragraph}</p>}
                  {block.items && (
                    <ul className={styles.list}>
                      {block.items.map((item, ii) => (
                        <li key={ii} className={styles.listItem}>
                          {item.lead && <strong>{item.lead} </strong>}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>

        {/* Pie */}
        <footer className={styles.footer}>
          <p className={styles.hint}>
            {reachedEnd
              ? 'Gracias por leer el aviso completo.'
              : 'Desplázate hasta el final para poder aceptar.'}
          </p>
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose} type="button">
              Cerrar
            </button>
            <button
              className={`${styles.acceptBtn} ${!reachedEnd ? styles.acceptBtnDisabled : ''}`}
              onClick={onAccept}
              disabled={!reachedEnd}
              type="button"
            >
              Aceptar y continuar
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ── Íconos ────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 3 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
