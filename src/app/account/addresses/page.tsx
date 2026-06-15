import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddressesClient } from "@/components/addresses-client";
import { db } from "@/lib/db";

export default async function AddressesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return <AddressesClient initialAddresses={addresses} />;
}
