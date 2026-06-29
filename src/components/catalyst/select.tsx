/**
 * Catalyst Select — adapted for Gruvbox Dark Hard.
 * Removes light-mode before: pseudo layer.
 * Uses Gruvbox tokens instead of zinc/white.
 */
'use client'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

export const Select = forwardRef(function Select(
  { className, multiple, ...props }: { className?: string } & Omit<Headless.SelectProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLSelectElement>
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        'group relative block w-full',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-transparent after:ring-inset has-data-focus:after:ring-2 has-data-focus:after:ring-gb-green2',
        // Disabled
        'has-data-disabled:opacity-50',
      ])}
    >
      <Headless.Select
        ref={ref}
        multiple={multiple}
        {...props}
        className={clsx([
          // Layout
          'relative block w-full appearance-none rounded-xl',
          'py-[calc(var(--spacing,0.25rem)*2.5-1px)] sm:py-[calc(var(--spacing,0.25rem)*1.5-1px)]',
          multiple
            ? 'px-[calc(var(--spacing,0.25rem)*3.5-1px)] sm:px-[calc(var(--spacing,0.25rem)*3-1px)]'
            : 'pr-10 pl-[calc(var(--spacing,0.25rem)*3.5-1px)] sm:pr-9 sm:pl-[calc(var(--spacing,0.25rem)*3-1px)]',
          // Typography
          'text-base/6 text-gb-fg placeholder:text-gb-dark sm:text-sm/6',
          '[&_optgroup]:font-semibold',
          // Border
          'border border-gb-border data-hover:border-gb-border2',
          // Background
          'bg-gb-bg *:bg-gb-surface',
          // Focus
          'focus:outline-hidden',
          // Invalid
          'data-invalid:border-gb-red',
          // Disabled
          'data-disabled:border-gb-border/50',
          // Cursor
          'cursor-pointer',
        ])}
      />
      {!multiple && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
          <svg className="size-4 stroke-gb-faint group-has-data-disabled:stroke-gb-dark" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path d="M5.75 10.75L8 13L10.25 10.75" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.25 5.25L8 3L5.75 5.25" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </span>
  )
})
