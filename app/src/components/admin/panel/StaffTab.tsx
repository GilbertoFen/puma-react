'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { ApiError, adminService } from '../../../services/admin.service';
import type { InviteStaffPayload, ProfessorCandidate, RoleType } from '../../../types/adminMetrics.types';
import { Card, useAsync } from './common';
import { fmtDateTime, fmtInt } from './charts';

type StaffRole = Exclude<RoleType, 'STUDENT'>;

const ROLE_LABEL: Record<RoleType, string> = {
  PROFESSOR: 'Profesor',
  INSTITUTION_ADMIN: 'Administrador',
  ANALYST: 'Analista',
  STUDENT: 'Alumno',
};

const fullName = (p: { name: string; lastNameP: string; lastNameM: string | null }) =>
  [p.name, p.lastNameP, p.lastNameM].filter(Boolean).join(' ');

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Explica en español el código seguro que manda el backend cuando el correo no salió. */
export function emailErrorText(code: string | null): string {
  if (!code) return 'no se pudo enviar el correo';
  if (code === 'NO_PROVIDER_CONFIGURED') return 'el servidor no tiene un proveedor de correo configurado';
  if (code === 'DELIVERY_REQUIRED_FAILED') return 'el servicio de correo no respondió';
  if (code === 'WEBHOOK_TIMEOUT') return 'el servicio de correo (n8n) no respondió en 10 segundos';
  if (code === 'WEBHOOK_NETWORK_ERROR') return 'no se pudo conectar con el servicio de correo (n8n)';
  if (code === 'WEBHOOK_HTTP_401') return 'el servicio de correo rechazó la clave del servidor (HTTP 401)';
  if (code.startsWith('WEBHOOK_HTTP_5'))
    return `el servicio de correo no pudo enviarlo con Gmail (HTTP ${code.slice('WEBHOOK_HTTP_'.length)})`;
  if (code.startsWith('WEBHOOK_HTTP_'))
    return `el servicio de correo respondió HTTP ${code.slice('WEBHOOK_HTTP_'.length)}`;
  if (code.startsWith('SMTP_')) return `el servidor de correo de pruebas rechazó el envío (${code})`;
  return `no se pudo enviar el correo (${code})`;
}

const EMPTY_FORM ={ email: '', name: '', lastNameP: '', lastNameM: '', role: 'PROFESSOR' as StaffRole };

/** Personal e invitaciones (solo INSTITUTION_ADMIN). */
export default function StaffTab() {
  const staff = useAsync(() => adminService.staff(), []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [professorId, setProfessorId] = useState<string | null>(null);
  const [isNewProfessor, setIsNewProfessor] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [backendCandidates, setBackendCandidates] = useState<ProfessorCandidate[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [resend, setResend] = useState<Record<string, { busy?: boolean; ok?: boolean; text?: string }>>({});

  const resendInvitation = async (userId: string) => {
    setResend((r) => ({ ...r, [userId]: { busy: true } }));
    try {
      const res = await adminService.resendInvitation(userId);
      setResend((r) => ({
        ...r,
        [userId]: res.emailSent
          ? { ok: true, text: 'Correo reenviado.' }
          : { ok: false, text: `No se envió: ${emailErrorText(res.emailError)}.` },
      }));
    } catch (e) {
      setResend((r) => ({
        ...r,
        [userId]: { ok: false, text: e instanceof Error ? e.message : 'No se pudo reenviar.' },
      }));
      staff.reload();
    }
  };

  const isProfessor = form.role === 'PROFESSOR';
  const candidates = useAsync(
    () => (isProfessor ? adminService.professorsWithoutAccount(debounced) : Promise.resolve([])),
    [isProfessor, debounced],
  );

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickProfessor = (p: ProfessorCandidate) => {
    setProfessorId(p.id);
    setIsNewProfessor(false);
    setForm((f) => ({
      ...f,
      name: f.name || p.name,
      lastNameP: f.lastNameP || p.lastNameP,
      lastNameM: f.lastNameM || p.lastNameM || '',
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailWarning(null);
    if (isProfessor && !professorId && !isNewProfessor) {
      setError('Elige al profesor del catálogo o marca “Es un profesor nuevo”.');
      return;
    }
    const payload: InviteStaffPayload = {
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      lastNameP: form.lastNameP.trim(),
      ...(form.lastNameM.trim() ? { lastNameM: form.lastNameM.trim() } : {}),
      role: form.role,
      ...(isProfessor && professorId ? { professorId } : {}),
      ...(isProfessor && !professorId && isNewProfessor ? { createNewProfessor: true } : {}),
    };
    setSubmitting(true);
    try {
      const res = await adminService.inviteStaff(payload);
      if (res.emailSent) {
        setSuccess(`Invitación registrada para ${res.user.email}. Correo de invitación enviado.`);
      } else {
        setSuccess(`Invitación registrada para ${res.user.email}.`);
        setEmailWarning(
          `El correo NO se envió: ${emailErrorText(res.emailError)}. La persona igual puede entrar con Google usando ese correo; puedes reenviar la invitación desde la tabla.`,
        );
      }
      setForm(EMPTY_FORM);
      setProfessorId(null);
      setIsNewProfessor(false);
      setSearch('');
      setBackendCandidates(null);
      staff.reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as { candidates?: ProfessorCandidate[] } | null;
        if (body?.candidates) {
          setBackendCandidates(body.candidates);
          setError(
            body.candidates.length
              ? 'Hay profesores del catálogo con ese apellido. Elige uno o marca “Es un profesor nuevo”.'
              : 'No hay profesores sin cuenta con ese apellido. Si es nuevo, marca “Es un profesor nuevo”.',
          );
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'No se pudo registrar la invitación.');
    } finally {
      setSubmitting(false);
    }
  };

  const shownCandidates = backendCandidates ?? candidates.data ?? [];
  const rows = staff.data ?? [];

  return (
    <div className={pdf.dashboardContainer}>
      <div className={pdf.periodHeaderCard}>
        <div className={pdf.periodTitleWrap}>
          <h2 className={pdf.mainDashboardTitle}>Personal e invitaciones</h2>
          <p className={pdf.mainDashboardSubtitle}>
            Da acceso a profesores, administradores y analistas. Cada invitación queda registrada en la bitácora.
          </p>
        </div>
      </div>

      <div className={pdf.twoColumnsRow}>
        <Card title="Invitar a una persona" subtitle="La persona entra con Google usando exactamente este correo. No se envía contraseña.">
          <form className={s.form} onSubmit={onSubmit}>
            <label className={s.field}>
              <span>Correo institucional</span>
              <input className={s.input} type="email" required value={form.email} onChange={set('email')} autoComplete="off" />
            </label>
            <div className={s.formRow}>
              <label className={s.field}>
                <span>Nombre</span>
                <input className={s.input} required value={form.name} onChange={set('name')} />
              </label>
              <label className={s.field}>
                <span>Apellido paterno</span>
                <input className={s.input} required value={form.lastNameP} onChange={set('lastNameP')} />
              </label>
              <label className={s.field}>
                <span>Apellido materno (opcional)</span>
                <input className={s.input} value={form.lastNameM} onChange={set('lastNameM')} />
              </label>
            </div>
            <label className={s.field}>
              <span>Rol</span>
              <select
                className={s.select}
                value={form.role}
                onChange={(e) => {
                  set('role')(e);
                  setProfessorId(null);
                  setIsNewProfessor(false);
                  setBackendCandidates(null);
                }}
              >
                <option value="PROFESSOR">Profesor</option>
                <option value="INSTITUTION_ADMIN">Administrador</option>
                <option value="ANALYST">Analista</option>
              </select>
            </label>

            {isProfessor && (
              <fieldset className={s.fieldset}>
                <legend>Profesor del catálogo</legend>
                <p className={s.muted}>Para no duplicar profesores, liga la cuenta al profesor que ya está cargado.</p>
                <input
                  className={s.input}
                  placeholder="Buscar por nombre o apellido…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setBackendCandidates(null);
                  }}
                  disabled={isNewProfessor}
                />
                {candidates.loading && !backendCandidates && <p className={s.muted}>Buscando…</p>}
                {candidates.error && !backendCandidates && <p className={s.inlineError}>{candidates.error}</p>}
                {!isNewProfessor && (
                  <div className={s.candidateList} role="radiogroup" aria-label="Profesores sin cuenta">
                    {shownCandidates.length === 0 && !candidates.loading ? (
                      <p className={s.muted}>No hay profesores sin cuenta que coincidan.</p>
                    ) : (
                      shownCandidates.map((p) => (
                        <label key={p.id} className={`${s.candidate} ${professorId === p.id ? s.candidateOn : ''}`}>
                          <input
                            type="radio"
                            name="professorId"
                            checked={professorId === p.id}
                            onChange={() => pickProfessor(p)}
                          />
                          <span>{fullName(p)}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                <label className={s.checkRow}>
                  <input
                    type="checkbox"
                    checked={isNewProfessor}
                    onChange={(e) => {
                      setIsNewProfessor(e.target.checked);
                      if (e.target.checked) setProfessorId(null);
                    }}
                  />
                  <span>Es un profesor nuevo (no está en el catálogo)</span>
                </label>
              </fieldset>
            )}

            {error && <p className={s.inlineError} role="alert">{error}</p>}
            {success && <p className={s.inlineSuccess} role="status">{success}</p>}
            {emailWarning && <p className={s.inlineWarning} role="alert">{emailWarning}</p>}

            <button type="submit" className={s.btnGold} disabled={submitting}>
              {submitting ? 'Registrando…' : 'Registrar invitación'}
            </button>
          </form>
        </Card>

        <Card
          title="Personal con acceso"
          subtitle="Profesores, administradores y analistas."
          n={staff.data ? `${fmtInt(rows.length)} personas` : undefined}
          loading={staff.loading}
          error={staff.error}
          onRetry={staff.reload}
          empty={!!staff.data && rows.length === 0}
          emptyText="Todavía no hay personal registrado."
        >
          {rows.length > 0 && (
            <div className={s.tableScroll}>
              <table className={pdf.simpleTable}>
                <thead>
                  <tr>
                    <th>Correo</th>
                    <th>Nombre</th>
                    <th>Roles</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Invitación</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td className={pdf.subjectTextBold}>{fullName(u)}</td>
                      <td>{u.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}</td>
                      <td>
                        <span className={u.status === 'ACTIVE' ? s.statusActive : s.statusInvited}>
                          {u.status === 'ACTIVE' ? 'Activo' : 'Invitado'}
                        </span>
                      </td>
                      <td title={u.lastLoginAt ? `Último acceso: ${fmtDateTime(u.lastLoginAt)}` : 'Sin accesos'}>
                        {fmtDateTime(u.invitedAt ?? u.createdAt)}
                      </td>
                      <td>
                        {u.status === 'INVITED' ? (
                          <div className={s.resendCell}>
                            <button
                              type="button"
                              className={s.btnGhost}
                              disabled={resend[u.id]?.busy}
                              onClick={() => resendInvitation(u.id)}
                            >
                              {resend[u.id]?.busy ? 'Enviando…' : 'Reenviar invitación'}
                            </button>
                            {resend[u.id]?.text && (
                              <span
                                className={resend[u.id]?.ok ? s.inlineSuccess : s.inlineWarning}
                                role="status"
                              >
                                {resend[u.id]?.text}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={s.muted}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
