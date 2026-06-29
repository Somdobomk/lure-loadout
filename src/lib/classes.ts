/**
 * Shared Tailwind class strings — Pocket template pattern adapted to Gruvbox.
 * Import these instead of repeating inline strings, ensuring consistency.
 */

/** Full-width text/number/date input */
export const fieldCls =
  "block w-full appearance-none rounded-xl border border-gb-border bg-gb-bg " +
  "py-2.5 px-3 text-gb-fg text-sm placeholder:text-gb-dark " +
  "focus:border-gb-green2 focus:outline-none focus:ring-1 focus:ring-gb-green2/30 " +
  "transition-all disabled:opacity-50 disabled:cursor-not-allowed";

/** Compact label above a field */
export const labelCls =
  "block text-[11px] text-gb-faint font-semibold uppercase tracking-wider mb-1.5";

/** Primary action — green, full width */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl " +
  "bg-gb-green2 text-gb-bg font-semibold text-sm " +
  "hover:bg-gb-green active:bg-gb-green2/80 " +
  "disabled:opacity-40 disabled:cursor-not-allowed " +
  "transition-colors shadow-sm";

/** Primary action — green, auto width */
export const btnPrimaryAuto =
  "inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl " +
  "bg-gb-green2 text-gb-bg font-semibold text-sm " +
  "hover:bg-gb-green active:bg-gb-green2/80 " +
  "disabled:opacity-40 disabled:cursor-not-allowed " +
  "transition-colors shadow-sm";

/** Secondary / cancel — outline, auto width */
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl " +
  "border border-gb-border text-gb-muted text-sm " +
  "hover:border-gb-border2 hover:text-gb-fg " +
  "disabled:opacity-40 disabled:cursor-not-allowed " +
  "transition-colors";

/** Small action button — outline */
export const btnSm =
  "inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg " +
  "text-xs font-medium transition-colors " +
  "border border-gb-border text-gb-faint " +
  "hover:border-gb-border2 hover:text-gb-fg";

/** Danger button */
export const btnDanger =
  "inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl " +
  "bg-gb-red2 text-white font-semibold text-sm " +
  "hover:bg-gb-red active:bg-gb-red2/80 " +
  "transition-colors";
