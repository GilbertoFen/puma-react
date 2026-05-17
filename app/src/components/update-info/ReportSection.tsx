'use client';
import React, { useState, useEffect } from 'react';
import { updateInfoService } from '../../services/updateInfo.service';
import styles from './Sections.module.css';

type Props = {
  // Recibe la estructura de tu backend [{ hasAnalysis: boolean, data: any }]
  initialReport: {
    hasAnalysis: boolean;
    data: any;
  };
};

export default function ReportSection({ initialReport }: Props) {
  // Estado mutable local para renderizar los datos o actualizar si se regenera
  const [reportData, setReportData] = useState<any>(initialReport?.data || null);
  const [analyzing, setAnalyzing] = useState(false);

  // Intentamos formatear la fecha que viene del backend o tomamos la de hoy por defecto si acaba de regenerarse
  const dateStr = reportData?.createdAt || new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Disparar la regeneración en el servidor
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // 1. Invoca el método real del servicio de frontend
      const res = await updateInfoService.generateNewAiAnalysis();
      
      if (res && res.hasAnalysis) {
        // 2. Cargamos la nueva data de Gemini mutando el estado local
        setReportData(res.data);
      }
    } catch (error) {
      console.error("Error al regenerar el reporte de PumaIA:", error);
      alert("No se pudo conectar con el motor de PumaIA. Revisa la consola o los logs del servidor.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Función interna para parsear de strings con '\n' a arreglos limpios de strings
  const parseBulletList = (bulletString: string): string[] => {
    if (!bulletString) return [];
    return bulletString
      .split('\n')
      .map(line => line.replace(/^[•\s\-*]+/, '').trim()) // Remueve puntos, asteriscos y espacios del inicio de la línea
      .filter(line => line.length > 0);
  };

  // Función para extraer el número entero de compatibilidad (ej: "Match: 95%." -> "95")
  const extractMatchNumber = (desc: string): string => {
    if (!desc) return '0';
    const match = desc.match(/Match:\s*(\d+)%/i);
    return match ? match[1] : '0';
  };

  // Armamos dinámicamente el arreglo de las 5 carreras ordenadas basándonos en tu JSON plano
  const careers = reportData ? [
    { title: reportData.optionA, desc: reportData.descriptionA },
    { title: reportData.optionB, desc: reportData.descriptionB },
    { title: reportData.optionC, desc: reportData.descriptionC },
    { title: reportData.optionD, desc: reportData.descriptionD },
    { title: reportData.optionE, desc: reportData.descriptionE },
  ].filter(c => c.title) : [];

  // Parseamos las listas utilizando nuestra función de desglosamiento limpia
  const strengthsList = parseBulletList(reportData?.meta_strengths);
  const opportunitiesList = parseBulletList(reportData?.meta_opportunities);

  // ESTADO CONTROLADO: Si no hay análisis guardado, pintamos un banner limpio invitando al alumno a generar su primera prueba
  if (!reportData) {
    return (
      <div className={styles.section} style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Análisis profesional</h2>
          <p className={styles.sectionDesc}>
            Aún no cuentas con un análisis psicométrico y académico de PumaIA.
          </p>
        </div>
        <div style={{ margin: '30px auto', maxWidth: '450px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          <p>Presiona el botón inferior para compilar tus respuestas del cuestionario inicial, promedio y materias, y dejar que el motor de IA configure tus 5 rutas profesionales de MAC.</p>
        </div>
        {analyzing ? (
          <AiAnalysisLoader />
        ) : (
          <button className={styles.redoBtn} style={{ margin: '0 auto' }} onClick={handleAnalyze}>
            <RefreshIcon /> Generar análisis por primera vez
          </button>
        )}
      </div>
    );
  }

  // ESTADO CON DATOS: Se pinta cuando la base de datos responde o la IA termina de procesar
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Análisis profesional</h2>
        <p className={styles.sectionDesc}>
          {/* Mostramos la fecha dinámica que regresa el servidor */}
          Generado por PumaIA el {dateStr} con base en tus respuestas y perfil académico.
        </p>
      </div>

      {/* Resumen */}
      <div className={styles.reportSummary}>
        <SparkleIcon />
        <p>{reportData.meta_summary}</p>
      </div>

      {/* Carreras recomendadas */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Rutas profesionales recomendadas</h3>
        <div className={styles.careerList}>
          {careers.map((career, idx) => {
            const pct = extractMatchNumber(career.desc);
            return (
              <div key={idx} className={styles.careerCard}>
                <div className={styles.careerHeader}>
                  <span className={styles.careerTitle}>{career.title}</span>
                  <div className={styles.matchBadge}>
                    <span className={styles.matchNumber}>{pct}%</span>
                    <span className={styles.matchLabel}>compatibilidad</span>
                  </div>
                </div>
                <div className={styles.matchBar}>
                  <div
                    className={styles.matchFill}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={styles.careerDesc}>{career.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fortalezas (Mapeo dinámico elemento por elemento) */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Fortalezas identificadas</h3>
        <ul className={styles.tagList}>
          {strengthsList.map((s, index) => (
            <li key={index} className={styles.strengthTag}>
              <CheckIcon /> {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Áreas de oportunidad (Mapeo dinámico elemento por elemento) */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Áreas de oportunidad</h3>
        <ul className={styles.tagList}>
          {opportunitiesList.map((a, index) => (
            <li key={index} className={styles.growTag}>
              <ArrowIcon /> {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Acción del Loader / Botón de Redo */}
      <div style={{ marginTop: '24px' }}>
        {analyzing ? (
          <AiAnalysisLoader />
        ) : (
          <button className={styles.redoBtn} onClick={handleAnalyze}>
            <RefreshIcon /> Realizar análisis profesional con IA
          </button>
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function AiAnalysisLoader() {
  const steps = [
    'Leyendo tu historial académico...',
    'Analizando tus fortalezas...',
    'Consultando rutas profesionales...',
    'Generando recomendaciones...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.aiLoader}>
      {/* Ícono animado */}
      <div className={styles.aiLoaderIcon}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17"
            stroke="rgba(201,168,76,0.25)" strokeWidth="2" />
          <circle cx="18" cy="18" r="17"
            stroke="rgba(201,168,76,0.85)" strokeWidth="2"
            strokeDasharray="107" strokeDashoffset="27"
            strokeLinecap="round"
            style={{ animation: 'spin 1.4s linear infinite', transformOrigin: 'center' }} />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div className={styles.aiLoaderText}>
        <p className={styles.aiLoaderTitle}>PumaIA está analizando tu perfil</p>
        <p className={styles.aiLoaderStep}>{steps[step]}</p>

        {/* Barra de progreso por pasos */}
        <div className={styles.aiLoaderSteps}>
          {steps.map((_, i) => (
            <div
              key={i}
              className={`${styles.aiLoaderDot} ${i <= step ? styles.aiLoaderDotActive : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}