'use client';
import React, { useState, useEffect } from 'react';
import { updateInfoService } from '../../services/updateInfo.service';
import styles from './ExtraDataForm.module.css';

export default function ExtraDataForm() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // ── Registros actuales del alumno ──
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [interestError, setInterestError] = useState('');

  const [userCourses, setUserCourses] = useState<any[]>([]);
  const [userScholarships, setUserScholarships] = useState<any[]>([]);
  const [userContests, setUserContests] = useState<any[]>([]);
  const [userLanguages, setUserLanguages] = useState<any[]>([]);
  const [userExperiences, setUserExperiences] = useState<any[]>([]);

  // ── Catálogos globales cargados desde el backend ──
  const [catalogos, setCatalogos] = useState({
    cursos: [] as any[],
    becas: [] as any[],
    concursos: [] as any[],
    idiomas: [] as any[],
    areas: [] as any[],
    categorias: [] as any[],
    skills: [] as any[],
  });

  // ── Modos de agregar o editar ──
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ section: string; id: string } | null>(null);

  // Estados temporales de selección
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedBecaId, setSelectedBecaId] = useState('');
  const [selectedConcursoId, setSelectedConcursoId] = useState('');
  const [selectedIdiomaId, setSelectedIdiomaId] = useState('');
  const [selectedCEFR, setSelectedCEFR] = useState('B2');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [draftExperienciaText, setDraftExperienciaText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── CARGA COMPLETA DE PERFIL Y CATÁLOGOS ──
  const loadAllData = async () => {
    try {
      const [
        profile,
        apiCursos,
        apiBecas,
        apiConcursos,
        apiIdiomas,
        apiAreas,
        apiCategorias,
        apiSkills,
      ] = await Promise.all([
        updateInfoService.getProfileSummary(),
        updateInfoService.getGlobalCourses().catch(() => []),
        updateInfoService.getGlobalScholarships().catch(() => []),
        updateInfoService.getGlobalContests().catch(() => []),
        updateInfoService.getGlobalLanguages().catch(() => []),
        updateInfoService.getGlobalAreasExpertise().catch(() => []),
        updateInfoService.getGlobalCategories().catch(() => []),
        updateInfoService.getGlobalSkills().catch(() => []),
      ]);

      setStudentId(profile.id);

      // 1. Intereses como lista de tags limpios
      const rawInterest = profile.interest || '';
      const parsedInterests = rawInterest
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      setInterestsList(parsedInterests);

      // 2. Relaciones del estudiante
      setUserCourses(profile.courses || []);
      setUserScholarships(profile.schoolarships || []);
      setUserContests(profile.contests || []);
      setUserLanguages(profile.languages || []);
      setUserExperiences(profile.experiences || []);

      // 3. Catálogos globales
      setCatalogos({
        cursos: apiCursos,
        becas: apiBecas,
        concursos: apiConcursos,
        idiomas: apiIdiomas,
        areas: apiAreas,
        categorias: apiCategorias,
        skills: apiSkills,
      });

      // Valores por defecto
      if (apiCursos.length > 0) setSelectedCursoId(apiCursos[0].id);
      if (apiBecas.length > 0) setSelectedBecaId(apiBecas[0].id);
      if (apiConcursos.length > 0) setSelectedConcursoId(apiConcursos[0].id);
      if (apiIdiomas.length > 0) setSelectedIdiomaId(apiIdiomas[0].id);
      if (apiAreas.length > 0) setSelectedAreaId(apiAreas[0].id);
      if (apiCategorias.length > 0) setSelectedCategoriaId(apiCategorias[0].id);
      if (apiSkills.length > 0) setSelectedCEFR(apiSkills[0].id);
    } catch (err) {
      console.error('Error cargando perfil y catálogos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setSaveStatus('done');
    setTimeout(() => {
      setSaveStatus('idle');
      setFeedbackMsg('');
    }, 2800);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 1. GESTIÓN DE INTERESES (Agregar sin duplicados, eliminar, persistir)
  // ═════════════════════════════════════════════════════════════════════════
  const handleAddInterest = async () => {
    const candidate = newInterestInput.trim();
    if (!candidate) return;

    // Validación de duplicados (case-insensitive)
    const exists = interestsList.some(
      (item) => item.toLowerCase() === candidate.toLowerCase()
    );
    if (exists) {
      setInterestError(`El interés "${candidate}" ya se encuentra registrado.`);
      setTimeout(() => setInterestError(''), 3000);
      return;
    }

    const updated = [...interestsList, candidate];
    setSaveStatus('saving');
    try {
      await updateInfoService.updateInterests(updated.join(', '));
      setInterestsList(updated);
      setNewInterestInput('');
      triggerFeedback('Interés agregado correctamente');
    } catch (err) {
      console.error('Error al agregar interés:', err);
      alert('No se pudo guardar el interés.');
      setSaveStatus('idle');
    }
  };

  const handleRemoveInterest = async (indexToRemove: number) => {
    const updated = interestsList.filter((_, idx) => idx !== indexToRemove);
    setSaveStatus('saving');
    try {
      await updateInfoService.updateInterests(updated.join(', '));
      setInterestsList(updated);
      triggerFeedback('Interés eliminado');
    } catch (err) {
      console.error('Error al eliminar interés:', err);
      alert('No se pudo eliminar el interés.');
      setSaveStatus('idle');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 2. CURSOS (Agregar, Editar, Eliminar)
  // ═════════════════════════════════════════════════════════════════════════
  const handleSaveCourse = async () => {
    if (!selectedCursoId) return;
    setSaveStatus('saving');
    try {
      if (editingItem?.section === 'cursos') {
        await updateInfoService.updateCourseUser(editingItem.id, selectedCursoId);
        triggerFeedback('Curso actualizado correctamente');
      } else {
        await updateInfoService.addCourse(selectedCursoId, studentId);
        triggerFeedback('Curso asociado correctamente');
      }
      setAddingSection(null);
      setEditingItem(null);
      await loadAllData();
    } catch (err) {
      console.error('Error guardando curso:', err);
      alert('No fue posible guardar el curso.');
      setSaveStatus('idle');
    }
  };

  const handleDeleteCourse = async (courseUserId: string) => {
    if (!confirm('¿Deseas desvincular este curso de tu perfil?')) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.removeCourse(courseUserId);
      triggerFeedback('Curso eliminado de tu perfil');
      await loadAllData();
    } catch (err) {
      console.error('Error eliminando curso:', err);
      alert('No se pudo eliminar el curso.');
      setSaveStatus('idle');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 3. CONCURSOS (Agregar, Editar, Eliminar)
  // ═════════════════════════════════════════════════════════════════════════
  const handleSaveContest = async () => {
    if (!selectedConcursoId) return;
    setSaveStatus('saving');
    try {
      if (editingItem?.section === 'concursos') {
        await updateInfoService.updateContestEnrollment(editingItem.id, selectedConcursoId);
        triggerFeedback('Inscripción al concurso actualizada');
      } else {
        await updateInfoService.enrollInContest(selectedConcursoId, studentId);
        triggerFeedback('Concurso registrado exitosamente');
      }
      setAddingSection(null);
      setEditingItem(null);
      await loadAllData();
    } catch (err) {
      console.error('Error guardando concurso:', err);
      alert('No se pudo registrar el concurso.');
      setSaveStatus('idle');
    }
  };

  const handleDeleteContest = async (enrollmentId: string) => {
    if (!confirm('¿Deseas retirar este concurso de tu perfil?')) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.removeContest(enrollmentId);
      triggerFeedback('Concurso retirado correctamente');
      await loadAllData();
    } catch (err) {
      console.error('Error retirando concurso:', err);
      alert('No se pudo retirar el concurso.');
      setSaveStatus('idle');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 4. IDIOMAS (Agregar, Editar, Eliminar)
  // ═════════════════════════════════════════════════════════════════════════
  const handleSaveLanguage = async () => {
    if (!selectedIdiomaId) return;
    setSaveStatus('saving');
    try {
      if (editingItem?.section === 'idiomas') {
        await updateInfoService.updateLanguageUser(editingItem.id, {
          languageId: selectedIdiomaId,
          skillId: selectedCEFR,
        });
        triggerFeedback('Idioma actualizado');
      } else {
        await updateInfoService.addLanguage({
          studentId,
          languageId: selectedIdiomaId,
          skillId: selectedCEFR,
        });
        triggerFeedback('Idioma acreditado correctamente');
      }
      setAddingSection(null);
      setEditingItem(null);
      await loadAllData();
    } catch (err) {
      console.error('Error guardando idioma:', err);
      alert('No se pudo guardar el idioma.');
      setSaveStatus('idle');
    }
  };

  const handleDeleteLanguage = async (languageUserId: string) => {
    if (!confirm('¿Deseas eliminar este idioma acreditado?')) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.removeLanguage(languageUserId);
      triggerFeedback('Idioma retirado');
      await loadAllData();
    } catch (err) {
      console.error('Error eliminando idioma:', err);
      alert('No se pudo retirar el idioma.');
      setSaveStatus('idle');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 5. BECAS (Agregar, Eliminar)
  // ═════════════════════════════════════════════════════════════════════════
  const handleSaveScholarship = async () => {
    if (!selectedBecaId) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.addScholarship(selectedBecaId, studentId);
      triggerFeedback('Beca registrada');
      setAddingSection(null);
      await loadAllData();
    } catch (err) {
      console.error('Error asignando beca:', err);
      alert('No se pudo registrar la beca.');
      setSaveStatus('idle');
    }
  };

  const handleDeleteScholarship = async (scholarshipUserId: string) => {
    if (!confirm('¿Deseas eliminar este registro de beca?')) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.removeScholarship(scholarshipUserId);
      triggerFeedback('Beca desvinculada');
      await loadAllData();
    } catch (err) {
      console.error('Error eliminando beca:', err);
      alert('No se pudo eliminar la beca.');
      setSaveStatus('idle');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 6. EXPERIENCIA PROFESIONAL (Agregar, Editar, Eliminar, Análisis IA)
  // ═════════════════════════════════════════════════════════════════════════
  const handleAnalyzeExperience = async () => {
    if (!draftExperienciaText.trim()) return;
    setIsAnalyzing(true);
    setSaveStatus('saving');
    try {
      await updateInfoService.analyzeExperience(draftExperienciaText);
      triggerFeedback('Experiencia analizada y guardada por PumaIA');
      setAddingSection(null);
      setDraftExperienciaText('');
      await loadAllData();
    } catch (err) {
      console.error('Error analizando experiencia:', err);
      alert('No fue posible procesar la experiencia con IA.');
      setSaveStatus('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDirectExperience = async () => {
    if (!selectedAreaId || !selectedCategoriaId) return;
    setSaveStatus('saving');
    try {
      if (editingItem?.section === 'experiencia') {
        await updateInfoService.updateProfessionalExperience(editingItem.id, {
          areaExpertiseId: selectedAreaId,
          categoryId: selectedCategoriaId,
        });
        triggerFeedback('Experiencia actualizada');
      } else {
        await updateInfoService.addProfessionalExperience({
          studentId,
          areaExpertiseId: selectedAreaId,
          categoryId: selectedCategoriaId,
        });
        triggerFeedback('Experiencia guardada exitosamente');
      }
      setAddingSection(null);
      setEditingItem(null);
      await loadAllData();
    } catch (err) {
      console.error('Error guardando experiencia:', err);
      alert('No se pudo guardar la experiencia profesional.');
      setSaveStatus('idle');
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('¿Deseas eliminar este registro de experiencia?')) return;
    setSaveStatus('saving');
    try {
      await updateInfoService.removeProfessionalExperience(experienceId);
      triggerFeedback('Experiencia eliminada');
      await loadAllData();
    } catch (err) {
      console.error('Error eliminando experiencia:', err);
      alert('No se pudo eliminar la experiencia.');
      setSaveStatus('idle');
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#bb8800', padding: '20px' }}>
        Cargando catálogos profesionales y perfil...
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Datos de experiencia y perfil</h3>
        <p className={styles.sectionDesc}>
          Esta información complementa tu análisis profesional y ayuda a PumaIA a darte
          recomendaciones más precisas. Puedes consultar, añadir, editar y eliminar cada registro.
        </p>
      </div>

      <div className={styles.fieldGrid}>
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 1. INTERESES DEL ALUMNO (Chips dinámicos con borrado + input)    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Intereses del Alumno</label>
          </div>

          {interestsList.length > 0 ? (
            <div className={styles.tagsList}>
              {interestsList.map((interest, idx) => (
                <span key={`${interest}-${idx}`} className={styles.tagChip}>
                  <span>{interest}</span>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => handleRemoveInterest(idx)}
                    title={`Quitar "${interest}"`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has registrado intereses aún</span>
            </div>
          )}

          {/* Formulario para agregar un nuevo interés */}
          <div className={styles.addInputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: Inteligencia Artificial, Ciberseguridad, Finanzas..."
              value={newInterestInput}
              onChange={(e) => setNewInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
            />
            <button
              type="button"
              className={styles.addInputBtn}
              onClick={handleAddInterest}
            >
              + Agregar
            </button>
          </div>
          {interestError && (
            <span style={{ fontSize: '11px', color: '#f87171' }}>{interestError}</span>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 2. CURSOS REALIZADOS                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Cursos Realizados</label>
            {addingSection !== 'cursos' && !editingItem && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setAddingSection('cursos');
                  if (catalogos.cursos.length > 0) setSelectedCursoId(catalogos.cursos[0].id);
                }}
              >
                <PlusIcon /> Asociar Curso
              </button>
            )}
          </div>

          {userCourses.length > 0 ? (
            <div className={styles.itemsList}>
              {userCourses.map((c) => (
                <div key={c.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{c.course?.name || 'Curso'}</span>
                    {c.course?.category && (
                      <span className={styles.itemSubtitle}>{c.course.category.name}</span>
                    )}
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemBtn}
                      title="Editar curso"
                      onClick={() => {
                        setEditingItem({ section: 'cursos', id: c.id });
                        setSelectedCursoId(c.courseId);
                        setAddingSection(null);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemBtn} ${styles.itemBtnDelete}`}
                      title="Eliminar curso"
                      onClick={() => handleDeleteCourse(c.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has registrado cursos</span>
            </div>
          )}

          {/* Formulario de agregar o editar curso */}
          {(addingSection === 'cursos' || editingItem?.section === 'cursos') && (
            <div className={styles.inlineEditBox}>
              <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
                {editingItem ? 'Modificar curso:' : 'Selecciona un curso del catálogo:'}
              </span>
              <CustomSelect
                options={catalogos.cursos.map((c) => ({ id: c.id, label: c.name }))}
                value={selectedCursoId}
                onChange={setSelectedCursoId}
                placeholder="Selecciona un curso"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setAddingSection(null);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </button>
                <button className={styles.saveBtn} onClick={handleSaveCourse}>
                  {editingItem ? 'Guardar Cambios' : 'Vincular'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 3. CONCURSOS REALIZADOS                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Concursos Realizados</label>
            {addingSection !== 'concursos' && !editingItem && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setAddingSection('concursos');
                  if (catalogos.concursos.length > 0)
                    setSelectedConcursoId(catalogos.concursos[0].id);
                }}
              >
                <PlusIcon /> Registrar Concurso
              </button>
            )}
          </div>

          {userContests.length > 0 ? (
            <div className={styles.itemsList}>
              {userContests.map((cn) => (
                <div key={cn.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{cn.contest?.name || 'Concurso'}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemBtn}
                      title="Editar concurso"
                      onClick={() => {
                        setEditingItem({ section: 'concursos', id: cn.id });
                        setSelectedConcursoId(cn.contestId);
                        setAddingSection(null);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemBtn} ${styles.itemBtnDelete}`}
                      title="Eliminar concurso"
                      onClick={() => handleDeleteContest(cn.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has registrado concursos</span>
            </div>
          )}

          {(addingSection === 'concursos' || editingItem?.section === 'concursos') && (
            <div className={styles.inlineEditBox}>
              <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
                {editingItem ? 'Modificar concurso:' : 'Selecciona el concurso:'}
              </span>
              <CustomSelect
                options={catalogos.concursos.map((c) => ({ id: c.id, label: c.name }))}
                value={selectedConcursoId}
                onChange={setSelectedConcursoId}
                placeholder="Selecciona un concurso"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setAddingSection(null);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </button>
                <button className={styles.saveBtn} onClick={handleSaveContest}>
                  {editingItem ? 'Guardar Cambios' : 'Inscribir'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 4. IDIOMAS ACREDITADOS                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Idiomas Acreditados</label>
            {addingSection !== 'idiomas' && !editingItem && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setAddingSection('idiomas');
                  if (catalogos.idiomas.length > 0)
                    setSelectedIdiomaId(catalogos.idiomas[0].id);
                  if (catalogos.skills.length > 0) setSelectedCEFR(catalogos.skills[0].id);
                }}
              >
                <PlusIcon /> Agregar Idioma
              </button>
            )}
          </div>

          {userLanguages.length > 0 ? (
            <div className={styles.itemsList}>
              {userLanguages.map((l) => (
                <div key={l.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{l.language?.name || 'Idioma'}</span>
                    <span className={styles.itemSubtitle}>
                      Nivel: {l.skill?.proficiency || l.skill?.name || 'Acreditado'}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemBtn}
                      title="Editar nivel / idioma"
                      onClick={() => {
                        setEditingItem({ section: 'idiomas', id: l.id });
                        setSelectedIdiomaId(l.languageId);
                        setSelectedCEFR(l.skillId);
                        setAddingSection(null);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemBtn} ${styles.itemBtnDelete}`}
                      title="Eliminar idioma"
                      onClick={() => handleDeleteLanguage(l.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has registrado idiomas</span>
            </div>
          )}

          {(addingSection === 'idiomas' || editingItem?.section === 'idiomas') && (
            <div className={styles.inlineEditBox}>
              <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
                {editingItem ? 'Modificar idioma:' : 'Registrar nuevo idioma:'}
              </span>
              <CustomSelect
                options={catalogos.idiomas.map((l) => ({ id: l.id, label: l.name }))}
                value={selectedIdiomaId}
                onChange={setSelectedIdiomaId}
                placeholder="Selecciona un idioma"
              />
              <CustomSelect
                options={
                  catalogos.skills.length > 0
                    ? catalogos.skills.map((s) => ({
                        id: s.id,
                        label: `${s.proficiency || s.name} — ${s.name}`,
                      }))
                    : [
                        { id: 'A1', label: 'A1 — Principiante' },
                        { id: 'A2', label: 'A2 — Elemental' },
                        { id: 'B1', label: 'B1 — Intermedio' },
                        { id: 'B2', label: 'B2 — Intermedio Avanzado' },
                        { id: 'C1', label: 'C1 — Avanzado' },
                        { id: 'C2', label: 'C2 — Maestría Nativa' },
                      ]
                }
                value={selectedCEFR}
                onChange={setSelectedCEFR}
                placeholder="Nivel de certificación (CEFR)"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setAddingSection(null);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </button>
                <button className={styles.saveBtn} onClick={handleSaveLanguage}>
                  {editingItem ? 'Guardar Cambios' : 'Guardar Idioma'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 5. BECAS SOLICITADAS                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Becas Solicitadas</label>
            {addingSection !== 'becas' && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setAddingSection('becas');
                  if (catalogos.becas.length > 0) setSelectedBecaId(catalogos.becas[0].id);
                }}
              >
                <PlusIcon /> Registrar Beca
              </button>
            )}
          </div>

          {userScholarships.length > 0 ? (
            <div className={styles.itemsList}>
              {userScholarships.map((b) => (
                <div key={b.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{b.schoolarship?.name || 'Beca'}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={`${styles.itemBtn} ${styles.itemBtnDelete}`}
                      title="Eliminar beca"
                      onClick={() => handleDeleteScholarship(b.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has registrado becas</span>
            </div>
          )}

          {addingSection === 'becas' && (
            <div className={styles.inlineEditBox}>
              <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
                Selecciona la beca:
              </span>
              <CustomSelect
                options={catalogos.becas.map((b) => ({ id: b.id, label: b.name }))}
                value={selectedBecaId}
                onChange={setSelectedBecaId}
                placeholder="Selecciona una beca"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className={styles.cancelBtn} onClick={() => setAddingSection(null)}>
                  Cancelar
                </button>
                <button className={styles.saveBtn} onClick={handleSaveScholarship}>
                  Asignar Beca
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 6. EXPERIENCIA PROFESIONAL                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Experiencia Profesional</label>
            {addingSection !== 'experiencia' && !editingItem && (
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setAddingSection('experiencia');
                  setDraftExperienciaText('');
                }}
              >
                <PlusIcon /> Agregar Puesto / Experiencia
              </button>
            )}
          </div>

          {userExperiences.length > 0 ? (
            <div className={styles.itemsList}>
              {userExperiences.map((exp) => (
                <div key={exp.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>
                      {exp.areaExpertise?.name || 'Experiencia'}
                    </span>
                    {exp.category && (
                      <span className={styles.itemSubtitle}>
                        Categoría: {exp.category.name}
                      </span>
                    )}
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.itemBtn}
                      title="Editar experiencia"
                      onClick={() => {
                        setEditingItem({ section: 'experiencia', id: exp.id });
                        setSelectedAreaId(exp.areaExpertiseId);
                        setSelectedCategoriaId(exp.categoryId);
                        setAddingSection(null);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={`${styles.itemBtn} ${styles.itemBtnDelete}`}
                      title="Eliminar experiencia"
                      onClick={() => handleDeleteExperience(exp.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyValue}>
              <span>No has agregado experiencia profesional</span>
            </div>
          )}

          {/* Formulario de Experiencia */}
          {addingSection === 'experiencia' && (
            <div className={styles.inlineEditBox}>
              <p style={{ fontSize: '11.5px', color: '#c9a84c', marginBottom: '4px' }}>
                Opción A: Describe tu experiencia laboral con tus propias palabras y PumaIA la
                clasificará automáticamente.
              </p>
              <textarea
                className={styles.textarea}
                value={draftExperienciaText}
                onChange={(e) => setDraftExperienciaText(e.target.value)}
                placeholder="Ej: Fui desarrollador backend usando Node.js y bases de datos SQL durante 6 meses..."
                rows={3}
                disabled={isAnalyzing}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setAddingSection(null)}
                  disabled={isAnalyzing}
                >
                  Cancelar
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleAnalyzeExperience}
                  disabled={isAnalyzing || !draftExperienciaText.trim()}
                >
                  {isAnalyzing ? 'Analizando con IA...' : 'Analizar y Guardar'}
                </button>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  marginTop: '10px',
                  paddingTop: '10px',
                }}
              >
                <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  Opción B: O selecciona manualmente el área y categoría:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <CustomSelect
                    options={catalogos.areas.map((a) => ({ id: a.id, label: a.name }))}
                    value={selectedAreaId}
                    onChange={setSelectedAreaId}
                    placeholder="Área de especialidad"
                  />
                  <CustomSelect
                    options={catalogos.categorias.map((c) => ({ id: c.id, label: c.name }))}
                    value={selectedCategoriaId}
                    onChange={setSelectedCategoriaId}
                    placeholder="Categoría macro"
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className={styles.saveBtn}
                      onClick={handleSaveDirectExperience}
                      disabled={!selectedAreaId || !selectedCategoriaId}
                    >
                      Guardar Manualmente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editingItem?.section === 'experiencia' && (
            <div className={styles.inlineEditBox}>
              <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
                Modificar área y categoría de experiencia:
              </span>
              <CustomSelect
                options={catalogos.areas.map((a) => ({ id: a.id, label: a.name }))}
                value={selectedAreaId}
                onChange={setSelectedAreaId}
                placeholder="Área de especialidad"
              />
              <CustomSelect
                options={catalogos.categorias.map((c) => ({ id: c.id, label: c.name }))}
                value={selectedCategoriaId}
                onChange={setSelectedCategoriaId}
                placeholder="Categoría macro"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>
                  Cancelar
                </button>
                <button className={styles.saveBtn} onClick={handleSaveDirectExperience}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {saveStatus === 'saving' && (
        <div className={styles.savedMsg} style={{ color: '#bb8800' }}>
          Guardando cambios en PumaIA...
        </div>
      )}
      {saveStatus === 'done' && (
        <div className={styles.savedMsg}>
          <CheckIcon /> {feedbackMsg || 'Perfil actualizado correctamente'}
        </div>
      )}
    </div>
  );
}

// ── Select visual interactivo ──
type SelectOption = { id: string; label: string };

type CustomSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
};

function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`${styles.selectWrap} ${open ? styles.selectWrapOpen : ''}`} ref={ref}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selected ? styles.selectValue : styles.selectPlaceholder}>
          {selected ? selected.label : placeholder || 'Selecciona una opción'}
        </span>
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div className={styles.selectDropdown}>
          {options.length === 0 ? (
            <div className={styles.selectOption} style={{ opacity: 0.5 }}>
              No hay opciones disponibles
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.selectOption} ${option.id === value ? styles.selectOptionActive : ''}`}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                {option.id === value && <CheckIcon />}
                <span>{option.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
