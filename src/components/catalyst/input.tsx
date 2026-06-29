/**
 * Catalyst Input — adapted for Gruvbox Dark Hard.
 * Removes light-mode before: pseudo layer (always dark).
 * Maps zinc/white tokens to Gruvbox variables.
 */
'use client'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { className, ...props }: { className?: string } & Omit<Headless.InputProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        'relative block w-full',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-gb-green2',
        // Disabled
        'has-data-disabled:opacity-50',
      ])}
    >
      <Headless.Input
        ref={ref}
        {...props}
        className={clsx([
          // Layout
          'relative block w-full appearance-none rounded-xl',
          'px-[calc(var(--spacing,0.25rem)*3.5-1px)] py-[calc(var(--spacing,0.25rem)*2.5-1px)]',
          'sm:px-[calc(var(--spacing,0.25rem)*3-1px)] sm:py-[calc(var(--spacing,0.25rem)*1.5-1px)]',
          // Typography
          'text-base/6 text-gb-fg placeholder:text-gb-dark sm:text-sm/6',
          // Border — Gruvbox
          'border border-gb-border data-hover:border-gb-border2',
          // Background
          'bg-gb-bg',
          // Focus
          'focus:outline-hidden',
          // Invalid
          'data-invalid:border-gb-red data-invalid:data-hover:border-gb-red',
          // Disabled
          'data-disabled:border-gb-border/50 data-disabled:bg-gb-border/10',
        ])}
      />
    </span>
  )
})

// InputGroup — wraps Input with an icon
export function InputGroup({ children }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="control"
      className={clsx(
        'relative isolate block',
        'has-[[data-slot=icon]:first-child]:[&_input]:pl-10 has-[[data-slot=icon]:last-child]:[&_input]:pr-10',
        'sm:has-[[data-slot=icon]:first-child]:[&_input]:pl-8 sm:has-[[data-slot=icon]:last-child]:[&_input]:pr-8',
        '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-3 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-5',
        'sm:*:data-[slot=icon]:top-2.5 sm:*:data-[slot=icon]:size-4',
        '[&>[data-slot=icon]:first-child]:left-3 sm:[&>[data-slot=icon]:first-child]:left-2.5',
        '[&>[data-slot=icon]:last-child]:right-3 sm:[&>[data-slot=icon]:last-child]:right-2.5',
        '*:data-[slot=icon]:text-gb-faint',
      )}
    >
      {children}
    </span>
  )
}
