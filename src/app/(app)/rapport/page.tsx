'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ContentShell } from '@/components/layout/ContentShell'
import { ReportActions } from '@/components/rapport/ReportActions'
import { TimelineChart } from '@/components/rapport/TimelineChart'
import { QRCode } from '@/components/rapport/QRCode'
import { Shield, Hash, Calendar, BookOpen, CheckCircle, Trophy, Clock, ExternalLink, AlertTriangle, User } from 'lucide-react'
import type { ReportData } from '@/lib/report'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RapportPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  function loadReport() {
    fetch('/api/rapport')
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(loadReport, [])

  async function generate() {
    const res = await fetch('/api/rapport', { method: 'POST' })
    const data = await res.json()
    setReport(data)
  }

  if (loading) {
    return <ContentShell><div className="text-secondary text-center py-12">Chargement...</div></ContentShell>
  }

  if (!report) {
    return <ContentShell><p className="text-secondary">Erreur de chargement.</p></ContentShell>
  }

  const verifyUrl = report.hash
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/rapport/verify/${report.hash}`
    : null

  const hasProfile = report.profile && report.profile.firstName && report.profile.lastName

  return (
    <>
    <ContentShell>
      {/* Actions (screen only) */}
      <div className="print-hidden mb-6">
        {!hasProfile && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-attention-border bg-attention-bg mb-4">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Profil incomplet</p>
              <p className="text-xs text-secondary mb-2">
                Renseigne tes informations personnelles pour qu&apos;elles apparaissent sur le rapport.
              </p>
              <Link href="/parametres" className="text-xs text-accent hover:underline">Aller aux paramètres</Link>
            </div>
          </div>
        )}
        <ReportActions onGenerate={generate} hasHash={!!report.hash} />
      </div>

      {/* ===== PRINT HEADER (fixed on every page) ===== */}
      <div className="hidden print-header items-center justify-between border-b-2 border-foreground/10 pb-3 mb-6">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Stellaire" width={36} height={36} />
          <div>
            <p className="text-lg font-bold leading-tight">Stellaire</p>
            <p className="text-[10px] text-secondary">Rapport de compétences</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-secondary leading-tight">
          <p>{formatDate(report.generatedAt)}</p>
          {report.hash && <p className="font-mono">{report.hash.slice(0, 20)}</p>}
          {hasProfile && <p>{report.profile!.firstName} {report.profile!.lastName}</p>}
        </div>
      </div>

      {/* ===== DOCUMENT TITLE ===== */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1">Rapport de compétences</h1>
        <p className="text-lg text-secondary mb-4 print-hidden">Stellaire</p>
        <div className="flex items-center justify-center gap-4 text-xs text-secondary">
          <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(report.generatedAt)}</span>
          {report.hash && <span className="flex items-center gap-1 font-mono"><Hash size={12} />{report.hash.slice(0, 16)}...</span>}
        </div>
      </div>

      {/* ===== IDENTITY SECTION ===== */}
      {hasProfile && (
        <div className="rounded-lg border border-foreground/10 p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-secondary" />
            <h2 className="text-sm font-semibold text-secondary">Identité du candidat</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            <div className="text-secondary">Nom complet</div>
            <div className="font-medium">{report.profile!.firstName} {report.profile!.lastName}</div>
            <div className="text-secondary">Date de naissance</div>
            <div>{formatDate(report.profile!.birthDate)}</div>
            <div className="text-secondary">Email</div>
            <div>{report.profile!.email}</div>
            <div className="text-secondary">Adresse</div>
            <div>{report.profile!.address}</div>
          </div>
        </div>
      )}

      {/* ===== INTEGRITY BANNER ===== */}
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 mb-8">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-success mb-1">Document certifié</p>
            <p className="text-xs text-secondary">
              Ce rapport est généré automatiquement à partir des données de progression enregistrées
              par l&apos;application Stellaire. Les données sont signées par un hash SHA-256 vérifiable.
              Le code source du framework est public et auditable sur GitHub.
            </p>
            <a href="https://github.com/Teyk0o/stellaire" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent mt-2 hover:underline print-hidden">
              <ExternalLink size={12} /> github.com/Teyk0o/stellaire
            </a>
          </div>
        </div>
      </div>

      {/* ===== SUMMARY ===== */}
      <h2 className="text-xl font-semibold mb-4">Résumé</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-lg border border-foreground/10 p-4">
          <div className="flex items-center gap-2 mb-1"><BookOpen size={14} className="text-secondary" /><span className="text-xs text-secondary">Cours complétés</span></div>
          <p className="text-2xl font-bold">{report.summary.completedCourses}<span className="text-sm font-normal text-secondary">/{report.summary.totalCourses}</span></p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <div className="flex items-center gap-2 mb-1"><Trophy size={14} className="text-secondary" /><span className="text-xs text-secondary">Taux de maîtrise</span></div>
          <p className="text-2xl font-bold">{report.summary.masteryRate}%</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={14} className="text-secondary" /><span className="text-xs text-secondary">Exercices réussis</span></div>
          <p className="text-2xl font-bold">{report.summary.correctExercises}<span className="text-sm font-normal text-secondary">/{report.summary.totalExercises}</span></p>
          <p className="text-xs text-secondary">{report.summary.exerciseSuccessRate}% de réussite</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-secondary" /><span className="text-xs text-secondary">Temps estimé</span></div>
          <p className="text-2xl font-bold">{report.summary.estimatedHours}<span className="text-sm font-normal text-secondary"> h</span></p>
        </div>
      </div>

      {/* ===== PER SUBJECT ===== */}
      <h2 className="text-xl font-semibold mb-4">Répartition par matière</h2>
      <div className="space-y-4 mb-8">
        {report.subjects.map(subject => (
          <div key={subject.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{subject.name}</span>
              <span className="text-sm text-secondary">{subject.completed}/{subject.total} ({subject.rate}%)</span>
            </div>
            <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${subject.rate}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ===== TIMELINE ===== */}
      {report.timeline.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 print-break-before">Activité dans le temps</h2>
          <div className="mb-8"><TimelineChart data={report.timeline} /></div>
        </>
      )}

      {/* ===== EXAMS ===== */}
      {report.exams.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Examens blancs</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="text-left py-2 font-medium text-secondary">Date</th>
                  <th className="text-left py-2 font-medium text-secondary">Score</th>
                  <th className="text-left py-2 font-medium text-secondary">Questions</th>
                  <th className="text-left py-2 font-medium text-secondary">Durée</th>
                </tr>
              </thead>
              <tbody>
                {report.exams.map((exam, i) => (
                  <tr key={i} className="border-b border-foreground/5">
                    <td className="py-2">{exam.date}</td>
                    <td className="py-2 font-medium">{Math.round(exam.score * 100)}%</td>
                    <td className="py-2">{exam.correctAnswers}/{exam.totalQuestions}</td>
                    <td className="py-2">{Math.floor(exam.timeSeconds / 60)}:{(exam.timeSeconds % 60).toString().padStart(2, '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== HARDEST EXERCISES ===== */}
      {report.hardestExercises.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Exercices difficiles maîtrisés</h2>
          <div className="space-y-2 mb-8">
            {report.hardestExercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg border border-foreground/8 text-sm">
                <span>{ex.courseTitle}</span>
                <span className="text-secondary">{ex.attempts} tentatives</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== INTEGRITY + VERIFICATION ===== */}
      <div className="border-t-2 border-foreground/10 pt-8 mt-8 print-break-before">
        <h2 className="text-lg font-semibold mb-4">Preuve d&apos;intégrité</h2>

        <p className="text-xs text-secondary mb-4">
          Les informations ci-dessous permettent de vérifier que ce document n&apos;a pas été altéré.
          Le hash est calculé à partir de l&apos;intégralité des données de progression au moment de la génération.
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
          <div className="text-secondary">Hash des données (SHA-256)</div>
          <div className="font-mono text-xs break-all">{report.integrity.dataHash}</div>
          <div className="text-secondary">Période d&apos;activité</div>
          <div>{report.integrity.firstActivity || '—'} → {report.integrity.lastActivity || '—'}</div>
          <div className="text-secondary">Exercices enregistrés</div>
          <div>{report.integrity.exerciseCount}</div>
          <div className="text-secondary">Sessions de révision</div>
          <div>{report.integrity.revisionCount}</div>
          <div className="text-secondary">Examens blancs passés</div>
          <div>{report.integrity.examCount}</div>
          <div className="text-secondary">Code source (open source)</div>
          <div className="font-mono text-xs">github.com/Teyk0o/stellaire</div>
        </div>

        {verifyUrl && (
          <div className="flex items-start gap-6 pt-4 border-t border-foreground/5">
            <QRCode url={verifyUrl} />
            <div>
              <p className="text-sm font-semibold mb-1">Vérification en ligne</p>
              <p className="text-xs text-secondary mb-2">
                Scannez ce QR code pour vérifier l&apos;authenticité du rapport
                directement sur le serveur de l&apos;application.
              </p>
              <p className="text-xs font-mono text-secondary break-all">{verifyUrl}</p>
            </div>
          </div>
        )}
      </div>

    </ContentShell>

    {/* Print footer — outside ContentShell to avoid max-width constraint */}
    <div className="hidden print-footer text-[9px] text-secondary">
      <div className="flex items-center justify-between gap-4 w-full">
        <span>
          Stellaire &mdash; Rapport de compétences
          {hasProfile && <> &mdash; {report.profile!.firstName} {report.profile!.lastName}</>}
        </span>
        <span className="text-right">
          {'Généré le '}{formatDate(report.generatedAt)}{' — github.com/Teyk0o/stellaire'}
        </span>
      </div>
    </div>
    </>
  )
}
