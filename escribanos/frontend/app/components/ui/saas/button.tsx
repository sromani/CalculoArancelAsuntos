import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonBase =
  "inline-flex min-h-9 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verde-principal)]/35 focus-visible:ring-offset-2";

/** Misma línea que listados estudio (`bg-[var(--verde-principal)]`, hover oscuro). */
export const buttonVariants = {
  primary:
    "border border-transparent bg-[var(--verde-principal)] text-white shadow-sm hover:bg-[var(--verde-oscuro)] active:bg-[var(--verde-principal)]",
  secondary:
    "border border-[var(--verde-principal)]/35 bg-white text-[var(--verde-oscuro)] shadow-sm hover:border-[var(--verde-principal)]/50 hover:bg-[var(--fondo-verde-claro)] active:bg-white",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

type NativeButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

/** Native `button` with shared SaaS styles. */
export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: NativeButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    />
  );
}

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  className?: string;
};

/** Next.js `Link` with the same visual styles as `Button`. */
export function LinkButton({ className, variant = "primary", ...props }: LinkButtonProps) {
  return <Link className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}
