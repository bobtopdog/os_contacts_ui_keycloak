
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
    async jwt({ token, profile }) { 
      if (profile) { 
        // GitHub exposes login as the username 
        token.username = (profile as Record<string, unknown>).login as string 
          ?? token.email 
          ?? 'unknown'; 
      } 
      return token; 
    }, 
 
// ts-expect-error — extending the default session type 
async session({ session, token }) { 
      session.user = { 
        ...session.user, 
        
        username: token.username as string, 
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
    }),
  ],

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