"use client";

import { useId } from "react";
import { Input } from "./catalyst/input";
import { Select } from "./catalyst/select";

// Re-export bare components
export { Input, Select };
export { Input as CatalystInput, Select as CatalystSelect };

// TextField — Catalyst Input + optional label wrapper (matches old Fields.tsx API)
export function TextField({
  label,
  className,
  ...props
}: {
  label?: string;
  className?: string;
} & React.ComponentPropsWithoutRef<"input">) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-gb-faint mb-1.5">
          {label}
        </label>
      )}
      <Input id={id} {...(props as Parameters<typeof Input>[0])} />
    </div>
  );
}

// SelectField — Catalyst Select + optional label wrapper
export function SelectField({
  label,
  className,
  children,
  ...props
}: {
  label?: string;
  className?: string;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<"select">) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-gb-faint mb-1.5">
          {label}
        </label>
      )}
      <Select id={id} {...(props as Parameters<typeof Select>[0])}>
        {children}
      </Select>
    </div>
  );
}

// fieldClasses — kept for backward compat
export const fieldClasses =
  "block w-full appearance-none rounded-xl border border-gb-border bg-gb-bg " +
  "py-2.5 px-3 text-gb-fg text-sm placeholder:text-gb-dark " +
  "focus:border-gb-green2 focus:outline-none focus:ring-1 focus:ring-gb-green2/30 " +
  "transition-all disabled:opacity-50 disabled:cursor-not-allowed";
