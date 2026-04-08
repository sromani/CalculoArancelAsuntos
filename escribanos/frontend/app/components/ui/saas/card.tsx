import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Shared surface: blanco con borde/sombra suaves en tono marca (alineado a `.card-app`). */
export const cardSurface =
  "rounded-xl border border-[var(--verde-principal)]/20 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_24px_rgba(0,166,81,0.07)] transition duration-200 ease-out";

const cardShell =
  "rounded-xl border border-[var(--verde-principal)]/18 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(0,166,81,0.06)] transition duration-200 ease-out";

type CardProps = ComponentProps<"div"> & {
  variant?: "default" | "muted";
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        cardShell,
        variant === "default" && "bg-white",
        variant === "muted" && "bg-[var(--fondo-verde-muy-claro)]/95",
        className
      )}
      {...props}
    />
  );
}

type CardNavLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  icon: ReactNode;
  title: string;
  description: string;
  footerLabel: string;
};

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Large tappable hub card: icon, title, description, footer CTA. */
export function CardNavLink({
  className,
  icon,
  title,
  description,
  footerLabel,
  ...linkProps
}: CardNavLinkProps) {
  return (
    <Link
      className={cn(
        cardSurface,
        "group flex h-full flex-col gap-4 p-6 outline-none",
        "hover:border-[var(--verde-principal)]/40 hover:shadow-[0_4px_24px_rgba(0,166,81,0.12)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--verde-principal)]/35 focus-visible:ring-offset-2",
        className
      )}
      {...linkProps}
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--fondo-verde-muy-claro)] text-[var(--verde-oscuro)] transition duration-200 group-hover:bg-[var(--fondo-verde-claro)] group-hover:text-[var(--verde-titulo)]">
        {icon}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--verde-titulo)]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--gris-texto)]">{description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--verde-principal)]/12 pt-4">
        <span className="text-sm font-medium text-[var(--verde-titulo)]">{footerLabel}</span>
        <IconChevron className="size-4 shrink-0 text-[var(--verde-principal)]/50 transition duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--verde-principal)]" />
      </div>
    </Link>
  );
}
