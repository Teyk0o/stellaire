'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface OrbitSimulationProps {
  label?: string
  a?: string
  e?: string
}

export function OrbitSimulation({
  label,
  a: initA = '200',
  e: initE = '0.3',
}: OrbitSimulationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [semiMajor, setSemiMajor] = useState(parseFloat(initA))
  const [eccentricity, setEccentricity] = useState(parseFloat(initE))
  const animRef = useRef<number>(0)
  const thetaRef = useRef(0)

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 400
    const height = 400
    const cx = width / 2
    const cy = height / 2

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const g = svg.append('g')
    const ecc = Math.min(eccentricity, 0.95)
    const margin = 30

    // Compute orbit points in local coords (focus at origin)
    const rawPoints: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= 360; i++) {
      const rad = (i * Math.PI) / 180
      const r = (1 - ecc * ecc) / (1 + ecc * Math.cos(rad))
      rawPoints.push({ x: r * Math.cos(rad), y: r * Math.sin(rad) })
    }

    // Bounding box of orbit
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of rawPoints) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    // Scale to fit in viewBox with margin
    const orbitW = maxX - minX
    const orbitH = maxY - minY
    const scale = Math.min((width - margin * 2) / orbitW, (height - margin * 2) / orbitH)
    const offsetX = cx - ((minX + maxX) / 2) * scale
    const offsetY = cy + ((minY + maxY) / 2) * scale

    function toSvg(lx: number, ly: number): [number, number] {
      return [lx * scale + offsetX, -ly * scale + offsetY]
    }

    const svgPoints = rawPoints.map(p => toSvg(p.x, p.y))
    const [focusSvgX, focusSvgY] = toSvg(0, 0)

    // Background stars
    for (let i = 0; i < 40; i++) {
      g.append('circle')
        .attr('cx', Math.random() * width)
        .attr('cy', Math.random() * height)
        .attr('r', Math.random() * 1.2 + 0.3)
        .attr('fill', '#ddd')
    }

    // Orbit
    const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]).curve(d3.curveCardinalClosed)
    g.append('path')
      .datum(svgPoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#C85A2A')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)

    // Central body
    g.append('circle').attr('cx', focusSvgX).attr('cy', focusSvgY).attr('r', 14)
      .attr('fill', '#3B82F6')
    g.append('circle').attr('cx', focusSvgX).attr('cy', focusSvgY).attr('r', 18)
      .attr('fill', 'none').attr('stroke', '#3B82F6').attr('stroke-opacity', 0.2).attr('stroke-width', 2)

    // Semi-major axis line
    const periapsis = toSvg((1 - ecc), 0)
    g.append('line')
      .attr('x1', focusSvgX).attr('y1', focusSvgY)
      .attr('x2', periapsis[0]).attr('y2', periapsis[1])
      .attr('stroke', '#6B6B6B').attr('stroke-dasharray', '3 3').attr('stroke-width', 0.8)

    // Satellite
    const theta = thetaRef.current
    const r = (1 - ecc * ecc) / (1 + ecc * Math.cos(theta))
    const [satX, satY] = toSvg(r * Math.cos(theta), r * Math.sin(theta))

    g.append('circle').attr('cx', satX).attr('cy', satY).attr('r', 5)
      .attr('fill', '#C85A2A')
    g.append('circle').attr('cx', satX).attr('cy', satY).attr('r', 8)
      .attr('fill', 'none').attr('stroke', '#C85A2A').attr('stroke-opacity', 0.3)

    // Radius line
    g.append('line')
      .attr('x1', focusSvgX).attr('y1', focusSvgY).attr('x2', satX).attr('y2', satY)
      .attr('stroke', '#C85A2A').attr('stroke-width', 0.8).attr('stroke-dasharray', '2 2')

    // Label
    g.append('text').attr('x', (focusSvgX + periapsis[0]) / 2).attr('y', focusSvgY - 8)
      .text(`a = ${semiMajor.toFixed(0)}`)
      .attr('fill', '#6B6B6B').attr('font-size', 10).attr('text-anchor', 'middle')

  }, [semiMajor, eccentricity])

  useEffect(() => {
    let running = true
    function animate() {
      if (!running) return
      const ecc = Math.min(eccentricity, 0.95)
      const r = (1 - ecc * ecc) / (1 + ecc * Math.cos(thetaRef.current))
      const speed = 0.015 / (r * r)
      thetaRef.current += speed
      if (thetaRef.current > 2 * Math.PI) thetaRef.current -= 2 * Math.PI
      draw()
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [draw, eccentricity, semiMajor])

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {label && <p className="text-sm font-medium text-secondary mb-3">{label}</p>}

      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-secondary">Demi-grand axe</span>
          <input
            type="range" min="80" max="180" step="5" value={semiMajor}
            onChange={e => setSemiMajor(Number(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="font-mono text-xs w-8">{semiMajor.toFixed(0)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-secondary">Excentricité</span>
          <input
            type="range" min="0" max="0.9" step="0.05" value={eccentricity}
            onChange={e => setEccentricity(Number(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="font-mono text-xs w-8">{eccentricity.toFixed(2)}</span>
        </label>
      </div>

      <svg ref={svgRef} className="w-full max-w-[400px] mx-auto" />

      <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs font-mono text-secondary">
        <span>a = {semiMajor.toFixed(0)}</span>
        <span>e = {eccentricity.toFixed(2)}</span>
        <span>b = {(semiMajor * Math.sqrt(1 - eccentricity * eccentricity)).toFixed(0)}</span>
        <span>c = {(semiMajor * eccentricity).toFixed(0)}</span>
      </div>
    </div>
  )
}
