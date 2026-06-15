import { auth } from "@/auth";

export async function isAdmin() {
  const session = await auth();
  return session?.user.role === "ADMIN";
}
