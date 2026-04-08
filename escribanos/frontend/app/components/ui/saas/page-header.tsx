import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  className?: string;
};

/** Hub / list page title block: clear hierarchy, readable line length. */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">{title}</h1>
      {description != null && (
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--gris-texto)] sm:text-base">{description}</p>
      )}
    </header>
  );
}
