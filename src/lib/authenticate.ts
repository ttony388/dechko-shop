import { compare } from "bcryptjs";
import { credentialsSchema } from "@/lib/auth-validation";
import { db } from "@/lib/db";
import { isEmailVerificationRequired } from "@/lib/email-verification";

export async function authenticateCredentials(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return { status: "invalid" as const };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.password || !(await compare(parsed.data.password, user.password))) {
    return { status: "invalid" as const };
  }
  if (!user.emailVerified) {
    if (isEmailVerificationRequired()) return { status: "unverified" as const };
    const activatedUser = await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
    await db.verificationToken.deleteMany({ where: { userId: user.id } });
    return { status: "ok" as const, user: activatedUser };
  }
  return { status: "ok" as const, user };
}
