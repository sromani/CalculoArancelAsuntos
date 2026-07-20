import type { CategoriaGasto, MonedaGasto, Prisma } from "@prisma/client";

type ItemSeed = {
  nombre: string;
  categoria: CategoriaGasto;
  oficinaPublica: string;
  descripcion?: string;
  importeSugerido?: number;
  moneda?: MonedaGasto;
  orden: number;
};

export const CATALOGO_GASTOS_SEED: ItemSeed[] = [
  {
    nombre: "Inscripción Registro de Propiedad",
    categoria: "REGISTRO",
    oficinaPublica: "Registro de Propiedad",
    importeSugerido: 3500,
    orden: 1,
  },
  {
    nombre: "Inscripción Registro de Actos Personales",
    categoria: "REGISTRO",
    oficinaPublica: "Registro de Actos Personales",
    importeSugerido: 2800,
    orden: 2,
  },
  {
    nombre: "Certificado Registro de Propiedad",
    categoria: "CERTIFICACIONES",
    oficinaPublica: "Registro de Propiedad",
    importeSugerido: 1200,
    orden: 3,
  },
  {
    nombre: "Tasa DGI — ITP",
    categoria: "TRIBUTOS",
    oficinaPublica: "DGI",
    descripcion: "Impuesto a las trasmissiones patrimoniales",
    orden: 4,
  },
  {
    nombre: "Tasa DGI — IVA mínimo",
    categoria: "TRIBUTOS",
    oficinaPublica: "DGI",
    orden: 5,
  },
  {
    nombre: "Correo certificado",
    categoria: "CORREO",
    oficinaPublica: "Correo Uruguayo",
    importeSugerido: 450,
    orden: 6,
  },
  {
    nombre: "Copias protocolo",
    categoria: "ARCHIVO",
    oficinaPublica: "Archivo Notarial",
    importeSugerido: 800,
    orden: 7,
  },
  {
    nombre: "Gestión bancaria",
    categoria: "GESTIONES",
    oficinaPublica: "Entidad financiera",
    importeSugerido: 1500,
    orden: 8,
  },
  {
    nombre: "Publicación diario oficial",
    categoria: "GESTIONES",
    oficinaPublica: "IMPO",
    importeSugerido: 2200,
    orden: 9,
  },
  {
    nombre: "Certificado dominio vehicular",
    categoria: "CERTIFICACIONES",
    oficinaPublica: "MTOP / SUCIVE",
    importeSugerido: 900,
    orden: 10,
  },
];

export async function asegurarCatalogoGastos(
  prisma: { gastoCatalogoItem: { count: () => Promise<number>; createMany: (args: { data: Prisma.GastoCatalogoItemCreateManyInput[]; skipDuplicates?: boolean }) => Promise<{ count: number }> } }
): Promise<number> {
  const n = await prisma.gastoCatalogoItem.count();
  if (n > 0) return 0;

  const data: Prisma.GastoCatalogoItemCreateManyInput[] = CATALOGO_GASTOS_SEED.map((item) => ({
    nombre: item.nombre,
    categoria: item.categoria,
    oficinaPublica: item.oficinaPublica,
    descripcion: item.descripcion ?? null,
    importeSugerido: item.importeSugerido ?? null,
    moneda: item.moneda ?? "PESOS",
    activo: true,
    orden: item.orden,
  }));

  const r = await prisma.gastoCatalogoItem.createMany({ data });
  return r.count;
}
