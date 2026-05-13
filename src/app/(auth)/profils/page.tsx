'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, RefreshCw, Pencil } from 'lucide-react'
import type { ProfileEntry } from '@/types/course'

const COLORS = ['#C85A2A', '#3B82F6', '#2D8A4E', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1']
const AVATAR_STYLES = [
  { id: 'notionists-neutral' as const, label: 'Notionists' },
  { id: 'lorelei-neutral' as const, label: 'Lorelei' },
]

function avatarUrl(style: string, seed: string, bg: string) {
  const bgHex = bg.replace('#', '')
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgHex}&backgroundType=solid&radius=16`
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10)
}

type FormMode = null | 'create' | 'edit'

export default function ProfilsPage() {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<FormMode>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(COLORS[0])
  const [formStyle, setFormStyle] = useState<ProfileEntry['avatarStyle']>('notionists-neutral')
  const [formSeed, setFormSeed] = useState(randomSeed())
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setMode(null)
    setEditId(null)
    setFormName('')
    setFormColor(COLORS[0])
    setFormStyle('notionists-neutral')
    setFormSeed(randomSeed())
  }

  function startEdit(profile: ProfileEntry, e: React.MouseEvent) {
    e.stopPropagation()
    setMode('edit')
    setEditId(profile.id)
    setFormName(profile.name)
    setFormColor(profile.color)
    setFormStyle(profile.avatarStyle || 'notionists-neutral')
    setFormSeed(profile.avatarSeed || profile.name)
  }

  async function selectProfile(id: string) {
    await fetch('/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'select', id }),
    })
    router.push('/')
    router.refresh()
  }

  async function handleCreate() {
    if (!formName.trim()) return
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName.trim(), color: formColor, avatarStyle: formStyle, avatarSeed: formSeed }),
    })
    const profile = await res.json()
    setProfiles(prev => [...prev, profile])
    resetForm()
    router.push('/')
    router.refresh()
  }

  async function handleEdit() {
    if (!formName.trim() || !editId) return
    const res = await fetch('/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, name: formName.trim(), color: formColor, avatarStyle: formStyle, avatarSeed: formSeed }),
    })
    const updated = await res.json()
    setProfiles(prev => prev.map(p => p.id === editId ? updated : p))
    resetForm()
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce profil et toutes ses données ?')) return
    await fetch('/api/profiles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (editId === id) resetForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <img src="/icon.png" alt="Stellaire" width={56} height={56} className="mb-4 animate-scale-in" />
      <h1 className="text-2xl font-bold mb-1 animate-fade-in-up" style={{ animationDelay: '50ms' }}>Stellaire</h1>
      <p className="text-secondary text-sm mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>Qui étudie aujourd&apos;hui ?</p>

      <div className="flex flex-wrap justify-center gap-6 max-w-2xl mb-8">
        {profiles.map((profile, i) => (
          <div
            key={profile.id}
            onClick={() => selectProfile(profile.id)}
            className="group flex flex-col items-center gap-2 cursor-pointer animate-scale-in"
            style={{ animationDelay: `${150 + i * 80}ms` }}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && selectProfile(profile.id)}
          >
            <div className="relative">
              <img
                src={avatarUrl(profile.avatarStyle || 'notionists-neutral', profile.avatarSeed || profile.name, profile.color)}
                alt={profile.name}
                width={80}
                height={80}
                className="rounded-2xl shadow-sm group-hover:scale-105 transition-transform"
              />
              <button
                onClick={(e) => startEdit(profile, e)}
                className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-background border border-foreground/10 text-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm hover:text-accent"
              >
                <Pencil size={11} />
              </button>
            </div>
            <span className="text-sm font-medium">{profile.name}</span>
          </div>
        ))}

        {!mode && (
          <button
            onClick={() => setMode('create')}
            className="flex flex-col items-center gap-2 cursor-pointer animate-scale-in"
            style={{ animationDelay: `${150 + profiles.length * 80}ms` }}
          >
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-foreground/15 flex items-center justify-center text-secondary hover:border-accent hover:text-accent transition-colors">
              <Plus size={28} />
            </div>
            <span className="text-sm text-secondary">Nouveau</span>
          </button>
        )}
      </div>

      {mode && (
        <div className="w-full max-w-md rounded-xl border border-foreground/10 p-6 animate-fade-in-up">
          <h2 className="font-semibold mb-5">
            {mode === 'create' ? 'Nouveau profil' : 'Modifier le profil'}
          </h2>

          <div className="flex justify-center mb-5">
            <div className="relative">
              <img
                src={avatarUrl(formStyle, formSeed, formColor)}
                alt="Avatar"
                width={96}
                height={96}
                className="rounded-2xl shadow-sm"
              />
              <button
                onClick={() => setFormSeed(randomSeed())}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-background border border-foreground/10 flex items-center justify-center text-secondary hover:text-accent cursor-pointer shadow-sm"
                title="Changer d'avatar"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Prénom"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-foreground/10 text-sm outline-none focus:border-accent mb-4"
            onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleEdit())}
          />

          <p className="text-xs text-secondary mb-2">Style d&apos;avatar</p>
          <div className="flex gap-3 mb-4">
            {AVATAR_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setFormStyle(style.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                  formStyle === style.id ? 'border-accent bg-accent/5' : 'border-foreground/10 hover:border-foreground/20'
                }`}
              >
                <img
                  src={avatarUrl(style.id, formSeed, formColor)}
                  alt={style.label}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <span className="text-[10px] text-secondary">{style.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-secondary mb-2">Couleur de fond</p>
          <div className="flex gap-2 mb-5">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => setFormColor(color)}
                className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                  formColor === color ? 'scale-110 ring-2 ring-offset-2 ring-foreground/20' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={mode === 'create' ? handleCreate : handleEdit}
              disabled={!formName.trim()}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-40"
            >
              {mode === 'create' ? 'Créer le profil' : 'Enregistrer'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-lg border border-foreground/10 text-sm text-secondary hover:bg-foreground/3 transition-colors cursor-pointer"
            >
              Annuler
            </button>
          </div>
          {mode === 'edit' && editId && (
            <button
              onClick={(e) => { handleDelete(editId, e) }}
              className="w-full mt-3 py-2 rounded-lg text-sm text-error hover:bg-error/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center justify-center gap-1.5"><Trash2 size={14} /> Supprimer ce profil</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
