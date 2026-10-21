import { apiClient, BASE_URL } from './client';
import { useAuthStore } from '../stores/auth.store';
import type {
  CompanyInfo,
  PreferencesState,
  UploadedDoc,
  VerificationDocKey,
  VerificationLinkKey,
  VerificationMethod,
} from '../stores/onboarding.store';

export interface OnboardingPayload {
  company: CompanyInfo;
  verificationDocs: {
    method: VerificationMethod;
    documents?: Partial<Record<VerificationDocKey, UploadedDoc>>;
    links?: Partial<Record<VerificationLinkKey, string>>;
  };
  preferences: PreferencesState;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const onboardingApi = {
  /** Submit the completed onboarding wizard for admin review. */
  submit: (payload: OnboardingPayload) =>
    apiClient.post<Envelope<unknown>>('/users/developers/me/onboarding', payload),

  /** Upload one verification document; it is stored privately, for admins only. */
  uploadDoc: async (docKey: VerificationDocKey, file: File): Promise<UploadedDoc> => {
    const token = useAuthStore.getState().accessToken;
    const form = new FormData();
    form.append('docKey', docKey);
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/users/developers/me/verification-docs`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error ?? 'Upload failed. Please try again.');
    return (json?.data ?? json) as UploadedDoc;
  },
};
