import { auth } from "@/auth";
import { CheckoutClient, type CheckoutValues } from "@/components/checkout-client";
import { splitName } from "@/lib/account";
import { db } from "@/lib/db";

const emptyCustomer: CheckoutValues = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <CheckoutClient
        initialCustomer={emptyCustomer}
        signedIn={false}
        defaultAddressId={null}
      />
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
  });
  const address = user?.addresses[0];
  const name = splitName(user?.name);
  return (
    <CheckoutClient
      signedIn
      defaultAddressId={address?.id || null}
      initialCustomer={{
        email: user?.email || session.user.email || "",
        firstName: address?.firstName || name.firstName,
        lastName: address?.lastName || name.lastName,
        phone: address?.phone || "",
        address: address?.line1 || "",
        city: address?.city || "",
        postalCode: address?.postalCode || "",
      }}
    />
  );
}
