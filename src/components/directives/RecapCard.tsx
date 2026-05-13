'use client'

import { useState, type ReactNode } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'

interface RecapCardProps {
  children: ReactNode
}

export function RecapCard({ children }: RecapCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-8 rounded-lg border border-recap-border bg-recap-bg">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-6 py-4 text-left cursor-pointer"
      >
        <BookOpen size={18} className="text-accent shrink-0" />
        <span className="text-sm font-semibold text-accent flex-1">Fiche récap</span>
        <ChevronRight
          size={16}
          className={`text-accent/50 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 prose">
          {children}
        </div>
      )}
    </div>
  )
}
