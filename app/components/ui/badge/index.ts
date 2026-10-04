import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap border px-1.5 py-0.5 font-mono text-3xs uppercase leading-none tracking-wide transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-ink bg-ink text-paper',
        brand: 'border-brand bg-brand text-on-brand',
        secondary: 'border-rule bg-surface-muted text-ink-muted',
        destructive: 'border-danger text-danger',
        outline: 'border-rule text-ink-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
