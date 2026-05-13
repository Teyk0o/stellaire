import Link from 'next/link'
import { ContentShell } from '@/components/layout/ContentShell'

export default function NotFound() {
  return (
    <ContentShell>
      <h1 className="text-2xl font-bold mb-4">Page introuvable</h1>
      <p className="text-secondary mb-6">
        Cette page n&apos;existe pas.
      </p>
      <Link
        href="/"
        className="text-accent hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </ContentShell>
  )
}
