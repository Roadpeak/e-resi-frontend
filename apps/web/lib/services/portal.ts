import type { UserRole } from '../types';

/** Where a user's production requests live: inside their own portal. */
export function serviceRequestsBase(role?: UserRole | null): string {
  switch (role) {
    case 'DEVELOPER':
    case 'ADMIN':
      return '/dashboard/service-requests';
    case 'AGENT':
      return '/agent/service-requests';
    default:
      return '/account/service-requests';
  }
}
