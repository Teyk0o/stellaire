'use client'

import { useState } from 'react'
import { FileText, Printer, Loader2 } from 'lucide-react'

interface ReportActionsProps {
  onGenerate: () => Promise<void>
  hasHash: boolean
}

export function ReportActions({ onGenerate, hasHash }: ReportActionsProps) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    await onGenerate()
    setGenerating(false)
  }

  return (
    <div className="flex gap-3 print-hidden">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        {hasHash ? 'Régénérer le rapport' : 'Générer le rapport certifié'}
      </button>
      {hasHash && (
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-foreground/10 text-sm font-medium hover:bg-foreground/3 transition-colors cursor-pointer"
        >
          <Printer size={16} />
          Imprimer / PDF
        </button>
      )}
    </div>
  )
}
