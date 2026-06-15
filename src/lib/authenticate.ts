import { compare } from "bcryptjs";
import { credentialsSchema } from "@/lib/auth-validation";
import { db } from "@/lib/db";

export async function authenticateCredentials(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return { status: "invalid" as const };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.password || !(await compare(parsed.data.password, user.password))) {
    return { status: "invalid" as const };
  }
  if (!user.emailVerified) return { status: "unverified" as const };
  return { status: "ok" as const, user };
}
