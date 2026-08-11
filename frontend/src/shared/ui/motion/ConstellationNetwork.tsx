import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

const NODE_COUNT = 34
const LINK_DISTANCE = 150
const PALETTES = {
  warm: ['255 138 101', '251 191 36', '244 114 182', '253 224 71'],
  cool: ['165 180 252', '103 232 249', '196 181 253', '147 197 253'],
} as const
const LINK_COLORS = { warm: '255 180 130', cool: '165 190 255' } as const

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * A slowly-drifting network of glowing nodes connected by fading lines — the
 * auth/onboarding hero background. Pure canvas + requestAnimationFrame, no external
 * charting/particle library. Freezes to a single static frame under reduced-motion.
 */
export function ConstellationNetwork({ className, tone = 'cool' }: { className?: string; tone?: 'warm' | 'cool' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colors = PALETTES[tone]
  const linkColor = LINK_COLORS[tone]
  const reducedMotion = usePrefersReducedMotion()
  const [size, setSize] = useState({ width: 800, height: 800 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const nodes = useMemo<Node[]>(() => {
    const rand = seededRandom(42)
    return Array.from({ length: NODE_COUNT }, () => ({
      x: rand() * size.width,
      y: rand() * size.height,
      vx: (rand() - 0.5) * 0.15,
      vy: (rand() - 0.5) * 0.15,
      r: 1.5 + rand() * 2.5,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }))
  }, [size.width, size.height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, size.width, size.height)

      if (!reducedMotion) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > size.width) n.vx *= -1
          if (n.y < 0 || n.y > size.height) n.vy *= -1
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!
          const b = nodes[j]!
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(${linkColor}, ${(1 - dist / LINK_DISTANCE) * 0.35})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      nodes.forEach((n, i) => {
        const color = colors[i % colors.length]
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, 0.9)`
        ctx.shadowColor = `rgba(${color}, 0.8)`
        ctx.shadowBlur = 8
        ctx.fill()
      })

      if (!reducedMotion) raf = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(raf)
  }, [nodes, size, reducedMotion, colors, linkColor])

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} aria-hidden />
    </div>
  )
}
