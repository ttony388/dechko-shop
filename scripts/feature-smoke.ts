import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { POST as register } from "../src/app/api/auth/register/route";
import { POST as resend } from "../src/app/api/auth/resend-verification/route";
import { authenticateCredentials } from "../src/lib/authenticate";
import { getCatalogPage } from "../src/lib/catalog";
import { db } from "../src/lib/db";
import { createVerificationToken, verifyEmailToken } from "../src/lib/email-verification";

const stamp = Date.now();
const email = `codex-smoke-${stamp}@example.com`;
const password = "SmokeTest123!";
const slug = `codex-smoke-product-${stamp}`;
let userId = "";
let productId = "";

async function main() {
  const registration = await register(new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", email, password }),
  }));
  assert.equal(registration.status, 201, "new registration should succeed");

  const user = await db.user.findUniqueOrThrow({ where: { email } });
  userId = user.id;
  assert.equal(user.emailVerified, false);
  assert.notEqual(user.password, password, "password must be hashed");

  const duplicate = await register(new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", email, password }),
  }));
  assert.equal(duplicate.status, 409, "duplicate registration should be rejected");
  assert.equal((await authenticateCredentials({ email, password })).status, "unverified");

  assert.equal((await verifyEmailToken("not-a-real-token")).status, "invalid");
  const verification = await createVerificationToken(userId);
  assert.equal((await verifyEmailToken(verification.token)).status, "verified");
  assert.equal((await authenticateCredentials({ email, password })).status, "ok");
  assert.equal(await db.verificationToken.count({ where: { userId } }), 0);

  await db.user.update({ where: { id: userId }, data: { emailVerified: false } });
  const expiredToken = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(expiredToken).digest("hex"),
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  assert.equal((await verifyEmailToken(expiredToken)).status, "expired");

  await createVerificationToken(userId);
  const cooldown = await resend(new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  }));
  assert.equal(cooldown.status, 429, "resend should be rate limited");
  await db.verificationToken.updateMany({
    where: { userId },
    data: { createdAt: new Date(Date.now() - 61_000) },
  });
  const resent = await resend(new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  }));
  assert.equal(resent.status, 200, "resend should create and send a fresh token");

  const category = await db.category.findFirstOrThrow();
  const product = await db.product.create({
    data: {
      name: `Smoke product ${stamp}`,
      slug,
      description: "Temporary product used by the automated feature smoke test.",
      details: ["Temporary"],
      price: 19.99,
      sku: `SMOKE-${stamp}`,
      stock: 5,
      status: "ACTIVE",
      active: true,
      ageGroup: "3-5 г.",
      tags: ["smoke"],
      categoryId: category.id,
      categories: { create: [{ categoryId: category.id }] },
      images: { create: [{ url: "/creative-kit.png", alt: "Smoke product" }] },
    },
  });
  productId = product.id;

  const search = await getCatalogPage({ search: `Smoke product ${stamp}`, limit: 12 });
  assert.equal(search.pagination.total, 1, "database search should find the product");
  const categoryPage = await getCatalogPage({ category: category.slug, page: 1, limit: 12 });
  assert.ok(categoryPage.pagination.total >= 1);
  assert.ok(categoryPage.products.length <= 12, "pagination should cap results at 12");
  const agePage = await getCatalogPage({ ageGroup: "3-5 г.", limit: 12 });
  assert.ok(agePage.products.every((item) => item.ages.includes("3-5 г.")));

  await db.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", active: false },
  });
  const archivedSearch = await getCatalogPage({ search: `Smoke product ${stamp}`, limit: 12 });
  assert.equal(archivedSearch.pagination.total, 0, "archived products must disappear");

  console.log("Feature smoke tests passed.");
}

main()
  .finally(async () => {
    if (productId) await db.product.delete({ where: { id: productId } }).catch(() => undefined);
    if (userId) await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    await db.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
