import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const tenantId = process.env.AZURE_AD_TENANT_ID ?? process.env.MICROSOFT_TENANT_ID ?? "";
const clientId = process.env.AZURE_AD_CLIENT_ID ?? process.env.MICROSOFT_CLIENT_ID ?? "";
const clientSecret =
  process.env.AZURE_AD_CLIENT_SECRET ?? process.env.MICROSOFT_CLIENT_SECRET ?? "";
const allowedDomain = (process.env.AUTH_ALLOWED_DOMAIN ?? "strobl-tiefbau.de").toLowerCase();

function extractEmail(profile: Record<string, unknown> | undefined, fallback?: string | null) {
  const direct =
    typeof profile?.email === "string"
      ? profile.email
      : typeof profile?.preferred_username === "string"
        ? profile.preferred_username
        : fallback;

  return direct?.toLowerCase() ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    AzureADProvider({
      clientId,
      clientSecret,
      tenantId,
      authorization: {
        params: {
          scope: "openid profile email offline_access User.Read"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ profile, user }) {
      const email = extractEmail(
        profile as Record<string, unknown> | undefined,
        user.email
      );

      return email ? email.endsWith(`@${allowedDomain}`) : false;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const email = extractEmail(profile as Record<string, unknown>, token.email);
        if (email) {
          token.email = email;
        }

        if (typeof profile.name === "string" && profile.name) {
          token.name = profile.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }

      return session;
    }
  }
};
