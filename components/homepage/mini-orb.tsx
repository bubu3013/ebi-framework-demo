"use client"

import { useMemo } from "react"

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

interface ShellConfig {
  size: number
  count: number
  color: [number, number, number]
  hotAngle: number
  baseAlpha: number
  seed: number
}

function makeGrainShadow(config: ShellConfig): string {
  const rand = seededRandom(config.seed)
  const { size, count, color, hotAngle, baseAlpha } = config
  const [r, g, b] = color
  const shadows: string[] = []
  const attempts = count * 3

  for (let i = 0; i < attempts && shadows.length < count; i++) {
    const theta = rand() * Math.PI * 2
    const radius = Math.sqrt(rand()) * (size / 2) * 1.3
    const angleDiff = Math.cos(theta - hotAngle)
    const weight = 0.3 + 0.7 * Math.pow((angleDiff + 1) / 2, 1.3)

    if (rand() > weight && rand() > 0.3) continue

    const dx = Math.cos(theta) * radius
    const dy = Math.sin(theta) * radius * 0.78
    const grainSize = 0.5 + weight * 1.1
    const alpha = baseAlpha * (0.35 + weight * 0.75)
    shadows.push(`${dx.toFixed(1)}px ${dy.toFixed(1)}px 0 ${grainSize.toFixed(1)}px rgba(${r},${g},${b},${alpha.toFixed(2)})`)
  }

  return shadows.join(", ")
}

export function MiniOrb({ phase = 0 }: { phase?: number }) {
  const outerShadow = useMemo(
    () =>
      makeGrainShadow({
        size: 96,
        count: 170,
        color: [195, 135, 60],
        hotAngle: 2.3,
        baseAlpha: 0.75,
        seed: 11 + phase * 97,
      }),
    [phase]
  )
  const midShadow = useMemo(
    () =>
      makeGrainShadow({
        size: 64,
        count: 110,
        color: [245, 195, 100],
        hotAngle: 2.3,
        baseAlpha: 0.9,
        seed: 23 + phase * 61,
      }),
    [phase]
  )
  const innerShadow = useMemo(
    () =>
      makeGrainShadow({
        size: 32,
        count: 60,
        color: [255, 245, 215],
        hotAngle: 2.3,
        baseAlpha: 1,
        seed: 37 + phase * 29,
      }),
    [phase]
  )

  return (
    <div className="black-hole-container" style={{ animationDelay: `${phase}s` }}>
      <div className="black-hole-glow" />
      <div
        className="black-hole-shell black-hole-shell-outer"
        style={{ animationDelay: `${phase * 0.5}s`, boxShadow: outerShadow }}
      />
      <div
        className="black-hole-shell black-hole-shell-mid"
        style={{ animationDelay: `${phase * 0.35}s`, boxShadow: midShadow }}
      />
      <div
        className="black-hole-shell black-hole-shell-inner"
        style={{ animationDelay: `${phase * 0.2}s`, boxShadow: innerShadow }}
      />
      <div className="black-hole-photon-ring" />
      <div className="black-hole-core" />

      <style jsx>{`
        .black-hole-container {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          animation: black-hole-breathe 5s ease-in-out infinite;
        }
        .black-hole-glow {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(180, 130, 40, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .black-hole-shell {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .black-hole-shell-outer {
          animation-name: black-hole-spin;
          animation-duration: 12s;
        }
        .black-hole-shell-mid {
          animation-name: black-hole-spin;
          animation-duration: 6s;
        }
        .black-hole-shell-inner {
          animation-name: black-hole-spin;
          animation-duration: 2.6s;
        }
        .black-hole-photon-ring {
          position: absolute;
          inset: 38%;
          border-radius: 50%;
          box-shadow: 0 -1px 6px 1px rgba(255, 240, 200, 0.55), 0 0 3px rgba(255, 240, 200, 0.4);
          pointer-events: none;
          z-index: 2;
        }
        .black-hole-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 42%;
          height: 42%;
          border-radius: 50%;
          background: radial-gradient(circle, #000 55%, rgba(0, 0, 0, 0.85) 75%, transparent 100%);
          box-shadow: 0 0 14px 6px rgba(0, 0, 0, 0.9);
          z-index: 3;
        }
        @keyframes black-hole-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes black-hole-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.92);
          }
        }
      `}</style>
    </div>
  )
}
