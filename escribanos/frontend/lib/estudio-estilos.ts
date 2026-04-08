import { estudioTw } from "./estudio-tw";

/**
 * Padding horizontal (legado). Preferir `.estudio-page-wrap` en el layout del estudio.
 */
export const estudioShellInsetClass = "px-4 sm:px-6 lg:px-8";

/** Margen vertical (legado). El layout del estudio usa padding en `.estudio-page-wrap`. */
export const estudioMainMarginClass = "mt-5 mb-8 sm:mt-6 sm:mb-10 lg:mb-12";

/** Clase CSS global: columna centrada alineada con el navbar (ver `globals.css`). */
export const estudioPageWrapClass = "estudio-page-wrap";

const btnWide =
  "w-full max-w-sm sm:w-auto sm:min-w-[9rem] sm:max-w-none";

/** Formularios y acciones (compat: ancho en móvil). */
export const estudioBtnPrimario = `${estudioTw.btnPrimarySm} ${btnWide}`;

export const estudioBtnSecundario = `${estudioTw.btnSecondarySm} ${btnWide}`;

export const estudioBtnNeutral =
  "inline-flex min-h-9 w-full max-w-sm shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 sm:w-auto sm:min-w-[9rem] sm:max-w-none";

/** Contenedor para filas de botones centrados en móvil y desktop. */
export const estudioFilaBotones = "flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4";

/** Panel de filtros / búsqueda con esquinas redondeadas. */
export const estudioPanelBusqueda = `${estudioTw.surface} p-6 backdrop-blur-sm sm:p-8`;

/** Ritmo vertical típico bajo el encabezado de página. */
export const estudioPageStack = "min-w-0 space-y-6 sm:space-y-8";

/** Barra de contexto (rol, conteos, acción). */
export const estudioMetaBar =
  "flex flex-col gap-3 rounded-2xl border border-neutral-200/50 bg-white/90 px-4 py-3.5 shadow-[0_2px_24px_-10px_rgba(15,23,42,0.12)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4";

export const estudioBadgeEmerald =
  "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200/55";

export const estudioBadgeNeutral =
  "rounded-full bg-neutral-100/95 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200/65";

/** Aviso de filtros activos sobre el panel de búsqueda. */
export const estudioBannerFiltros =
  "rounded-xl border border-[rgba(0,166,81,0.28)] bg-gradient-to-br from-[rgba(0,166,81,0.09)] to-[rgba(0,166,81,0.04)] px-4 py-3 text-sm font-semibold text-[var(--verde-oscuro)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";

/** Tarjeta elevada (tablas, bloques de detalle). */
export const estudioCard = estudioTw.surface;

export const estudioCardPad = "p-6 sm:p-8 lg:p-9";

/** Formulario principal dentro de una tarjeta. */
export const estudioFormShell = `${estudioCard} ${estudioCardPad}`;

/** Título de sección (mayúsculas pequeñas). */
export const estudioSectionTitle = estudioTw.eyebrow;

/** Separador entre bloques de formulario. */
export const estudioSectionRule = "mt-10 border-t border-neutral-200/70 pt-10";

/** Contenedor de tabla desktop. */
export const estudioTableShell =
  "hidden min-w-0 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_2px_20px_-10px_rgba(15,23,42,0.1)] md:block";

export const estudioTheadRow =
  "border-b border-neutral-200/90 bg-gradient-to-b from-neutral-50 to-neutral-50/70";

export const estudioTh =
  "px-4 py-3.5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600 sm:px-5 sm:py-4";

export const estudioTrHover = "transition-colors hover:bg-[rgba(0,166,81,0.042)]";

export const estudioTdBase =
  "px-4 py-3 text-xs leading-relaxed text-neutral-800 sm:px-5 sm:py-3.5";

/** Volver / navegación secundaria. */
export const estudioLinkBack = `${estudioTw.linkBack} text-xs`;

/** Estado vacío. */
export const estudioEmpty =
  "rounded-2xl border border-dashed border-neutral-200/90 bg-gradient-to-b from-neutral-50/90 to-white px-6 py-10 text-center sm:py-12";

/** Alerta informativa posterior a acción. */
export const estudioAlertInfo =
  "rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-800 ring-1 ring-black/[0.06]";

/** Tarjeta elegible en menú (hub clientes). */
export const estudioHubCard =
  "group flex w-full flex-col gap-4 rounded-2xl border border-neutral-200/60 bg-white p-6 text-left shadow-[0_4px_28px_-14px_rgba(15,23,42,0.12)] transition hover:border-[rgba(0,166,81,0.35)] hover:shadow-[0_12px_36px_-16px_rgba(0,166,81,0.2)] sm:p-7";

export const estudioHubCardIcon =
  "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-xl text-[var(--verde-principal)] ring-1 ring-emerald-200/50";

/** Indicador de carga en línea. */
export const estudioSpinner =
  "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600";

export const estudioSpinnerLg =
  "inline-block size-9 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600";
