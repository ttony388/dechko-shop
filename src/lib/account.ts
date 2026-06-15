import { auth } from "@/auth";

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export function splitName(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}
