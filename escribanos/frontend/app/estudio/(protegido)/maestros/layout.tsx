"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { puedeGestionarMaestrosEstudio } from "@/lib/roles-app";
import type { RolSesion } from "@/lib/session-token";

export default function LayoutMaestros({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (!r.ok) {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/estudio")}`);
          return;
        }
        const me = (await r.json()) as { rol?: string };
        const rol = me.rol as RolSesion;
        if (!puedeGestionarMaestrosEstudio(rol)) {
          router.replace("/estudio");
          return;
        }
        if (!cancel) {
          setListo(true);
        }
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/estudio")}`);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [router, pathname]);

  if (!listo) {
    return (
      <div className="py-8 text-center text-neutral-600" aria-live="polite">
        Cargando maestros…
      </div>
    );
  }

  return <>{children}</>;
}
