import Link from 'next/link'
import { ContentShell } from '@/components/layout/ContentShell'

export default function CourseNotFound() {
  return (
    <ContentShell>
      <h1 className="text-2xl font-bold mb-4">Cours introuvable</h1>
      <p className="text-secondary mb-6">
        Ce cours n&apos;existe pas ou n&apos;a pas encore été ajouté.
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
