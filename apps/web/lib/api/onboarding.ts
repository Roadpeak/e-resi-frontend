import { apiClient } from './client';
import type {
  CompanyInfo,
  DevelopmentInfo,
  MediaState,
  PreferencesState,
  VerificationDocKey,
} from '../stores/onboarding.store';

export interface OnboardingPayload {
  company: CompanyInfo;
  verificationDocs: Record<VerificationDocKey, string>;
  development: DevelopmentInfo;
  media: MediaState;
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
};
