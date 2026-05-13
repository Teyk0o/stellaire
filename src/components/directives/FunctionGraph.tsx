'use client'

import { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface FunctionGraphProps {
  fn: string
  range?: string
  label?: string
}

function evalFn(expr: string, x: number): number | null {
  try {
    const sanitized = expr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/log/g, 'Math.log')
      .replace(/pi/g, 'Math.PI')
      .replace(/e(?![a-z])/g, 'Math.E')

    const fn = new Function('x', `return ${sanitized}`)
    const result = fn(x)
    if (!isFinite(result)) return null
    return result
  } catch {
    return null
  }
}

export function FunctionGraph({ fn, range = '[-5,5]', label }: FunctionGraphProps) {
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null)

  const { data, xMin, xMax } = useMemo(() => {
    const parsed = range.replace(/[\[\]]/g, '').split(',').map(Number)
    const xMin = parsed[0] ?? -5
    const xMax = parsed[1] ?? 5
    const steps = 200
    const step = (xMax - xMin) / steps
    const data: Array<{ x: number; y: number | null }> = []

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * step
      const y = evalFn(fn, x)
      data.push({ x: Math.round(x * 1000) / 1000, y })
    }

    return { data, xMin, xMax }
  }, [fn, range])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {label && <p className="text-sm font-medium text-secondary mb-3">{label}</p>}
      <p className="text-xs text-secondary mb-2 font-mono">f(x) = {fn}</p>
      <div className="h-64">
        {!mounted ? <div className="h-full bg-foreground/3 rounded-lg animate-pulse" /> : <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            onMouseMove={(e: Record<string, unknown>) => {
              const payload = e?.activePayload as Array<{ payload: { x: number; y: number | null } }> | undefined
              if (payload?.[0]?.payload?.y !== null && payload?.[0]) {
                setHoverPoint({ x: payload[0].payload.x, y: payload[0].payload.y! })
              }
            }}
            onMouseLeave={() => setHoverPoint(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[xMin, xMax]}
              tick={{ fontSize: 11, fill: '#6B6B6B' }}
              tickCount={11}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B6B6B' }}
            />
            <ReferenceLine x={0} stroke="#aaa" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#aaa" strokeWidth={1} />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(2), 'f(x)']}
              labelFormatter={(label) => `x = ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#C85A2A"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>}
      </div>
      {hoverPoint && (
        <p className="text-xs text-secondary mt-2 font-mono">
          ({hoverPoint.x.toFixed(2)}, {hoverPoint.y.toFixed(2)})
        </p>
      )}
    </div>
  )
}
