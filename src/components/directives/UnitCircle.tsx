'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface UnitCircleProps {
  label?: string
}

export function UnitCircle({ label }: UnitCircleProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [angle, setAngle] = useState(Math.PI / 4)

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 360
    const height = 360
    const margin = 40
    const radius = (width - margin * 2) / 2
    const cx = width / 2
    const cy = height / 2

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const g = svg.append('g')

    // Grid
    g.append('line').attr('x1', margin).attr('y1', cy).attr('x2', width - margin).attr('y2', cy)
      .attr('stroke', '#ddd').attr('stroke-width', 1)
    g.append('line').attr('x1', cx).attr('y1', margin).attr('x2', cx).attr('y2', height - margin)
      .attr('stroke', '#ddd').attr('stroke-width', 1)

    // Axis labels
    g.append('text').attr('x', width - margin + 5).attr('y', cy + 4).text('x').attr('fill', '#6B6B6B').attr('font-size', 12)
    g.append('text').attr('x', cx + 5).attr('y', margin - 5).text('y').attr('fill', '#6B6B6B').attr('font-size', 12)

    // Ticks
    for (const v of [-1, 1]) {
      g.append('text').attr('x', cx + v * radius).attr('y', cy + 16).text(String(v))
        .attr('fill', '#6B6B6B').attr('font-size', 10).attr('text-anchor', 'middle')
      g.append('text').attr('x', cx - 16).attr('y', cy - v * radius + 4).text(String(v))
        .attr('fill', '#6B6B6B').attr('font-size', 10).attr('text-anchor', 'middle')
    }

    // Circle
    g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', radius)
      .attr('fill', 'none').attr('stroke', '#ccc').attr('stroke-width', 1.5)

    // Point on circle
    const px = cx + Math.cos(angle) * radius
    const py = cy - Math.sin(angle) * radius

    // Radius line
    g.append('line').attr('x1', cx).attr('y1', cy).attr('x2', px).attr('y2', py)
      .attr('stroke', '#C85A2A').attr('stroke-width', 2)

    // Cos projection (horizontal)
    g.append('line').attr('x1', cx).attr('y1', cy).attr('x2', px).attr('y2', cy)
      .attr('stroke', '#2D8A4E').attr('stroke-width', 2).attr('stroke-dasharray', '4 2')
    // Sin projection (vertical)
    g.append('line').attr('x1', px).attr('y1', cy).attr('x2', px).attr('y2', py)
      .attr('stroke', '#3B82F6').attr('stroke-width', 2).attr('stroke-dasharray', '4 2')

    // Arc for angle
    const arcRadius = radius * 0.2
    const arcGen = d3.arc<unknown>()
      .innerRadius(0).outerRadius(arcRadius)
      .startAngle(0).endAngle(-angle)
    g.append('path')
      .attr('d', arcGen as unknown as string)
      .attr('transform', `translate(${cx},${cy}) rotate(90)`)
      .attr('fill', '#C85A2A').attr('fill-opacity', 0.15)
      .attr('stroke', '#C85A2A').attr('stroke-width', 1)

    // Point
    g.append('circle').attr('cx', px).attr('cy', py).attr('r', 6)
      .attr('fill', '#C85A2A').attr('cursor', 'grab')

    // Labels
    const cosVal = Math.cos(angle)
    const sinVal = Math.sin(angle)
    const deg = (angle * 180 / Math.PI) % 360

    g.append('text').attr('x', (cx + px) / 2).attr('y', cy - 6)
      .text(`cos = ${cosVal.toFixed(2)}`)
      .attr('fill', '#2D8A4E').attr('font-size', 11).attr('text-anchor', 'middle').attr('font-weight', 600)

    g.append('text').attr('x', px + 8).attr('y', (cy + py) / 2)
      .text(`sin = ${sinVal.toFixed(2)}`)
      .attr('fill', '#3B82F6').attr('font-size', 11).attr('font-weight', 600)

    g.append('text').attr('x', cx + arcRadius + 8).attr('y', cy - 4)
      .text(`${deg.toFixed(0)}°`)
      .attr('fill', '#C85A2A').attr('font-size', 11).attr('font-weight', 600)

  }, [angle])

  useEffect(() => { draw() }, [draw])

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgWidth = 360
    const scale = svgWidth / rect.width
    const mx = (e.clientX - rect.left) * scale - svgWidth / 2
    const my = -((e.clientY - rect.top) * scale - svgWidth / 2)
    setAngle(Math.atan2(my, mx))
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {label && <p className="text-sm font-medium text-secondary mb-3">{label}</p>}
      <svg
        ref={svgRef}
        className="w-full max-w-[360px] mx-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, currentTarget: e.currentTarget } as unknown as React.MouseEvent<SVGSVGElement>)
        }}
      />
      <div className="flex justify-center gap-6 mt-3 text-xs font-mono text-secondary">
        <span>θ = {(angle * 180 / Math.PI).toFixed(0)}°</span>
        <span className="text-[#2D8A4E]">cos θ = {Math.cos(angle).toFixed(3)}</span>
        <span className="text-[#3B82F6]">sin θ = {Math.sin(angle).toFixed(3)}</span>
      </div>
    </div>
  )
}
