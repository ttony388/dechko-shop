import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { POST as register } from "../src/app/api/auth/register/route";
import { POST as resend } from "../src/app/api/auth/resend-verification/route";
import { createCheckoutOrder } from "../src/lib/checkout";
import { authenticateCredentials } from "../src/lib/authenticate";
import { getCatalogPage } from "../src/lib/catalog";
import { db } from "../src/lib/db";
import { createVerificationToken, verifyEmailToken } from "../src/lib/email-verification";

const stamp = Date.now();
const email = `codex-smoke-${stamp}@example.com`;
const deliveryFailureEmail = `codex-smoke-email-failure-${stamp}@example.com`;
const recoveryEmail = `codex-smoke-recovery-${stamp}@example.com`;
const password = "SmokeTest123!";
const slug = `codex-smoke-product-${stamp}`;
let userId = "";
let deliveryFailureUserId = "";
let recoveryUserId = "";
let productId = "";
const orderIds: string[] = [];
const couponIds: string[] = [];

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
  const emptyAccountCounts = await Promise.all([
    db.order.count({ where: { userId } }),
    db.wishlist.count({ where: { userId } }),
    db.address.count({ where: { userId } }),
  ]);
  assert.deepEqual(emptyAccountCounts, [0, 0, 0], "a new account should start empty");

  const duplicate = await register(new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", email, password }),
  }));
  assert.equal(duplicate.status, 409, "duplicate registration should be rejected");
  const duplicateBody = await duplicate.json() as { requiresVerification?: boolean };
  assert.equal(
    duplicateBody.requiresVerification,
    true,
    "an unverified duplicate should be directed to resend verification",
  );
  assert.equal((await authenticateCredentials({ email, password })).status, "unverified");

  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = mutableEnv.NODE_ENV;
  const previousResendApiKey = mutableEnv.RESEND_API_KEY;
  const previousEmailFrom = mutableEnv.EMAIL_FROM;
  mutableEnv.NODE_ENV = "production";
  delete mutableEnv.RESEND_API_KEY;
  delete mutableEnv.EMAIL_FROM;
  try {
    const registrationWithoutEmail = await register(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Email Failure", email: deliveryFailureEmail, password }),
    }));
    assert.equal(
      registrationWithoutEmail.status,
      201,
      "email delivery failure should not discard a newly created profile",
    );
    const registrationWithoutEmailBody = await registrationWithoutEmail.json() as {
      emailSent?: boolean;
      verificationRequired?: boolean;
    };
    assert.equal(registrationWithoutEmailBody.emailSent, false);
    assert.equal(registrationWithoutEmailBody.verificationRequired, false);
    const deliveryFailureUser = await db.user.findUniqueOrThrow({
      where: { email: deliveryFailureEmail },
    });
    deliveryFailureUserId = deliveryFailureUser.id;
    assert.equal(deliveryFailureUser.emailVerified, true);
    assert.equal(
      (await authenticateCredentials({ email: deliveryFailureEmail, password })).status,
      "ok",
    );

    const recoveryUser = await db.user.create({
      data: {
        name: "Stuck Registration",
        email: recoveryEmail,
        emailVerified: false,
      },
    });
    recoveryUserId = recoveryUser.id;
    const recoveredRegistration = await register(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Recovered Registration", email: recoveryEmail, password }),
    }));
    assert.equal(recoveredRegistration.status, 201, "an unverified profile should be recoverable");
    assert.equal(
      (await authenticateCredentials({ email: recoveryEmail, password })).status,
      "ok",
    );
  } finally {
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousNodeEnv;
    if (previousResendApiKey === undefined) delete mutableEnv.RESEND_API_KEY;
    else mutableEnv.RESEND_API_KEY = previousResendApiKey;
    if (previousEmailFrom === undefined) delete mutableEnv.EMAIL_FROM;
    else mutableEnv.EMAIL_FROM = previousEmailFrom;
  }

  assert.equal((await verifyEmailToken("not-a-real-token")).status, "invalid");
  const verification = await createVerificationToken(userId);
  assert.equal((await verifyEmailToken(verification.token)).status, "verified");
  assert.equal((await authenticateCredentials({ email, password })).status, "ok");
  assert.equal(await db.verificationToken.count({ where: { userId } }), 0);
  await db.user.update({ where: { id: userId }, data: { blocked: true } });
  assert.equal((await authenticateCredentials({ email, password })).status, "blocked");
  await db.user.update({ where: { id: userId }, data: { blocked: false } });

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

  const checkoutResponse = await createCheckoutOrder(
    {
      customer: {
        email: "guest@example.com",
        firstName: "Тест",
        lastName: "Клиент",
        phone: "0888123456",
        address: "ул. Тест 1",
        city: "София",
        postalCode: "1000",
      },
      items: [{ product: { id: productId }, quantity: 2 }],
      saveAddress: false,
      paymentMethod: "CASH_ON_DELIVERY",
    },
    null,
  );
  assert.equal(checkoutResponse.status, 200, "checkout should create an order");
  const checkoutBody = await checkoutResponse.json() as { orderId: string };
  const savedOrder = await db.order.findUniqueOrThrow({
    where: { number: checkoutBody.orderId },
    include: { items: true },
  });
  orderIds.push(savedOrder.id);
  assert.equal(savedOrder.items.length, 1);
  assert.equal(savedOrder.items[0].quantity, 2);
  assert.equal(savedOrder.paymentMethod, "CASH_ON_DELIVERY");
  assert.equal(savedOrder.status, "PROCESSING");

  const accountCheckoutResponse = await createCheckoutOrder(
    {
      customer: {
        email,
        firstName: "Smoke",
        lastName: "Test",
        phone: "0888123456",
        address: "ул. Профил 2",
        city: "София",
        postalCode: "1000",
      },
      items: [{ product: { id: productId }, quantity: 1 }],
      saveAddress: true,
      paymentMethod: "CASH_ON_DELIVERY",
    },
    userId,
  );
  assert.equal(accountCheckoutResponse.status, 200);
  const accountCheckoutBody = await accountCheckoutResponse.json() as { orderId: string };
  const accountOrder = await db.order.findUniqueOrThrow({
    where: { number: accountCheckoutBody.orderId },
  });
  orderIds.push(accountOrder.id);
  assert.equal(accountOrder.userId, userId);
  assert.equal(await db.order.count({ where: { userId } }), 1);
  const defaultAddress = await db.address.findFirstOrThrow({
    where: { userId, isDefault: true },
  });
  assert.equal(defaultAddress.line1, "ул. Профил 2");
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock, 2);

  const assignedCoupon = await db.coupon.create({
    data: {
      code: `SMOKE-${stamp}`,
      type: "percent",
      value: 10,
      usageLimit: 1,
      assignedUserId: userId,
    },
  });
  couponIds.push(assignedCoupon.id);
  const guestCouponResponse = await createCheckoutOrder(
    {
      customer: {
        email: "other@example.com",
        firstName: "Guest",
        lastName: "Customer",
        phone: "0888123456",
        address: "ул. Тест 3",
        city: "София",
        postalCode: "1000",
      },
      items: [{ product: { id: productId }, quantity: 1 }],
      coupon: assignedCoupon.code,
      paymentMethod: "CASH_ON_DELIVERY",
    },
    null,
  );
  assert.equal(guestCouponResponse.status, 400, "assigned coupon must reject another customer");

  const couponCheckoutResponse = await createCheckoutOrder(
    {
      customer: {
        email,
        firstName: "Smoke",
        lastName: "Test",
        phone: "0888123456",
        address: "ул. Профил 2",
        city: "София",
        postalCode: "1000",
      },
      items: [{ product: { id: productId }, quantity: 1 }],
      coupon: assignedCoupon.code,
      paymentMethod: "CASH_ON_DELIVERY",
    },
    userId,
  );
  assert.equal(couponCheckoutResponse.status, 200);
  const couponCheckoutBody = await couponCheckoutResponse.json() as { orderId: string };
  const couponOrder = await db.order.findUniqueOrThrow({
    where: { number: couponCheckoutBody.orderId },
  });
  orderIds.push(couponOrder.id);
  assert.equal(Number(couponOrder.discount.toFixed(2)), 2);
  assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: assignedCoupon.id } })).usageCount, 1);

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
    if (orderIds.length) {
      await db.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => undefined);
    }
    if (couponIds.length) {
      await db.coupon.deleteMany({ where: { id: { in: couponIds } } }).catch(() => undefined);
    }
    if (productId) await db.product.delete({ where: { id: productId } }).catch(() => undefined);
    if (deliveryFailureUserId) {
      await db.user.delete({ where: { id: deliveryFailureUserId } }).catch(() => undefined);
    }
    if (recoveryUserId) {
      await db.user.delete({ where: { id: recoveryUserId } }).catch(() => undefined);
    }
    if (userId) await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    await db.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
