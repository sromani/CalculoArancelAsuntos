import type { ReactNode } from "react";
import { estudioTw } from "@/lib/estudio-tw";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Clases extra en el `header` (por ejemplo quitar borde si va dentro de una tarjeta). */
  className?: string;
};

export function EstudioPageHeader({ eyebrow, title, description, action, className }: Props) {
  return (
    <header
      className={cn(
        "min-w-0 w-full border-b border-gray-200/90 pb-8 text-center sm:pb-10",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
        <div className="w-full space-y-4">
          {eyebrow ? <p className={estudioTw.eyebrow}>{eyebrow}</p> : null}
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl sm:leading-tight">{title}</h1>
          {description ? (
            <p className={cn(estudioTw.body, "mx-auto max-w-xl text-center text-pretty")}>{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:justify-center">{action}</div>
        ) : null}
      </div>
    </header>
  );
}
