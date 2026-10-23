
import NextAuth, { AuthOptions } from 'next-auth'; 
import GitHubProvider from 'next-auth/providers/github'; 
 

export const authOptions: AuthOptions = { 
  providers: [ 
    GitHubProvider({ 
      clientId: process.env.GITHUB_CLIENT_ID!, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET!, 
    }), 
  ], 
 

callbacks: { 
    async jwt({ token, account, profile }) { 
      if (account && profile) { 
        const p = profile as Record<string, unknown>;
        const realmAccess = p.realm_access as { roles?: string[] } | undefined;

        // GitHub exposes login as the username 
        token.username = (profile as Record<string, unknown>).login as string 
          ?? token.email 
          ?? 'unknown'; 
        token.roles = realmAccess?.roles
          ?? (p.roles as string[] | undefined)
          ?? ['placeholder-role-viewer', 'admin'];
        

          
      } 
      return token; 
    }, 
 
// ts-expect-error — extending the default session type 
async session({ session, token }) { 
      session.user = { 
        ...session.user, 
        
        username: token.username as string, 
        roles: token.roles as string[],
        
      }; 
      return session; 
    }, 
  }, 
}; 
 

const handler = NextAuth(authOptions); 
export { handler as GET, handler as POST };


/* import NextAuth, { AuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          access_type: 'offline',
          scope: 'openid profile email',
          },
        },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    },

  callbacks: {
    // Pull the preferred_username (or email) from the Keycloak token
    // into the session so components can access it easily
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Keycloak exposes preferred_username on the profile
        token.username =
          (profile as Record<string, unknown>).preferred_username as string
          ?? profile.email
          ?? token.email
          ?? 'unknown';

        token.rawClaims = profile as Record<string, unknown>; //Store all. raw claims

        token.accessToken = account.access_token; // Stores the access token for API calls

        token.refreshToken = account.refresh_token; //Stores refresh token for later use

        token.accessTokenExpires = Date.now() + (Number(account.expires_in)*1000);

      if (Date.now() < (token.accessTokenExpires as number)) {
      return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: 'RefreshTokenMissing'};
      }

      try {
        const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
          const response = await fetch(url, {
            method: 'post',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            body: new URLSearchPArams({
              client_id process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              grant_type: 'refresh_token'
              refresh_token: token.refreshToken as string,
            }),
          });
        const refreshedTokens = await response.json();

        if (!response.ok){
          throw refreshedTokens;
        }
        

      }

      }
      return token;
    },

    async session({ session, token }) {
      // Expose username on the session object // @ts-expect-error — extending the default session type
      session.user = {
        ...session.user,
        
        username: token.username as string,
      };
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',   // optional custom sign-in page
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
 */