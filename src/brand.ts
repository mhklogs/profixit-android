export type AppRole = 'homeowner' | 'contractor';

// This repository ships a single-branded build, so the role is fixed at build
// time rather than read from EXPO_PUBLIC_ROLE. That removes a whole class of
// "built the wrong APK" mistakes.
export const FIXED_ROLE: AppRole = 'contractor';

export function homeForRole(role: AppRole): string {
  return role === 'contractor' ? '/radar' : '/feed';
}

export function fixedProfileStub(role: AppRole) {
  return {
    role,
    account_status: role === 'homeowner' ? 'active' : 'pending',
  };
}
