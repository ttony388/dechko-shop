import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function createVerificationToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.$transaction([
    db.verificationToken.deleteMany({ where: { userId } }),
    db.verificationToken.create({ data: { userId, tokenHash, expiresAt } }),
  ]);

  return {
    token,
    url: `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`,
  };
}

export async function canResendVerification(userId: string) {
  const latest = await db.verificationToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return !latest || Date.now() - latest.createdAt.getTime() >= RESEND_COOLDOWN_MS;
}

export async function verifyEmailToken(token: string) {
  const verification = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!verification) return { status: "invalid" as const };
  if (verification.expiresAt <= new Date()) {
    await db.verificationToken.delete({ where: { id: verification.id } });
    return { status: "expired" as const, email: verification.user.email };
  }

  await db.$transaction([
    db.user.update({
      where: { id: verification.user.id },
      data: { emailVerified: true },
    }),
    db.verificationToken.deleteMany({ where: { userId: verification.user.id } }),
  ]);
  return { status: "verified" as const };
}

export async function sendVerificationEmail(input: {
  email: string;
  name?: string | null;
  verificationUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email verification] ${input.email}: ${input.verificationUrl}`);
      return;
    }
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required in production.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Потвърдете имейла си за Дечко",
      html: verificationEmailHtml(input),
      text: `Здравейте${input.name ? `, ${input.name}` : ""}!\n\nПотвърдете имейла си за Дечко:\n${input.verificationUrl}\n\nЛинкът е валиден 1 час.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
  }
}

function verificationEmailHtml(input: {
  name?: string | null;
  verificationUrl: string;
}) {
  return `<!doctype html>
<html lang="bg"><body style="margin:0;background:#fffaf2;color:#173f46;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#fffaf2"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-radius:28px;background:#fff;overflow:hidden">
<tr><td style="height:10px;background:linear-gradient(90deg,#20c4c8,#ffc13d,#ff6b52)"></td></tr>
<tr><td style="padding:40px">
<p style="margin:0 0 10px;color:#ff6b52;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">Моят Дечко</p>
<h1 style="margin:0 0 18px;font-size:32px;line-height:1.1">Потвърдете имейла си</h1>
<p style="margin:0 0 26px;color:#557277;line-height:1.7">Здравейте${input.name ? `, ${escapeHtml(input.name)}` : ""}! Остава само една малка стъпка, за да активирате профила си.</p>
<a href="${input.verificationUrl}" style="display:inline-block;border-radius:999px;background:#173f46;color:#fff;padding:15px 24px;text-decoration:none;font-weight:800">Потвърди имейла</a>
<p style="margin:28px 0 8px;color:#557277;font-size:13px">Ако бутонът не работи, отворете този линк:</p>
<p style="margin:0;word-break:break-all;font-size:12px"><a href="${input.verificationUrl}" style="color:#078f98">${input.verificationUrl}</a></p>
<p style="margin:24px 0 0;color:#8aa0a4;font-size:12px">Линкът е валиден 1 час. Ако не сте създавали профил, игнорирайте този имейл.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
