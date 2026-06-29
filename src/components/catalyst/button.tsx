/**
 * Catalyst Button — adapted for Gruvbox Dark Hard.
 * Structure identical to Catalyst source; colors mapped to Gruvbox tokens.
 * LureLoadout is always dark so light-mode pseudo layers are removed.
 */
'use client'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { Link } from './link'

// Touch target helper — keeps small buttons accessible (44×44px tap target)
export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
      {children}
    </>
  )
}

const styles = {
  base: [
    'relative isolate inline-flex items-center justify-center gap-x-2 rounded-xl border text-sm font-semibold',
    'px-3.5 py-2.5 sm:px-3 sm:py-1.5',
    'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-gb-green2',
    'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center',
  ],
  solid: [
    'border-transparent',
    // Inset highlight
    'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(var(--radius-xl)-1px)]',
    'data-active:after:bg-black/10 data-hover:after:bg-black/5',
  ],
  outline: [
    'border-gb-border text-gb-muted',
    'data-hover:border-gb-border2 data-hover:text-gb-fg',
    'data-active:bg-gb-border/20',
  ],
  outlineBlue: [
    'border-gb-border text-gb-blue',
    'data-hover:border-gb-blue data-hover:text-gb-blue',
    'data-active:bg-gb-blue/10',
  ],
  outlineDanger: [
    'border-gb-red2/50 text-gb-red',
    'data-hover:border-gb-red2 data-hover:bg-gb-red2/10',
    'data-active:bg-gb-red2/20',
  ],
  outlineGreen: [
    'border-gb-green2/50 text-gb-green',
    'data-hover:border-gb-green2 data-hover:bg-gb-green2/10',
  ],
  plain: [
    'border-transparent text-gb-muted',
    'data-hover:bg-gb-border/40 data-hover:text-gb-fg',
    'data-active:bg-gb-border/60',
  ],
}

// Gruvbox color variants — replaces Catalyst's zinc/cyan/red palette
const colors = {
  primary: [
    '[--btn-bg:var(--color-gb-green2)] [--btn-border:var(--color-gb-green2)] [--btn-hover-overlay:var(--color-gb-green)]',
    'text-gb-bg shadow-sm',
    'data-active:bg-gb-green',
  ],
  danger: [
    '[--btn-bg:var(--color-gb-red2)] [--btn-border:var(--color-gb-red2)] [--btn-hover-overlay:var(--color-gb-red)]',
    'text-white shadow-sm',
  ],
  yellow: [
    '[--btn-bg:var(--color-gb-yellow2)] [--btn-border:var(--color-gb-yellow2)]',
    'text-gb-bg shadow-sm',
  ],
  orange: [
    '[--btn-bg:var(--color-gb-orange)] [--btn-border:var(--color-gb-orange)]',
    'text-gb-bg shadow-sm',
  ],
  muted: [
    '[--btn-bg:var(--color-gb-border)] [--btn-border:var(--color-gb-border)]',
    'text-gb-fg',
    'data-hover:bg-gb-border2',
  ],
}

type Variant = 'solid' | 'outline' | 'plain'
type Color   = keyof typeof colors | 'blue' | 'green'  // outline-only colors

type ButtonProps = {
  variant?: Variant
  color?:   Color
  size?:    'sm' | 'md' | 'lg' | 'full'
} & (
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'color'>
  | (Omit<Headless.ButtonProps, 'as' | 'className' | 'color'> & { href?: undefined })
)

const sizeMap = {
  sm:   'px-3 py-1.5 text-xs sm:px-2.5 sm:py-1',
  md:   '',          // default from base
  lg:   'px-5 py-3',
  full: 'w-full px-4 py-3',
}

export const Button = forwardRef(function Button(
  { variant = 'solid', color = 'primary', size = 'md', className, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  // Resolve classes — outline variant supports color overrides
  const outlineColor =
    color === 'blue'   ? styles.outlineBlue   :
    color === 'danger' ? styles.outlineDanger  :
    color === 'green'  ? styles.outlineGreen   :
    styles.outline

  const classes = clsx(
    className,
    styles.base,
    sizeMap[size],
    variant === 'outline' ? outlineColor :
    variant === 'plain'   ? styles.plain :
    [styles.solid, colors[color as keyof typeof colors] ?? colors.primary],
  )

  return 'href' in props ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref as React.ForwardedRef<HTMLButtonElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Headless.Button>
  )
})
