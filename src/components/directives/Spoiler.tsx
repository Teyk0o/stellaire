'use client'

import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface SpoilerProps {
  label?: string
  children: ReactNode
}

export function Spoiler({ label = 'Voir la réponse', children }: SpoilerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-4 border-l-2 border-accent/30 rounded-r-lg">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left text-secondary hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronRight
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium">{label}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 prose">
          {children}
        </div>
      )}
    </div>
  )
}
