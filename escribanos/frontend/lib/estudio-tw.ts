/**
 * Tokens Tailwind — solo UI del módulo Gestión estudio.
 * Tipografía: gray-900 / gray-600; acento interactivo: emerald.
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
    "rounded-2xl border border-gray-200/80 bg-white shadow-md",

  /** Tarjeta estándar con padding. */
  card: "rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md",

  /** Tarjeta secundaria / barra de acciones. */
  cardMuted: "rounded-2xl border border-gray-200/70 bg-gray-50/95 p-6 shadow-md",

  cardPadX: "px-6 sm:px-8",

  /** Caja buscador (lupa + input sin borde) — clientes y asuntos. */
  busquedaFieldShell:
    "flex min-h-[3rem] w-full min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 shadow-inner shadow-gray-100/80 transition focus-within:border-emerald-400/80 focus-within:ring-4 focus-within:ring-emerald-500/15",

  busquedaFieldInput:
    "min-w-0 flex-1 appearance-none border-0 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",

  busquedaIconWrap: "shrink-0 text-emerald-600/70",

  /** Ancho máximo del buscador (mismo en clientes y asuntos). */
  busquedaFieldOuter: "min-w-0 w-full flex-1 sm:max-w-xl lg:max-w-2xl",

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
