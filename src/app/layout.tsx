import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { auth } from "@/auth";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { db } from "@/lib/db";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin", "cyrillic"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: { default: "Дечко — красиви неща за детството", template: "%s | Дечко" },
  description: "Премиум детски играчки, книги, дрехи и подаръци, подбрани с грижа.",
  openGraph: {
    title: "Дечко — красиви неща за детството",
    description: "Открийте подбрани продукти за игра, учене и приключения.",
    images: ["/hero-shop.png"],
    locale: "bg_BG",
    type: "website",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const [currentUser, wishlist] = session?.user
    ? await Promise.all([
        db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true, role: true },
        }),
        db.wishlist.findMany({
          where: { userId: session.user.id },
          select: { productId: true },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : [null, []];

  return (
    <html lang="bg">
      <body className={nunito.variable}>
        <Header
          user={
            currentUser
              ? {
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                }
              : null
          }
        />
        <Providers
          userId={session?.user?.id || null}
          wishlist={wishlist.map((item) => item.productId)}
        >
          <main>{children}</main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
