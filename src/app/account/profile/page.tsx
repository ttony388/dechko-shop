import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile-form";
import { splitName } from "@/lib/account";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  return (
    <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-black">Лични данни</h2>
      <ProfileForm initialProfile={{ ...splitName(user.name), email: user.email }} />
    </section>
  );
}
