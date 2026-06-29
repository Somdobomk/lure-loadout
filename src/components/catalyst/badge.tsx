/**
 * Catalyst Badge — adapted for Gruvbox Dark Hard.
 * Uses Gruvbox color tokens instead of Tailwind's named palette.
 */
'use client'
import clsx from 'clsx'
import React from 'react'

// Gruvbox-mapped color variants
const colors = {
  green:  'bg-gb-green2/15 text-gb-green  border border-gb-green2/30',
  red:    'bg-gb-red2/15   text-gb-red    border border-gb-red2/30',
  yellow: 'bg-gb-yellow2/15 text-gb-yellow border border-gb-yellow2/30',
  orange: 'bg-gb-orange/15 text-gb-orange border border-gb-orange/30',
  blue:   'bg-gb-blue/15   text-gb-blue   border border-gb-blue/30',
  muted:  'bg-gb-border/40 text-gb-muted  border border-gb-border',
}

export type BadgeColor = keyof typeof colors

export function Badge({
  color = 'muted',
  className,
  ...props
}: { color?: BadgeColor } & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        colors[color],
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        'forced-colors:outline',
      )}
    />
  )
}
