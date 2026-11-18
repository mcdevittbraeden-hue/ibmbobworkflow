import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

/**
 * Providence College SSO configuration.
 *
 * PC uses Microsoft Azure AD (Entra ID) for SSO — students sign in with
 * their @providence.edu Microsoft 365 credentials.
 *
 * Required env vars:
 *   AUTH_MICROSOFT_ENTRA_ID_ID       — Azure AD Application (client) ID
 *   AUTH_MICROSOFT_ENTRA_ID_SECRET   — Azure AD client secret
 *   AUTH_MICROSOFT_ENTRA_ID_TENANT_ID — Azure AD tenant ID
 *   AUTH_SECRET                       — random secret for session encryption
 */
const config: NextAuthConfig = {
  providers: [
    {
      id: 'microsoft-entra-id',
      name: 'Providence College',
      type: 'oidc',
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email offline_access Calendars.Read',
          response_type: 'code',
        },
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, store access token and profile data
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.microsoftId = (profile?.sub ?? (profile as Record<string, unknown>)?.oid) as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      session.user.microsoftId = token.microsoftId as string;
      // Derive student ID from email (e.g. jdoe24@providence.edu → jdoe24)
      session.user.studentId = session.user.email?.split('@')[0] ?? '';
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
