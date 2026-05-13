'use client'

import { useState, useEffect, use } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { ShieldCheck, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react'

interface VerifyResult {
  authentic: boolean
  date?: string
  snapshotMatch: boolean
  details: string
}

export default function VerifyPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/rapport/verify?hash=${encodeURIComponent(hash)}`)
      .then(r => r.json())
      .then(setResult)
      .catch(() => setResult({ authentic: false, snapshotMatch: false, details: 'Erreur de vérification.' }))
      .finally(() => setLoading(false))
  }, [hash])

  return (
    <ContentShell>
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-8">Vérification du rapport</h1>

        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent animate-spin" />
            <p className="text-secondary">Vérification en cours...</p>
          </div>
        )}

        {!loading && result && (
          <>
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              result.authentic ? 'bg-success/10' : 'bg-error/10'
            }`}>
              {result.authentic
                ? <ShieldCheck size={40} className="text-success" />
                : <ShieldAlert size={40} className="text-error" />
              }
            </div>

            <h2 className={`text-xl font-bold mb-2 ${result.authentic ? 'text-success' : 'text-error'}`}>
              {result.authentic ? 'Rapport authentique' : 'Rapport non vérifié'}
            </h2>

            <p className="text-secondary text-sm mb-4">{result.details}</p>

            {result.date && (
              <p className="text-xs text-secondary mb-6">
                Généré le {new Date(result.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            <div className="rounded-lg border border-foreground/10 p-4 text-left mb-6">
              <p className="text-xs text-secondary mb-2">Hash vérifié :</p>
              <p className="text-xs font-mono break-all">{hash}</p>
            </div>

            <a
              href="https://github.com/Teyk0o/stellaire"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ExternalLink size={14} />
              Voir le code source
            </a>

            <p className="text-xs text-secondary mt-4">
              Ce framework est open source. Le code de génération et de vérification
              des rapports est auditable publiquement.
            </p>
          </>
        )}
      </div>
    </ContentShell>
  )
}
