import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            email: z.string().trim().toLowerCase().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;
        if (!process.env.DATABASE_URL && parsed.data.email === "demo@dechko.bg" && parsed.data.password === "demo1234") {
          return { id: "demo", email: parsed.data.email, name: "Демо клиент" };
        }
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.password || !(await compare(parsed.data.password, user.password))) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) { if (user && "role" in user) token.role = user.role; return token; },
    session({ session, token }) { if (session.user) { session.user.id = token.sub || ""; session.user.role = token.role as "CUSTOMER" | "ADMIN" | undefined; } return session; },
  },
});
