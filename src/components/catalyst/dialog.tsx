/**
 * Catalyst Dialog — adapted for Gruvbox Dark Hard.
 * Uses Headless UI Dialog with smooth slide-up animation on mobile.
 * Panel background → gb-surface, backdrop → black/70 with blur.
 */
'use client'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React from 'react'

const sizes = {
  xs:  'sm:max-w-xs',
  sm:  'sm:max-w-sm',
  md:  'sm:max-w-md',
  lg:  'sm:max-w-lg',
  xl:  'sm:max-w-xl',
}

export function Dialog({
  size = 'md',
  className,
  children,
  ...props
}: {
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
} & Omit<Headless.DialogProps, 'as' | 'className'>) {
  return (
    <Headless.Dialog {...props}>
      {/* Backdrop */}
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition duration-200 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in"
      />
      {/* Panel container */}
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto pt-6 sm:pt-0">
        <div className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <Headless.DialogPanel
            transition
            className={clsx(
              className,
              sizes[size],
              // Gruvbox surface with border
              'row-start-2 w-full min-w-0 rounded-t-3xl sm:rounded-2xl',
              'bg-gb-surface ring-1 ring-gb-border',
              'p-6 sm:p-8',
              'shadow-2xl',
              // Animation — slides up on mobile, scales on desktop
              'transition duration-200 will-change-transform',
              'data-closed:translate-y-12 data-closed:opacity-0',
              'data-enter:ease-out data-leave:ease-in',
              'sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95',
            )}
          >
            {children}
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}

export function DialogTitle({ className, ...props }: { className?: string } & Omit<Headless.DialogTitleProps, 'as' | 'className'>) {
  return (
    <Headless.DialogTitle
      {...props}
      className={clsx(className, 'text-base/6 font-semibold text-gb-fg sm:text-sm/6')}
    />
  )
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return <p {...props} className={clsx(className, 'mt-2 text-sm text-gb-muted leading-relaxed')} />
}

export function DialogBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'mt-5')} />
}

export function DialogActions({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'mt-6 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto',
      )}
    />
  )
}
