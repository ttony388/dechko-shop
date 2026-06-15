import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "coral";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-turquoise/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[.97]",
        variant === "primary" && "bg-ink text-white shadow-[0_10px_30px_rgba(24,61,68,.16)] hover:-translate-y-0.5 hover:bg-turquoise-dark",
        variant === "secondary" && "bg-white text-ink shadow-soft hover:-translate-y-0.5",
        variant === "ghost" && "bg-transparent text-ink hover:bg-ink/5",
        variant === "coral" && "bg-coral text-white shadow-[0_10px_30px_rgba(255,107,82,.24)] hover:-translate-y-0.5",
        size === "sm" && "h-10 px-4 text-sm",
        size === "md" && "h-12 px-6 text-sm",
        size === "lg" && "h-14 px-8 text-base",
        className,
      )}
      {...props}
    />
  );
}
