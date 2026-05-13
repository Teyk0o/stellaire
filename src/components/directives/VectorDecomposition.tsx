'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface VectorDecompositionProps {
  label?: string
  vx?: string
  vy?: string
}

export function VectorDecomposition({ label, vx: initVx = '3', vy: initVy = '4' }: VectorDecompositionProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [vx, setVx] = useState(parseFloat(initVx))
  const [vy, setVy] = useState(parseFloat(initVy))

  const magnitude = Math.sqrt(vx * vx + vy * vy)
  const angleDeg = Math.atan2(vy, vx) * 180 / Math.PI

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 400
    const height = 400
    const margin = 50
    const cx = width / 2
    const cy = height / 2
    const scale = (width - margin * 2) / 12

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const g = svg.append('g')

    // Grid
    for (let i = -6; i <= 6; i++) {
      g.append('line')
        .attr('x1', cx + i * scale).attr('y1', margin).attr('x2', cx + i * scale).attr('y2', height - margin)
        .attr('stroke', i === 0 ? '#bbb' : '#eee').attr('stroke-width', i === 0 ? 1.5 : 0.5)
      g.append('line')
        .attr('x1', margin).attr('y1', cy + i * scale).attr('x2', width - margin).attr('y2', cy + i * scale)
        .attr('stroke', i === 0 ? '#bbb' : '#eee').attr('stroke-width', i === 0 ? 1.5 : 0.5)
    }

    const arrowSize = 8

    function drawArrow(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
      const dx = x2 - x1
      const dy = y2 - y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) return
      const ux = dx / len
      const uy = dy / len

      g.append('line')
        .attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', color).attr('stroke-width', width)

      g.append('polygon')
        .attr('points', [
          [x2, y2],
          [x2 - ux * arrowSize + uy * arrowSize * 0.4, y2 - uy * arrowSize - ux * arrowSize * 0.4],
          [x2 - ux * arrowSize - uy * arrowSize * 0.4, y2 - uy * arrowSize + ux * arrowSize * 0.4],
        ].map(p => p.join(',')).join(' '))
        .attr('fill', color)
    }

    // Component vectors
    const endX = cx + vx * scale
    const endY = cy - vy * scale

    // Vx component
    drawArrow(cx, cy, endX, cy, '#2D8A4E', 2)
    // Vy component
    drawArrow(endX, cy, endX, endY, '#3B82F6', 2)
    // Resultant vector
    drawArrow(cx, cy, endX, endY, '#C85A2A', 3)

    // Dashed projections
    g.append('line').attr('x1', endX).attr('y1', endY).attr('x2', endX).attr('y2', cy)
      .attr('stroke', '#aaa').attr('stroke-dasharray', '3 3').attr('stroke-width', 0.5)

    // Labels
    g.append('text').attr('x', (cx + endX) / 2).attr('y', cy + 18)
      .text(`Vx = ${vx.toFixed(1)}`).attr('fill', '#2D8A4E').attr('font-size', 11).attr('text-anchor', 'middle').attr('font-weight', 600)
    g.append('text').attr('x', endX + 12).attr('y', (cy + endY) / 2 + 4)
      .text(`Vy = ${vy.toFixed(1)}`).attr('fill', '#3B82F6').attr('font-size', 11).attr('font-weight', 600)

    // Draggable point
    g.append('circle').attr('cx', endX).attr('cy', endY).attr('r', 7)
      .attr('fill', '#C85A2A').attr('cursor', 'grab')

  }, [vx, vy])

  useEffect(() => { draw() }, [draw])

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (e.buttons !== 1) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgW = 400
    const sc = svgW / rect.width
    const scale = (svgW - 100) / 12
    const mx = ((e.clientX - rect.left) * sc - svgW / 2) / scale
    const my = -((e.clientY - rect.top) * sc - svgW / 2) / scale
    setVx(Math.round(mx * 2) / 2)
    setVy(Math.round(my * 2) / 2)
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {label && <p className="text-sm font-medium text-secondary mb-3">{label}</p>}
      <svg
        ref={svgRef}
        className="w-full max-w-[400px] mx-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          handleMouseMove({
            clientX: touch.clientX, clientY: touch.clientY,
            buttons: 1, currentTarget: e.currentTarget,
          } as unknown as React.MouseEvent<SVGSVGElement>)
        }}
      />
      <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs font-mono text-secondary">
        <span className="text-[#C85A2A]">‖V‖ = {magnitude.toFixed(2)}</span>
        <span className="text-[#2D8A4E]">Vx = {vx.toFixed(1)}</span>
        <span className="text-[#3B82F6]">Vy = {vy.toFixed(1)}</span>
        <span>θ = {angleDeg.toFixed(0)}°</span>
      </div>
    </div>
  )
}
