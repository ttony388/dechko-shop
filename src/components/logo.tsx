import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex shrink-0", className)}
      aria-label="Дечко - начало"
    >
      <Image
        src="/dechko-logo.png"
        alt="Дечко"
        width={1300}
        height={350}
        priority
        className="h-10 w-auto object-contain sm:h-12"
      />
    </Link>
  );
}
