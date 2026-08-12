import type { UserRole } from '../types';

/**
 * Where a signed-in user belongs, by role.
 *
 * Centralised because this decision was previously duplicated across the
 * login redirect, three navbars and the auth guard as
 * `role === 'DEVELOPER' ? '/dashboard' : '/account'`. Adding the agent role
 * meant every one of those needed updating, and the ones that were missed
 * silently dropped agents into the tenant account view.
 */
export function homePathFor(role?: UserRole | null): string {
  switch (role) {
    case 'DEVELOPER':
    case 'ADMIN':
      return '/dashboard';
    case 'AGENT':
      return '/agent';
    default:
      return '/account';
  }
}

/** Label for the link that leads there — "Dashboard" reads wrong for a tenant. */
export function homeLabelFor(role?: UserRole | null): string {
  switch (role) {
    case 'DEVELOPER':
    case 'ADMIN':
      return 'Dashboard';
    case 'AGENT':
      return 'Agent dashboard';
    default:
      return 'My account';
  }
}
