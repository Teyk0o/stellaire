'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { Save, Check } from 'lucide-react'
import type { UserProfile } from '@/types/course'

const emptyProfile: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  address: '',
}

export default function ParametresPage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => { if (data) setProfile(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(field: keyof UserProfile, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  if (loading) {
    return <ContentShell><div className="text-secondary text-center py-12">Chargement...</div></ContentShell>
  }

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
      <p className="text-secondary mb-8">
        Ces informations apparaissent sur le rapport de compétences pour identifier son auteur.
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input
              type="text" value={profile.firstName} onChange={e => update('firstName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text" value={profile.lastName} onChange={e => update('lastName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email" value={profile.email} onChange={e => update('email', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date de naissance</label>
          <input
            type="date" value={profile.birthDate} onChange={e => update('birthDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input
            type="text" value={profile.address} onChange={e => update('address', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent"
            placeholder="Rue, code postal, ville"
            required
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer"
        >
          {saved ? <><Check size={16} /> Enregistré</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </form>
    </ContentShell>
  )
}
