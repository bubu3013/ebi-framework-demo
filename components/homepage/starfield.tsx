"use client"

import { useMemo } from "react"

interface Star {
  top: number
  left: number
  size: number
  delay: number
  duration: number
}

function makeStars(count: number, seed: number): Star[] {
  let s = seed
  function rand() {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: count }, () => ({
    top: rand() * 100,
    left: rand() * 100,
    size: 1 + rand() * 1.6,
    delay: rand() * 6,
    duration: 3 + rand() * 4,
  }))
}

export function Starfield() {
  const stars = useMemo(() => makeStars(420, 42), [])

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="starfield-dot"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      <style jsx>{`
        .starfield {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .starfield-dot {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          opacity: 0.15;
          animation-name: starfield-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes starfield-twinkle {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}
