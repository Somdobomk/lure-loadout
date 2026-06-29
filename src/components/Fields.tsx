/**
 * Re-exports Catalyst form fields.
 * Existing imports from "@/components/Fields" continue to work.
 */
export { Input as TextField, Select as SelectField } from './catalyst'

// fieldClasses — kept for backward compat with components using the raw string
export const fieldClasses =
  'block w-full appearance-none rounded-xl border border-gb-border bg-gb-bg ' +
  'py-2.5 px-3 text-gb-fg text-sm placeholder:text-gb-dark ' +
  'focus:border-gb-green2 focus:outline-none focus:ring-1 focus:ring-gb-green2/30 ' +
  'transition-all disabled:opacity-50 disabled:cursor-not-allowed'
