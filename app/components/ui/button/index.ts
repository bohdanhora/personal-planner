import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-mono text-2xs uppercase tracking-wider transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper hover:bg-brand hover:text-on-brand',
        brand: 'bg-brand text-on-brand hover:bg-ink hover:text-paper',
        destructive: 'bg-danger text-white hover:bg-ink hover:text-paper',
        outline: 'border border-rule-strong bg-transparent text-ink hover:bg-ink hover:text-paper',
        secondary: 'border border-rule bg-surface text-ink hover:border-rule-strong',
        ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        link: 'h-auto px-0 text-ink underline decoration-rule underline-offset-4 hover:bg-brand hover:text-on-brand hover:decoration-transparent',
      },
      size: {
        default: 'h-10 px-4',
        xs: "h-6 gap-1 px-2 text-3xs [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 px-3',
        lg: 'h-12 px-6',
        icon: 'size-10',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
