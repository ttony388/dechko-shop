import { randomInt } from "node:crypto";
import { db } from "@/lib/db";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const alphabet = `${letters}${numbers}`;

export function createRandomCouponCode(length = 8) {
  if (length < 2) throw new Error("Coupon codes must be at least 2 characters.");
  const characters = [
    letters[randomInt(0, letters.length)],
    numbers[randomInt(0, numbers.length)],
    ...Array.from(
      { length: length - 2 },
      () => alphabet[randomInt(0, alphabet.length)],
    ),
  ];
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = randomInt(0, index + 1);
    [characters[index], characters[target]] = [characters[target], characters[index]];
  }
  return characters.join("");
}

export async function createUniqueCouponCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRandomCouponCode();
    const exists = await db.coupon.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("COUPON_CODE_GENERATION_FAILED");
}
