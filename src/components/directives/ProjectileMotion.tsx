'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface ProjectileMotionProps {
  label?: string
  v0?: string
  angle?: string
  g?: string
}

export function ProjectileMotion({
  label,
  v0: initV0 = '20',
  angle: initAngle = '45',
  g: gravity = '9.81',
}: ProjectileMotionProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [v0, setV0] = useState(parseFloat(initV0))
  const [angleDeg, setAngleDeg] = useState(parseFloat(initAngle))
  const g = parseFloat(gravity)

  const angleRad = angleDeg * Math.PI / 180
  const vx = v0 * Math.cos(angleRad)
  const vy = v0 * Math.sin(angleRad)
  const tFlight = 2 * vy / g
  const maxHeight = (vy * vy) / (2 * g)
  const range = vx * tFlight

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 500
    const height = 280
    const margin = { top: 20, right: 30, bottom: 40, left: 50 }

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const points: Array<{ x: number; y: number }> = []
    const steps = 200
    for (let i = 0; i <= steps; i++) {
      const t = (tFlight * i) / steps
      const x = vx * t
      const y = vy * t - 0.5 * g * t * t
      if (y >= 0) points.push({ x, y })
    }

    const xMax = Math.max(range * 1.1, 1)
    const yMax = Math.max(maxHeight * 1.3, 1)

    const xScale = d3.scaleLinear().domain([0, xMax]).range([margin.left, width - margin.right])
    const yScale = d3.scaleLinear().domain([0, yMax]).range([height - margin.bottom, margin.top])

    const gr = svg.append('g')

    // Axes
    gr.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call(g => g.select('.domain').attr('stroke', '#ccc'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#eee'))
      .call(g => g.selectAll('.tick text').attr('fill', '#6B6B6B').attr('font-size', 10))

    gr.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5))
      .call(g => g.select('.domain').attr('stroke', '#ccc'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#eee'))
      .call(g => g.selectAll('.tick text').attr('fill', '#6B6B6B').attr('font-size', 10))

    // Axis labels
    gr.append('text').attr('x', width / 2).attr('y', height - 5)
      .text('Distance (m)').attr('fill', '#6B6B6B').attr('font-size', 11).attr('text-anchor', 'middle')
    gr.append('text').attr('x', -height / 2 + 20).attr('y', 14).attr('transform', 'rotate(-90)')
      .text('Hauteur (m)').attr('fill', '#6B6B6B').attr('font-size', 11).attr('text-anchor', 'middle')

    // Trajectory
    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis)

    gr.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#C85A2A')
      .attr('stroke-width', 2.5)

    // Max height marker
    gr.append('line')
      .attr('x1', xScale(range / 2)).attr('y1', yScale(maxHeight))
      .attr('x2', xScale(range / 2)).attr('y2', yScale(0))
      .attr('stroke', '#3B82F6').attr('stroke-dasharray', '4 2').attr('stroke-width', 1)

    gr.append('circle')
      .attr('cx', xScale(range / 2)).attr('cy', yScale(maxHeight)).attr('r', 4)
      .attr('fill', '#3B82F6')

    // Range marker
    gr.append('circle')
      .attr('cx', xScale(range)).attr('cy', yScale(0)).attr('r', 4)
      .attr('fill', '#2D8A4E')

  }, [v0, angleDeg, g, vx, vy, tFlight, maxHeight, range])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {label && <p className="text-sm font-medium text-secondary mb-3">{label}</p>}

      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-secondary">V₀ (m/s)</span>
          <input
            type="range" min="5" max="50" step="1" value={v0}
            onChange={e => setV0(Number(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="font-mono text-xs w-8">{v0}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-secondary">Angle (°)</span>
          <input
            type="range" min="5" max="85" step="1" value={angleDeg}
            onChange={e => setAngleDeg(Number(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="font-mono text-xs w-8">{angleDeg}°</span>
        </label>
      </div>

      <svg ref={svgRef} className="w-full" />

      <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs font-mono text-secondary">
        <span className="text-[#C85A2A]">Portée = {range.toFixed(1)} m</span>
        <span className="text-[#3B82F6]">Hmax = {maxHeight.toFixed(1)} m</span>
        <span>T = {tFlight.toFixed(2)} s</span>
      </div>
    </div>
  )
}
