import type { ReactNode } from 'react'
import { Rocket, AlertTriangle, Info, Lightbulb } from 'lucide-react'

type CalloutVariant = 'info' | 'tip' | 'attention' | 'spatial'

interface CalloutProps {
  variant: CalloutVariant
  label?: string
  children: ReactNode
}

const variants: Record<CalloutVariant, {
  icon: typeof Info
  bg: string
  border: string
  defaultLabel: string
}> = {
  info: {
    icon: Info,
    bg: 'bg-info-bg',
    border: 'border-info-border',
    defaultLabel: 'Information',
  },
  tip: {
    icon: Lightbulb,
    bg: 'bg-tip-bg',
    border: 'border-tip-border',
    defaultLabel: 'Astuce',
  },
  attention: {
    icon: AlertTriangle,
    bg: 'bg-attention-bg',
    border: 'border-attention-border',
    defaultLabel: 'Attention',
  },
  spatial: {
    icon: Rocket,
    bg: 'bg-spatial-bg',
    border: 'border-spatial-border',
    defaultLabel: 'Application spatiale',
  },
}

function Callout({ variant, label, children }: CalloutProps) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <div className={`my-6 rounded-r-lg border-l-4 ${config.border} ${config.bg} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-secondary shrink-0" />
        <span className="text-sm font-semibold text-secondary">
          {label || config.defaultLabel}
        </span>
      </div>
      <div className="prose">
        {children}
      </div>
    </div>
  )
}

export function InfoCallout({ label, children }: { label?: string; children: ReactNode }) {
  return <Callout variant="info" label={label}>{children}</Callout>
}

export function TipCallout({ label, children }: { label?: string; children: ReactNode }) {
  return <Callout variant="tip" label={label}>{children}</Callout>
}

export function AttentionCallout({ label, children }: { label?: string; children: ReactNode }) {
  return <Callout variant="attention" label={label}>{children}</Callout>
}

export function SpatialCallout({ label, children }: { label?: string; children: ReactNode }) {
  return <Callout variant="spatial" label={label}>{children}</Callout>
}
