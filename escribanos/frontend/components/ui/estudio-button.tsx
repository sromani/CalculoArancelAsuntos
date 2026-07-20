import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

export type EstudioButtonVariant =
  | "primary"
  | "primarySm"
  | "listNuevo"
  | "secondary"
  | "secondarySm"
  | "ghost"
  | "dangerSm";

const variantClass: Record<EstudioButtonVariant, string> = {
  primary: estudioTw.btnPrimary,
  primarySm: estudioTw.btnPrimarySm,
  listNuevo: estudioTw.btnListNuevo,
  secondary: estudioTw.btnSecondary,
  secondarySm: estudioTw.btnSecondarySm,
  ghost: estudioTw.btnGhost,
  dangerSm: estudioTw.btnDangerSm,
};

type EstudioButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: EstudioButtonVariant;
  children: ReactNode;
};

export function EstudioButton({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: EstudioButtonProps) {
  return (
    <button type={type} className={cn(variantClass[variant], className)} {...props}>
      {children}
    </button>
  );
}

type EstudioLinkButtonProps = {
  href: string;
  variant?: EstudioButtonVariant;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
};

export function EstudioLinkButton({
  href,
  variant = "primary",
  className,
  children,
  target,
  rel,
}: EstudioLinkButtonProps) {
  return (
    <Link href={href} className={cn(variantClass[variant], className)} target={target} rel={rel}>
      {children}
    </Link>
  );
}
