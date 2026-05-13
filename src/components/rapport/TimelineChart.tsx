'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TimelineChartProps {
  data: Array<{ week: string; exercises: number; revisions: number }>
}

export function TimelineChart({ data }: TimelineChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-64 bg-foreground/3 rounded-lg animate-pulse" />

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B6B6B' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6B6B6B' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="exercises" name="Exercices" fill="#C85A2A" radius={[2, 2, 0, 0]} />
          <Bar dataKey="revisions" name="Révisions" fill="#3B82F6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
