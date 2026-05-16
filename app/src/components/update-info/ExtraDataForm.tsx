'use client';
import React, { useState, useEffect } from 'react';
import { updateInfoService } from '../../services/updateInfo.service';
import styles from './ExtraDataForm.module.css';

export default function ExtraDataForm() {
  // Datos del estudiante (visualización en texto plano)
  const [studentId, setStudentId] = useState('');
  const [savedData, setSavedData] = useState({
    intereses: '',
    concursos: '',
    cursos: '',
    becas: '',
    experiencia: '',
    idiomas: '',
  });

  // Catálogos globales cargados desde el Back
  const [catalogos, setCatalogos] = useState({
    cursos: [] as any[],
    becas: [] as any[],
    concursos: [] as any[],
    idiomas: [] as any[],
    areas: [] as any[],
    categorias: [] as any[],
    skills: [] as any[],
  });

  // Estados de edición y control
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [loading, setLoading] = useState(true);

  // Estados temporales para capturar las selecciones del usuario
  const [draftIntereses, setDraftIntereses] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedBecaId, setSelectedBecaId] = useState('');
  const [selectedConcursoId, setSelectedConcursoId] = useState('');
  const [selectedIdiomaId, setSelectedIdiomaId] = useState('');
  const [selectedCEFR, setSelectedCEFR] = useState('B2');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');

  // CARGA DE DATOS MAESTRA
  const loadAllData = async () => {
    try {
      const [profile, apiCursos, apiBecas, apiConcursos, apiIdiomas, apiAreas, apiCategorias, apiSkills] = await Promise.all([
        updateInfoService.getProfileSummary(),
        updateInfoService.getGlobalCourses().catch(() => []),
        updateInfoService.getGlobalScholarships().catch(() => []),
        updateInfoService.getGlobalContests().catch(() => []),
        updateInfoService.getGlobalLanguages().catch(() => []),
        updateInfoService.getGlobalAreasExpertise().catch(() => []),
        updateInfoService.getGlobalCategories().catch(() => []),
        updateInfoService.getGlobalSkills().catch(() => []), // <-- Descarga real
      ]);

      setStudentId(profile.id);

      // Formateo visual a strings strings separados por comas
      setSavedData({
        intereses: profile.interest || '',
        cursos: profile.courses?.map((c: any) => c.course?.name).filter(Boolean).join(', ') || '',
        becas: profile.schoolarships?.map((s: any) => s.schoolarship?.name).filter(Boolean).join(', ') || '',
        concursos: profile.contests?.map((cn: any) => cn.contest?.name).filter(Boolean).join(', ') || '',
        experiencia: profile.experiences?.map((e: any) => `${e.areaExpertise?.name || ''}`).filter(Boolean).join(', ') || '',
        // Muestra el nombre descriptivo de la habilidad que viene de la relación
        idiomas: profile.languages?.map((l: any) => `${l.language?.name || ''} [${l.skill?.name || 'CEFR'}]`).filter(Boolean).join(', ') || '',
      });

      setCatalogos({
        cursos: apiCursos,
        becas: apiBecas,
        concursos: apiConcursos,
        idiomas: apiIdiomas,
        areas: apiAreas,
        categorias: apiCategorias,
        skills: apiSkills,
      });

      // Inicializar selectores por defecto
      if (apiCursos.length > 0) setSelectedCursoId(apiCursos[0].id);
      if (apiBecas.length > 0) setSelectedBecaId(apiBecas[0].id);
      if (apiConcursos.length > 0) setSelectedConcursoId(apiConcursos[0].id);
      if (apiIdiomas.length > 0) setSelectedIdiomaId(apiIdiomas[0].id);
      if (apiAreas.length > 0) setSelectedAreaId(apiAreas[0].id);
      if (apiCategorias.length > 0) setSelectedCategoriaId(apiCategorias[0].id);
      if (apiSkills.length > 0) setSelectedCEFR(apiSkills[0].id);

    } catch (err) {
      console.error("Error cargando catálogos y resumen de perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveField = async (field: string) => {
    setSaveStatus('saving');
    try {
      switch (field) {
        case 'intereses':
          await updateInfoService.updateInterests(draftIntereses);
          break;
        case 'cursos':
          if (selectedCursoId) await updateInfoService.addCourse(selectedCursoId, studentId);
          break;
        case 'becas':
          if (selectedBecaId) await updateInfoService.addScholarship(selectedBecaId, studentId);
          break;
        case 'concursos':
          if (selectedConcursoId) await updateInfoService.enrollInContest(selectedConcursoId, studentId);
          break;
        case 'idiomas':
          if (selectedIdiomaId) {
            await updateInfoService.addLanguage({
              studentId,
              languageId: selectedIdiomaId,
              skillId: selectedCEFR
            });
          }
          break;
        case 'experiencia':
          if (selectedAreaId && selectedCategoriaId) {
            await updateInfoService.addProfessionalExperience({
              studentId,
              areaExpertiseId: selectedAreaId,
              categoryId: selectedCategoriaId
            });
          }
          break;
      }
      setSaveStatus('done');
      setEditingField(null);
      await loadAllData(); // Recarga automática de la foto de la BD
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error("Error al guardar campo:", err);
      setSaveStatus('idle');
    }
  };

  if (loading) {
    return <div style={{ color: '#bb8800', padding: '20px' }}>Cargando catálogos profesionales de la BD...</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Datos de experiencia y perfil</h3>
        <p className={styles.sectionDesc}>
          Esta información complementa tu análisis profesional y ayuda a PumaIA a darte recomendaciones más precisas.
        </p>
      </div>

      <div className={styles.fieldGrid}>

        {/* 1. INTERESES (Texto libre condicionado) */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Intereses del Alumno</label>
            {editingField !== 'intereses' && (
              <button className={styles.actionBtn} onClick={() => { setDraftIntereses(savedData.intereses); setEditingField('intereses'); }}>
                {savedData.intereses ? <><EditIcon /> Editar</> : <><PlusIcon /> Agregar Interés</>}
              </button>
            )}
          </div>
          {editingField === 'intereses' ? (
            <div className={styles.editBlock}>
              <textarea
                className={styles.textarea}
                value={draftIntereses}
                onChange={(e) => setDraftIntereses(e.target.value)}
                placeholder="Ej: Inteligencia artificial, música, fotografía..."
                rows={2}
                autoFocus
              />
              <div className={styles.editActions} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('intereses')}>Guardar</button>
              </div>
            </div>
          ) : savedData.intereses ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.intereses}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has agregado intereses aún</span></div>
          )}
        </div>

        {/* 2. CURSOS (Selector) */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Cursos Realizados</label>
            {editingField !== 'cursos' && (
              <button className={styles.actionBtn} onClick={() => setEditingField('cursos')}>
                <PlusIcon /> Asociar Curso
              </button>
            )}
          </div>
          {editingField === 'cursos' ? (
            <div className={styles.editBlock}>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedCursoId} onChange={(e) => setSelectedCursoId(e.target.value)}>
                {catalogos.cursos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className={styles.editActions} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('cursos')}>Vincular</button>
              </div>
            </div>
          ) : savedData.cursos ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.cursos}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has registrado cursos</span></div>
          )}
        </div>

        {/* 3. BECAS (Selector) */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Becas Solicitadas</label>
            {editingField !== 'becas' && (
              <button className={styles.actionBtn} onClick={() => setEditingField('becas')}>
                <PlusIcon /> Registrar Beca
              </button>
            )}
          </div>
          {editingField === 'becas' ? (
            <div className={styles.editBlock}>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedBecaId} onChange={(e) => setSelectedBecaId(e.target.value)}>
                {catalogos.becas.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className={styles.editActions} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('becas')}>Asignar</button>
              </div>
            </div>
          ) : savedData.becas ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.becas}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has registrado becas</span></div>
          )}
        </div>

        {/* 4. CONCURSOS (Selector) */}
        <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Concursos Realizados</label>
            {editingField !== 'concursos' && (
              <button className={styles.actionBtn} onClick={() => setEditingField('concursos')}>
                <PlusIcon /> Registrar Concurso
              </button>
            )}
          </div>
          {editingField === 'concursos' ? (
            <div className={styles.editBlock}>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedConcursoId} onChange={(e) => setSelectedConcursoId(e.target.value)}>
                {catalogos.concursos.map((cn) => <option key={cn.id} value={cn.id}>{cn.name}</option>)}
              </select>
              <div className={styles.editActions} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('concursos')}>Inscribir</button>
              </div>
            </div>
          ) : savedData.concursos ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.concursos}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has registrado concursos</span></div>
          )}
        </div>

        {/* 5. IDIOMAS (Doble Selector: Idioma + Nivel) */}
        <div className={`${styles.fieldWrap}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Idiomas Acreditados</label>
            {editingField !== 'idiomas' && (
              <button className={styles.actionBtn} onClick={() => setEditingField('idiomas')}>
                <PlusIcon /> Agregar Idioma
              </button>
            )}
          </div>
          {editingField === 'idiomas' ? (
            <div className={styles.editBlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedIdiomaId} onChange={(e) => setSelectedIdiomaId(e.target.value)}>
                {catalogos.idiomas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedCEFR} onChange={(e) => setSelectedCEFR(e.target.value)}>
                <option value="A1">A1 - Principiante</option>
                <option value="A2">A2 - Elemental</option>
                <option value="B1">B1 - Intermedio</option>
                <option value="B2">B2 - Intermedio Avanzado</option>
                <option value="C1">C1 - Avanzado</option>
                <option value="C2">C2 - Maestría Nativa</option>
              </select>
              <div className={styles.editActions} style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('idiomas')}>Guardar</button>
              </div>
            </div>
          ) : savedData.idiomas ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.idiomas}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has registrado idiomas</span></div>
          )}
        </div>

        {/* 6. EXPERIENCIA PROFESIONAL (Doble Selector Exclusivo: Área + Categoría macro) */}
        <div className={`${styles.fieldWrap}`}>
          <div className={styles.fieldHeader}>
            <label className={styles.label}>Experiencia Profesional</label>
            {editingField !== 'experiencia' && (
              <button className={styles.actionBtn} onClick={() => setEditingField('experiencia')}>
                <PlusIcon /> Agregar Puesto
              </button>
            )}
          </div>
          {/*   SELECTOR DE EXPERIENCIA Y DE CATEGORIAS */}
          {editingField === 'experiencia' ? (
            <div className={styles.editBlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#bb8800' }}>Selecciona el Área de Especialización:</span>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}>
                {catalogos.areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
              <span style={{ fontSize: '11px', color: '#bb8800' }}>Selecciona la Categoría Asociada:</span>
              <select className={styles.input} style={{ background: '#0a1424', color: 'white' }} value={selectedCategoriaId} onChange={(e) => setSelectedCategoriaId(e.target.value)}>
                {catalogos.categorias.map((ct) => <option key={ct.id} value={ct.id}>{ct.category}</option>)}
              </select>
              <div className={styles.editActions} style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.cancelBtn} onClick={() => setEditingField(null)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={() => handleSaveField('experiencia')}>Vincular Perfil</button>
              </div>
            </div>
          ) : savedData.experiencia ? (
            <div className={styles.savedValue}><CheckBadgeIcon /> <span>{savedData.experiencia}</span></div>
          ) : (
            <div className={styles.emptyValue}><span>No has agregado experiencia profesional</span></div>
          )}
        </div>

      </div>

      {saveStatus === 'saving' && <div className={styles.savedMsg} style={{ color: '#bb8800' }}>Guardando en Supabase...</div>}
      {saveStatus === 'done' && <div className={styles.savedMsg}><CheckIcon /> Perfil actualizado correctamente</div>}
    </div>
  );
}

// Iconos Svg Auxiliares permanecen igual abajo...
function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function EditIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function CheckBadgeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>; }