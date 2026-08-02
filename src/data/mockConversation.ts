import type { Message } from '@/types/chat'

export const mockConversation: Message[] = [
  {
    id: 'msg-user-1',
    role: 'user',
    content: 'Hey Flippy!\nWrite me a script for building an Analog Clock.',
    createdAt: '2026-08-02T09:12:00Z',
  },
  {
    id: 'msg-assistant-1',
    role: 'assistant',
    content: `Hey! Great choice — an analog clock is a perfect little project to practice \`requestAnimationFrame\` and drawing with \`CanvasRenderingContext2D\`.

Here is a complete, self-contained script. It draws the clock face, marks the hour ticks, and animates the hands in sync with the system time.

\`\`\`tsx
import { useEffect, useRef, useState } from 'react'

const TAU = Math.PI * 2

function polarToCartesian(radius: number, angle: number) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

function drawClock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: Date,
) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 12

  ctx.clearRect(0, 0, width, height)

  // Clock face
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 3
  ctx.stroke()

  // Hour ticks
  for (let hour = 0; hour < 12; hour += 1) {
    const major = hour % 3 === 0
    const angle = (hour / 12) * TAU
    const outer = polarToCartesian(radius - 8, angle)
    const inner = polarToCartesian(radius - (major ? 20 : 14), angle)

    ctx.beginPath()
    ctx.moveTo(centerX + inner.x, centerY + inner.y)
    ctx.lineTo(centerX + outer.x, centerY + outer.y)
    ctx.strokeStyle = major ? '#111827' : '#6b7280'
    ctx.lineWidth = major ? 3 : 1
    ctx.stroke()
  }

  // Hands
  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds() + time.getMilliseconds() / 1000

  drawHand(ctx, centerX, centerY, hours / 12 + minutes / 720, radius * 0.5, 5, '#111827')
  drawHand(ctx, centerX, centerY, minutes / 60 + seconds / 3600, radius * 0.72, 3, '#374151')
  drawHand(ctx, centerX, centerY, seconds / 60, radius * 0.82, 1, '#ef4444')

  // Center dot
  ctx.beginPath()
  ctx.arc(centerX, centerY, 4, 0, TAU)
  ctx.fillStyle = '#ef4444'
  ctx.fill()
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fraction: number,
  length: number,
  width: number,
  color: string,
) {
  const point = polarToCartesian(length, fraction * TAU - Math.PI / 2)

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + point.x, y + point.y)
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

export default function AnalogClock() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 320
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    let frame: number
    const tick = () => {
      setTime(new Date())
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawClock(ctx, canvas.width, canvas.height, time)
  }, [time])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 320, height: 320 }}
      role="img"
      aria-label="Analog clock showing the current time"
    />
  )
}
\`\`\`

Drop that into your \`src/\` folder and render \`<AnalogClock />\` wherever you like — it will keep itself in sync with the system clock and adapt to high-DPI screens automatically.`,
    createdAt: '2026-08-02T09:12:04Z',
  },
]
