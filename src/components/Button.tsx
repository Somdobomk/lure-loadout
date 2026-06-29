/**
 * Button component — adapted from Tailwind UI Pocket template.
 * Pocket pattern: rounded-lg, py-2 px-3, text-sm font-semibold, transition-colors.
 * Colors swapped to Gruvbox Dark Hard palette.
 * Supports: solid (primary/danger/muted) and outline (default/danger/blue) variants.
 */
import Link from "next/link";
import clsx from "clsx";

// ── Base styles (from Pocket's baseStyles) ────────────────────────────────────
const baseStyles = {
  solid:
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
};

// ── Variant styles (Gruvbox color tokens replacing Pocket's cyan/gray) ─────────
const variantStyles = {
  solid: {
    primary: "bg-gb-green2 text-gb-bg hover:bg-gb-green active:bg-gb-green2/80 shadow-sm",
    danger:  "bg-gb-red2   text-white  hover:bg-gb-red  active:bg-gb-red2/80",
    muted:   "bg-gb-border text-gb-fg  hover:bg-gb-border2 active:bg-gb-border/80",
    yellow:  "bg-gb-yellow2 text-gb-bg hover:bg-gb-yellow active:bg-gb-yellow2/80 shadow-sm",
  },
  outline: {
    default: "border-gb-border text-gb-muted hover:border-gb-border2 hover:text-gb-fg active:bg-gb-border/20",
    danger:  "border-gb-red2/50 text-gb-red hover:border-gb-red2 hover:bg-gb-red2/10 active:bg-gb-red2/20",
    blue:    "border-gb-border2 text-gb-blue hover:bg-gb-border2 active:bg-gb-border/40",
    green:   "border-gb-green2/50 text-gb-green hover:border-gb-green2 hover:bg-gb-green2/10",
  },
};

// ── Size variants (Pocket uses a single size; we add sm/md/lg) ─────────────────
const sizeStyles = {
  sm:   "py-1.5 px-3 text-xs",
  md:   "py-2.5 px-4",
  lg:   "py-3   px-6",
  full: "py-3   px-4 w-full",
};

type SolidColor   = keyof typeof variantStyles.solid;
type OutlineColor = keyof typeof variantStyles.outline;
type Size         = keyof typeof sizeStyles;

type ButtonProps = (
  | { variant?: "solid";   color?: SolidColor   }
  | { variant:  "outline"; color?: OutlineColor }
) & (
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, "color">
  | (Omit<React.ComponentPropsWithoutRef<"button">, "color"> & { href?: undefined })
) & { size?: Size };

export function Button({ className, size = "md", ...props }: ButtonProps) {
  props.variant ??= "solid";
  props.color   ??= props.variant === "solid" ? "primary" : "default";

  const computed = clsx(
    baseStyles[props.variant],
    sizeStyles[size],
    props.variant === "outline"
      ? variantStyles.outline[props.color as OutlineColor]
      : variantStyles.solid[props.color as SolidColor],
    className,
  );

  if (typeof (props as { href?: string }).href !== "undefined") {
    return <Link className={computed} {...(props as React.ComponentPropsWithoutRef<typeof Link>)} />;
  }

  const { variant: _v, color: _c, ...rest } = props as React.ComponentPropsWithoutRef<"button"> & { variant?: string; color?: string; href?: undefined };
  return <button className={computed} {...rest} />;
}
