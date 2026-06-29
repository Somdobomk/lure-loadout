/**
 * Form field components — adapted from Tailwind UI Pocket template.
 * Pocket pattern: rounded-lg border, consistent py/px, semibold labels.
 * Colors swapped from Pocket's gray/cyan to Gruvbox Dark Hard palette.
 */
"use client";

import { useId } from "react";
import clsx from "clsx";

// ── Shared input classes — Pocket's formClasses adapted to Gruvbox ────────────
export const fieldClasses =
  "block w-full appearance-none rounded-xl border border-gb-border bg-gb-bg " +
  "py-2.5 px-3 text-gb-fg text-sm placeholder:text-gb-dark " +
  "focus:border-gb-green2 focus:outline-none focus:ring-1 focus:ring-gb-green2/30 " +
  "transition-all disabled:opacity-50 disabled:cursor-not-allowed";

// Pocket-style Label — semibold, uppercase tracking, smaller size
function Label({
  id,
  children,
  required,
}: {
  id: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="mb-1.5 block text-[11px] text-gb-faint font-semibold uppercase tracking-wider"
    >
      {children}
      {required && <span className="ml-1 text-gb-red">*</span>}
    </label>
  );
}

// ── TextField ─────────────────────────────────────────────────────────────────
export function TextField({
  label,
  type = "text",
  className,
  required,
  hint,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"input">, "id"> & {
  label?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label && <Label id={id} required={required}>{label}</Label>}
      <input id={id} type={type} required={required} {...props} className={fieldClasses} />
      {hint && <p className="mt-1 text-[11px] text-gb-dark">{hint}</p>}
    </div>
  );
}

// ── SelectField ───────────────────────────────────────────────────────────────
export function SelectField({
  label,
  className,
  children,
  required,
  hint,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"select">, "id"> & {
  label?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label && <Label id={id} required={required}>{label}</Label>}
      <select
        id={id}
        required={required}
        {...props}
        className={clsx(fieldClasses, "pr-8 cursor-pointer")}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23928374' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        {children}
      </select>
      {hint && <p className="mt-1 text-[11px] text-gb-dark">{hint}</p>}
    </div>
  );
}

// ── TextareaField ─────────────────────────────────────────────────────────────
export function TextareaField({
  label,
  className,
  required,
  hint,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"textarea">, "id"> & {
  label?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label && <Label id={id} required={required}>{label}</Label>}
      <textarea id={id} required={required} {...props} className={clsx(fieldClasses, "resize-none")} />
      {hint && <p className="mt-1 text-[11px] text-gb-dark">{hint}</p>}
    </div>
  );
}
