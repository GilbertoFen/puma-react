import { API_URL, getAuthToken } from '../utils/api';

export type ConsentKindType = 'TERMS_AND_NOTICE' | 'ANALYTICS' | 'IMPROVEMENT';

export interface PrivacyNoticeItem {
  id: string;
  kind: ConsentKindType;
  version: string;
  content: string;
  publishedAt: string;
}

export interface ConsentStatusItem {
  kind: ConsentKindType;
  noticeId?: string | null;
  granted: boolean;
  recordId: string | null;
  recordedAt: string | null;
  versionAccepted: string | null;
  activeVersion: string | null;
  needsUpdate: boolean;
}

export interface ConsentSelectionPreferences {
  termsAccepted: boolean;
  analyticsAccepted: boolean;
  improvementAccepted: boolean;
}

const PENDING_CONSENT_PREFS_KEY = 'puma_pending_consent_prefs';

export const consentsService = {
  savePendingPreferences(prefs: ConsentSelectionPreferences) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_CONSENT_PREFS_KEY, JSON.stringify(prefs));
    }
  },

  getPendingPreferences(): ConsentSelectionPreferences {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(PENDING_CONSENT_PREFS_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {
        // ignore parse errors
      }
    }
    return {
      termsAccepted: true,
      analyticsAccepted: true,
      improvementAccepted: true,
    };
  },

  async getActiveNotices(): Promise<PrivacyNoticeItem[]> {
    const response = await fetch(`${API_URL}/consents/notices`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('No se pudieron obtener los avisos de privacidad activos.');
    }
    return response.json();
  },

  async getMyConsentStatus(token?: string): Promise<ConsentStatusItem[]> {
    const activeToken = token || getAuthToken();
    const response = await fetch(`${API_URL}/consents/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('No se pudo consultar el estado de consentimientos.');
    }
    return response.json();
  },

  async recordBatchConsents(
    consents: Array<{ noticeId: string; kind: ConsentKindType; granted: boolean }>,
    token?: string,
  ) {
    const activeToken = token || getAuthToken();
    const response = await fetch(`${API_URL}/consents/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ consents }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Error al registrar consentimientos.');
    }
    return response.json();
  },

  /**
   * Sincroniza los consentimientos del usuario autenticado con el backend (/api/consents)
   * asegurando que TERMS_AND_NOTICE quede registrado en base de datos para habilitar el chat,
   * junto con las preferencias opcionales ANALYTICS e IMPROVEMENT.
   */
  async ensureConsentsSynced(
    token?: string,
    explicitPrefs?: Partial<ConsentSelectionPreferences>,
  ): Promise<void> {
    try {
      const statusList = await this.getMyConsentStatus(token);
      const termsStatus = statusList.find((s) => s.kind === 'TERMS_AND_NOTICE');
      if (termsStatus && termsStatus.granted && !termsStatus.needsUpdate && !explicitPrefs) {
        return;
      }

      const notices = await this.getActiveNotices();
      if (!notices || notices.length === 0) return;

      const savedPrefs = {
        ...this.getPendingPreferences(),
        ...(explicitPrefs || {}),
      };

      const batchPayload: Array<{
        noticeId: string;
        kind: ConsentKindType;
        granted: boolean;
      }> = [];

      for (const notice of notices) {
        if (notice.kind === 'TERMS_AND_NOTICE') {
          batchPayload.push({
            noticeId: notice.id,
            kind: 'TERMS_AND_NOTICE',
            granted: savedPrefs.termsAccepted !== false,
          });
        } else if (notice.kind === 'ANALYTICS') {
          batchPayload.push({
            noticeId: notice.id,
            kind: 'ANALYTICS',
            granted: Boolean(savedPrefs.analyticsAccepted),
          });
        } else if (notice.kind === 'IMPROVEMENT') {
          batchPayload.push({
            noticeId: notice.id,
            kind: 'IMPROVEMENT',
            granted: Boolean(savedPrefs.improvementAccepted),
          });
        }
      }

      if (batchPayload.length > 0) {
        await this.recordBatchConsents(batchPayload, token);
      }
    } catch (err) {
      console.warn('Advertencia sincronizando consentimientos con el backend:', err);
    }
  },
};

