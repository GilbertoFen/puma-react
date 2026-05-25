'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import { HamburgerIcon } from '../home/HomePage';
import { updateInfoService } from '../../services/updateInfo.service';
import InlineLoader from '../loaders/InlineLoader';
import AppFooter from '../AppFooter';
import styles from './AnalyzePage.module.css';
import { AI_LOGO } from '../../utils/img/assets';
export default function AnalyzePage() {
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userInitial, setUserInitial] = useState('U');

    // Estados de la IA
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [loadingAI, setLoadingAI] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzeStep, setAnalyzeStep] = useState(0);

    const ANALYZE_STEPS = [
        'Leyendo tu historial académico...',
        'Analizando tus fortalezas...',
        'Consultando rutas profesionales...',
        'Generando recomendaciones personalizadas...',
    ];

    useEffect(() => {
        const saved = localStorage.getItem('userData');
        if (saved) {
            try { setUserInitial(JSON.parse(saved)?.initial || 'U'); } catch { }
        }

        updateInfoService.getSavedAiAnalysis()
            .then((data: any) => {
                if (data?.hasAnalysis) {
                    setAiAnalysis(data.data);
                }
            })
            .catch((err) => { console.error("Error cargando análisis guardado", err) })
            .finally(() => setLoadingAI(false));
    }, []);

    // ── 2. Ciclar el loader visual de la IA ──
    useEffect(() => {
        if (!analyzing) return;
        const iv = setInterval(() => {
            setAnalyzeStep(p => (p < ANALYZE_STEPS.length - 1 ? p + 1 : p));
        }, 1100);
        return () => clearInterval(iv);
    }, [analyzing]);

    // ── 3. FUNCIÓN DE GENERACIÓN REAL (Conectada al Backend) ──
    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalyzeStep(0);
        try {
            const res = await updateInfoService.generateNewAiAnalysis();

            if (res && res.hasAnalysis) {
                setAiAnalysis(res.data);
            }
        } catch (err) {
            console.error("Error al regenerar el reporte de PumaIA:", err);
            alert("No se pudo conectar con el motor de PumaIA. Revisa la consola o los logs.");
        } finally {
            setAnalyzing(false);
        }
    };

    const parseBulletList = (bulletString: string): string[] => {
        if (!bulletString) return [];
        return bulletString
            .split('\n')
            .map(line => line.replace(/^[•\s\-*]+/, '').trim())
            .filter(line => line.length > 0);
    };

    const extractMatchNumber = (desc: string): string => {
        if (!desc) return '0';
        const match = desc.match(/Match:\s*(\d+)%/i);
        return match ? match[1] : '0';
    };

    const careers = aiAnalysis ? [
        { title: aiAnalysis.optionA, desc: aiAnalysis.descriptionA },
        { title: aiAnalysis.optionB, desc: aiAnalysis.descriptionB },
        { title: aiAnalysis.optionC, desc: aiAnalysis.descriptionC },
        { title: aiAnalysis.optionD, desc: aiAnalysis.descriptionD },
        { title: aiAnalysis.optionE, desc: aiAnalysis.descriptionE },
    ]
        .filter(c => c.title)
        .map(c => ({
            ...c,
            matchPct: Number(extractMatchNumber(c.desc))
        }))
        .sort((a, b) => b.matchPct - a.matchPct) : [];

    const strengthsList = parseBulletList(aiAnalysis?.meta_strengths);
    const opportunitiesList = parseBulletList(aiAnalysis?.meta_opportunities);

    return (
        <div className={styles.root}>
            <div className={styles.bgMesh} />
            <Navbar showAcatlan userInitial={userInitial} />
            <div className={styles.goldLine} />

            <div className={styles.toolbar}>
                <button className={styles.hamburgerBtn} onClick={() => setDrawerOpen(true)}>
                    <HamburgerIcon />
                </button>
                <span className={styles.toolbarTitle}>Análisis profesional</span>
            </div>

            <HomeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            {drawerOpen && <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />}

            <main className={styles.main}>

                {/* HERO INTRODUCTORIO */}
                <section className={styles.hero}>

                    {/* Columna izquierda — texto */}
                    <div className={styles.heroLeft}>
                        <div className={styles.heroBadge}><SparkleIcon /> Inteligencia Artificial</div>
                        <h1 className={styles.heroTitle}>
                            Tu ruta profesional,<br /><span>analizada por IA</span>
                        </h1>
                        <p className={styles.heroDesc}>
                            PumaIA analiza tu historial académico, materias cursadas, intereses y experiencia
                            para identificar las rutas profesionales donde tienes mayor potencial.
                        </p>
                    </div>

                    <div className={styles.heroRight}>
                        <div className={styles.heroPoweredLogoWrap}>   
                            <div className={styles.heroPoweredRing} />
                            <img
                                src={AI_LOGO}
                                alt="PumaIA"
                                className={styles.heroPoweredLogo}
                            />
                        </div>
                        <div className={styles.heroPoweredText}>
                            <span className={styles.heroPoweredLabel}>Potenciado con nuestro modelo de</span>
                            <span className={styles.heroPoweredBrand}>PUMA IA</span>
                        </div>
                    </div>

                </section>


                {/* BOTÓN O LOADER (Integrado con el backend real) */}
                <section className={styles.actionSection}>
                    {analyzing ? (
                        <div className={styles.aiLoader}>
                            <div className={styles.aiLoaderIcon}>
                                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                    <circle cx="18" cy="18" r="17" stroke="rgba(201,168,76,0.25)" strokeWidth="2" />
                                    <circle cx="18" cy="18" r="17" stroke="rgba(201,168,76,0.85)" strokeWidth="2"
                                        strokeDasharray="107" strokeDashoffset="27" strokeLinecap="round"
                                        style={{ animation: 'spin 1.4s linear infinite', transformOrigin: 'center' }} />
                                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                </svg>
                            </div>
                            <div className={styles.aiLoaderText}>
                                <p className={styles.aiLoaderTitle}>PumaIA está analizando tu perfil</p>
                                <p className={styles.aiLoaderStep}>{ANALYZE_STEPS[analyzeStep]}</p>
                                <div className={styles.aiLoaderSteps}>
                                    {ANALYZE_STEPS.map((_, i) => (
                                        <div key={i} className={`${styles.aiLoaderDot} ${i <= analyzeStep ? styles.aiLoaderDotActive : ''}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button className={styles.analyzeBtn} onClick={handleAnalyze}>
                            <SparkleIcon /> {aiAnalysis ? 'Regenerar análisis con IA' : 'Generar análisis por primera vez'}
                        </button>
                    )}
                </section>

                {/* RENDERIZADO DE RESULTADOS (Lógica Vieja en Estilos Nuevos) */}
                {loadingAI ? (
                    <div className={styles.loadingWrap}>
                        <InlineLoader variant="bar" message="Cargando tu análisis guardado..." />
                    </div>
                ) : careers.length > 0 ? (
                    <section className={styles.resultsSection}>

                        {/* Summary */}
                        <div className={styles.reportSummary} style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <SparkleIcon />
                                <span style={{ color: '#c9a84c', fontWeight: 600, fontSize: '14px' }}>Resumen Ejecutivo</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6' }}>{aiAnalysis.meta_summary}</p>
                        </div>

                        <h2 className={styles.resultsTitle}>Rutas profesionales recomendadas</h2>

                        {/* Tarjetas de carreras */}
                        <div className={styles.careersGrid}>
                            {careers.map((career, idx) => {
                                const pct = career.matchPct;
                                return (
                                    <div key={idx} className={`${styles.careerCard} ${idx === 0 ? styles.careerCardTop : ''}`}>
                                        {/* Como ya está ordenado, el index 0 SIEMPRE será el mejor match */}
                                        {idx === 0 && <div className={styles.topBadge}>⭐ Mejor match</div>}
                                        <div className={styles.careerHeader}>
                                            <h3 className={styles.careerTitle}>{career.title}</h3>
                                            <span className={styles.careerPct}>{pct}%</span>
                                        </div>
                                        <div className={styles.matchBar}>
                                            <div className={styles.matchFill} style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className={styles.careerDesc}>{career.desc}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Listado de Fortalezas parseadas */}
                        {strengthsList.length > 0 && (
                            <div className={styles.strengthsCard}>
                                <h3 className={styles.strengthsTitle}>💪 Fortalezas identificadas</h3>
                                <ul className={styles.strengthsList}>
                                    {strengthsList.map((s, i) => (
                                        <li key={i} className={styles.strengthItem}>
                                            <span className={styles.strengthDot} />{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Listado de Áreas de Oportunidad parseadas */}
                        {opportunitiesList.length > 0 && (
                            <div className={styles.growCard}>
                                <h3 className={styles.growTitle}>🎯 Áreas de oportunidad</h3>
                                <ul className={styles.strengthsList}>
                                    {opportunitiesList.map((a, i) => (
                                        <li key={i} className={styles.strengthItem}>
                                            <span className={styles.arrowDot}>→</span>{a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                ) : !analyzing && (
                    <section className={styles.emptySection}>
                        <div className={styles.emptyCard}>
                            <EmptyIcon />
                            <p className={styles.emptyTitle}>Sin análisis generado aún</p>
                            <p className={styles.emptyDesc}>
                                Presiona el botón de arriba para que PumaIA analice tu perfil completo
                                y te muestre las rutas profesionales donde tienes mayor potencial.
                            </p>
                        </div>
                    </section>
                )}
            </main>
            <AppFooter variant="dark" />
        </div>
    );
}

// ── ÍCONOS COMPLEMENTARIOS ──
function SparkleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
    );
}

function EmptyIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="rgba(201,168,76,0.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
        </svg>
    );
}