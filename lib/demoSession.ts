/**
 * Demo mode session — used when SSO is not configured.
 * Returns a realistic mock student so the app works without any credentials.
 */
export function getDemoSession() {
  return {
    user: {
      name: 'Alex Johnson',
      email: 'ajohnson26@providence.edu',
      studentId: 'ajohnson26',
      accessToken: 'mock',
      microsoftId: 'demo',
    },
  };
}
