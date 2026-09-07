import NextAuth, {
  type NextAuthOptions,
  type Session,
  type User,
  type Account,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "./db";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ═══════════════════════════════════════════════════════════════
// TYPE EXTENSIONS
// ═══════════════════════════════════════════════════════════════

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
      avatarUrl: string | null;
      timezone: string;
      locale: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    avatarUrl: string | null;
    timezone: string;
    locale: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    avatarUrl: string | null;
    timezone: string;
    locale: string;
  }
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD HELPERS
// ═══════════════════════════════════════════════════════════════

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════════
// USER HELPERS
// ═══════════════════════════════════════════════════════════════

export async function createUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: "SUPER_ADMIN" | "PLATFORM_ADMIN" | "FARM_OWNER" | "FARM_MANAGER" | "FARM_WORKER" | "AGRONOMIST" | "BUYER" | "VENDOR" | "ANALYST" | "VIEWER";
}) {
  const passwordHash = await hashPassword(input.password);
  const name = input.name ?? `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();

  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: name || null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      role: input.role ?? "FARM_OWNER",
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      accounts: true,
      farms: {
        include: {
          farm: {
            select: { id: true, name: true, status: true },
          },
        },
      },
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      accounts: {
        select: { provider: true, type: true },
      },
      farms: {
        include: {
          farm: {
            select: { id: true, name: true, status: true, areaHa: true },
          },
        },
      },
    },
  });
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string;
    timezone: string;
    locale: string;
    role: string;
    isActive: boolean;
  }>
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function updateLastLogin(id: string) {
  return prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });
}

// ═══════════════════════════════════════════════════════════════
// API KEY HELPERS
// ═══════════════════════════════════════════════════════════════

export async function createApiKey(userId: string, name: string) {
  const key = `agri_${crypto.randomUUID().replace(/-/g, "")}`;

  return prisma.apiKey.create({
    data: {
      userId,
      name,
      key,
    },
  });
}

export async function validateApiKey(key: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });

  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey;
}

export async function revokeApiKey(id: string) {
  return prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });
}

// ═══════════════════════════════════════════════════════════════
// SESSION HELPERS
// ═══════════════════════════════════════════════════════════════

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });
}

export async function revokeAllSessions(userId: string) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}

export async function revokeSession(sessionToken: string) {
  return prisma.session.delete({
    where: { sessionToken },
  });
}

// ═══════════════════════════════════════════════════════════════
// NEXTAUTH CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid credentials format");
        }

        const user = await getUserByEmail(parsed.data.email);
        if (!user || !user.passwordHash) {
          throw new Error("No account found with this email");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Contact support.");
        }

        const isPasswordValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        await updateLastLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          timezone: user.timezone,
          locale: user.locale,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (account && profile) {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email?.toLowerCase() ?? "" },
          });

          if (existingUser) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }
        }

        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = (user as User).firstName ?? null;
        token.lastName = (user as User).lastName ?? null;
        token.role = (user as User).role ?? "VIEWER";
        token.avatarUrl = (user as User).avatarUrl ?? null;
        token.timezone = (user as User).timezone ?? "UTC";
        token.locale = (user as User).locale ?? "en";
      }

      if (account) {
        token.accessToken = account.access_token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true, isActive: true },
      });

      if (dbUser && !dbUser.isActive) {
        return { ...token, error: "AccountDeactivated" };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.timezone = token.timezone as string;
        session.user.locale = token.locale as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        await prisma.auditLog.create({
          data: {
            userId: user.id as string,
            action: "register",
            resource: "user",
            resourceId: user.id as string,
            metadata: JSON.stringify({
              provider: account?.provider,
              isNewUser,
            }),
          },
        });
      } else {
        await prisma.auditLog.create({
          data: {
            userId: user.id as string,
            action: "login",
            resource: "user",
            resourceId: user.id as string,
            metadata: JSON.stringify({
              provider: account?.provider,
            }),
          },
        });
      }
    },

    async signOut({ token }) {
      await prisma.auditLog.create({
        data: {
          userId: token.id as string,
          action: "logout",
          resource: "user",
          resourceId: token.id as string,
        },
      });
    },
  },
};

export default NextAuth(authOptions);
