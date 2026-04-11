/**
 * Tokens Tailwind — solo UI del módulo Gestión estudio.
 *
 * Design system (listados y paneles):
 * - Espaciado: retícula Tailwind = 4px por unidad → gap/padding en 1,2,4,6… (4,8,16,24px).
 * - Color: neutros (`neutral-*`) para superficies y texto; **acento emerald** solo en foco, enlaces y estados activos.
 * - Tipografía: jerarquía display → body → caption/meta (pesos y tamaños acotados).
 */

export const estudioTw = {
  /** Columna centrada (layout protegido). */
  contentCol: "mx-auto w-full min-w-0 max-w-6xl",

  /** Apilado vertical consistente. */
  stack: "flex flex-col gap-6",

  /** Contenido del layout estudio: centrado (títulos); formularios/tablas resetean con `text-left`. */
  stackCentered: "flex flex-col items-center gap-6 text-center",

  /** Grilla 2 columnas desde `sm`. */
  grid2: "grid grid-cols-1 gap-6 sm:grid-cols-2",

  /** Superficie con sombra (sin padding; para tablas / secciones internas). */
  surface:
    "rounded-2xl border border-neutral-200/80 bg-white shadow-md",

  /** Tarjeta estándar con padding. */
  card: "rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-md",

  /** Tarjeta secundaria / barra de acciones. */
  cardMuted: "rounded-2xl border border-neutral-200/70 bg-neutral-50/95 p-6 shadow-md",

  /** Padding horizontal paneles (16 / 24 / 32px). */
  cardPadX: "px-4 sm:px-6 lg:px-8",

  /** Buscador compacto (clientes y asuntos): ancho máximo acotado (sin ícono); +10% vs base. */
  busquedaCompactOuter:
    "min-w-0 w-full flex-1 max-w-[11.55rem] sm:max-w-[12.65rem] lg:max-w-[13.75rem]",

  busquedaCompactShell:
    "flex w-full min-w-0 items-center rounded-lg border border-neutral-200/80 bg-white/95 px-[0.55rem] py-[0.1375rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-[2px] transition focus-within:border-emerald-500/45 focus-within:bg-white focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_1px_rgba(16,185,129,0.22),0_2px_8px_-2px_rgba(16,185,129,0.12)]",

  busquedaCompactInput:
    "min-h-0 min-w-0 w-full flex-1 appearance-none border-0 bg-transparent py-0 text-[0.9625rem] leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",

  /** Texto “Buscar” a la izquierda del campo (clientes / asuntos). */
  busquedaLabel: "shrink-0 text-[0.9625rem] font-semibold tracking-wide text-emerald-700 sm:text-[1.1rem]",

  /** Listados: ritmo vertical principal (24px). */
  listStackY: "flex flex-col gap-6",

  /** Debajo del toolbar de búsqueda → tabla (24px arriba, borde, 24px padding superior). */
  listBodySection: "mt-6 border-t border-neutral-200 bg-neutral-50/40 pt-6 sm:mt-8 sm:pt-8",

  /** Fila meta bajo buscador (conteos, carga). */
  listMetaRow: "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-neutral-500",

  /** Banner “filtros activos” (acento suave). */
  listBannerFiltros:
    "mt-2 rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-xs text-neutral-700",

  /** Fila acciones secundarias bajo buscador (borde superior 8px). */
  listToolbarFooter: "mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 pt-2 sm:gap-4 sm:pt-4",

  /** Cabecera tabla listado (neutro). */
  listTableHeadRow:
    "border-b border-neutral-200 bg-neutral-50/95 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600",

  listTableHeadCell: "bg-neutral-50/95 px-2 py-2",

  /** Celda cuerpo tabla listado. */
  listTableCell: "border-b border-neutral-100 px-2 py-2 text-xs leading-snug text-neutral-700",

  /** Spinner inline listados (8px borde). */
  listSpinner: "size-3 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-600",

  /** Texto jerárquico: título vacío / destacado. */
  typeListTitle: "text-base font-semibold tracking-tight text-neutral-900",

  /** Texto jerárquico: párrafo secundario. */
  typeListBody: "mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600",

  /** Etiquetas en listas móviles (dl). */
  typeListDlDt: "text-xs font-semibold uppercase tracking-wide text-neutral-500",

  typeListDlDd: "mt-1 text-xs leading-snug text-neutral-800",

  /** Badge estado neutro (tabla / cards). */
  badgeNeutralSoft: "inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700",

  h1: "text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl",
  h2: "text-lg font-semibold text-gray-900",
  h3: "text-sm font-semibold text-gray-900",
  eyebrow: "text-xs font-semibold uppercase tracking-wider text-gray-500",
  body: "text-sm leading-relaxed text-gray-600 sm:text-base",
  bodySm: "text-xs leading-relaxed text-gray-600 sm:text-sm",
  label: "text-xs font-medium text-gray-600",
  muted: "text-gray-500",

  input:
    "w-full min-h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",

  inputSm:
    "w-full min-h-8 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",

  btnPrimary:
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:pointer-events-none disabled:opacity-50",

  btnPrimarySm:
    "inline-flex min-h-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:pointer-events-none disabled:opacity-50",

  /** “Nuevo cliente / Nuevo asunto”: estilo contorneado (no relleno sólido como btnPrimary). */
  btnListNuevo:
    "inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border-2 border-emerald-600/90 bg-white px-5 py-2.5 text-base font-semibold text-emerald-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-emerald-700 hover:bg-emerald-50/90 hover:text-emerald-950 active:bg-emerald-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-h-11 sm:px-6",

  btnSecondary:
    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:pointer-events-none disabled:opacity-50",

  btnSecondarySm:
    "inline-flex min-h-8 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-3.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:pointer-events-none disabled:opacity-50",

  btnGhost:
    "inline-flex min-h-8 items-center justify-center rounded-xl border border-transparent bg-transparent px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900",

  btnDangerSm:
    "inline-flex min-h-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-800 transition hover:bg-red-100",

  linkBack:
    "inline-flex min-h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50",

  /** Pestañas tipo subrayado. */
  tab: (active: boolean) =>
    [
      "relative -mb-px inline-flex items-center border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-2 sm:px-4 sm:pb-3.5 sm:pt-2.5",
      active
        ? "border-emerald-600 text-gray-900"
        : "border-transparent text-gray-600 hover:border-gray-200 hover:text-gray-900",
    ].join(" "),

  /** Pestañas tipo píldora (sub-barra estudio). */
  navPill: (active: boolean) =>
    [
      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4",
      active
        ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    ].join(" "),
} as const;
