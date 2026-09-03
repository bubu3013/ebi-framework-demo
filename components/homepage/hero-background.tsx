"use client"

import { useEffect, useRef } from "react"

export function HeroBackground() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orbWrapRef = useRef<HTMLDivElement>(null)
  const pupilLRef = useRef<HTMLDivElement>(null)
  const pupilRRef = useRef<HTMLDivElement>(null)
  const eyeLRef = useRef<HTMLDivElement>(null)
  const eyeRRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const canvas = canvasRef.current
    if (!scene || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 1)
    let logicalW = 0
    let logicalH = 0
    let rafId = 0

    function resize() {
      const r = canvas!.getBoundingClientRect()
      logicalW = r.width || canvas!.offsetWidth || 800
      logicalH = r.height || canvas!.offsetHeight || 520
      canvas!.width = Math.round(logicalW * DPR)
      canvas!.height = Math.round(logicalH * DPR)
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    const CHARSET = "0123456789ABCDEFGHS<>?%+-=:.".split("")
    function randChar() {
      return CHARSET[Math.floor(Math.random() * CHARSET.length)]
    }

    const BLUR_BUCKETS = [
      { scale: 0.14 },
      { scale: 0.22 },
      { scale: 0.38 },
      { scale: 0.65 },
      { scale: 1 },
    ]
    const BLUR_BUCKET_TMAX = [0.22, 0.42, 0.62, 0.82, 1.01]
    function bucketIndexForT(t: number) {
      for (let i = 0; i < BLUR_BUCKET_TMAX.length; i++) if (t <= BLUR_BUCKET_TMAX[i]) return i
      return BLUR_BUCKETS.length - 1
    }

    let bucketCanvases: HTMLCanvasElement[] = []
    let bucketCtxs: CanvasRenderingContext2D[] = []
    function rebuildBuckets() {
      bucketCanvases = BLUR_BUCKETS.map(() => document.createElement("canvas"))
      bucketCtxs = bucketCanvases.map(c => c.getContext("2d")!)
      BLUR_BUCKETS.forEach((b, i) => {
        bucketCanvases[i].width = Math.max(1, Math.round(canvas!.width * b.scale))
        bucketCanvases[i].height = Math.max(1, Math.round(canvas!.height * b.scale))
        bucketCtxs[i].setTransform(DPR * b.scale, 0, 0, DPR * b.scale, 0, 0)
      })
    }

    class ZoomChar {
      angle = 0
      radius = 0
      growth = 0
      maxRadius = 0
      char = ""
      changeTimer = 0
      bigBlob = false
      baseSize = 0
      baseAlpha = 0
      glitch = false

      constructor() {
        this.reset(true)
      }
      reset(init: boolean) {
        this.angle = Math.random() * Math.PI * 2
        const maxR = Math.hypot(logicalW, logicalH) * 0.58
        this.radius = init ? Math.random() * maxR : 4 + Math.random() * 10
        this.growth = 1 + (0.028 + Math.random() * 0.02) * 0.95
        this.maxRadius = maxR
        this.char = randChar()
        this.changeTimer = 8 + Math.random() * 18
        this.bigBlob = Math.random() < 0.1
        this.baseSize = (this.bigBlob ? 26 : 10) + Math.random() * (this.bigBlob ? 20 : 8)
        this.baseAlpha = this.bigBlob ? 0.55 : 0.7 + Math.random() * 0.3
        this.glitch = Math.random() < 0.16
      }
      update() {
        this.radius *= this.growth
        this.changeTimer--
        if (this.changeTimer <= 0) {
          this.char = randChar()
          this.changeTimer = 8 + Math.random() * 18
        }
        if (this.radius > this.maxRadius) this.reset(false)
      }
      draw(cx: number, cy: number) {
        const t = Math.min(1, this.radius / this.maxRadius)
        const size = this.baseSize * (0.4 + 1.8 * t)
        const alpha = this.baseAlpha * Math.min(1, t * 4) * (1 - Math.max(0, t - 0.85) * 6)
        if (alpha <= 0.01) return
        const x = cx + Math.cos(this.angle) * this.radius
        const y = cy + Math.sin(this.angle) * this.radius * 0.82
        const brightness = t > 0.55 ? "215,246,255" : t > 0.25 ? "110,185,245" : "70,120,190"
        const bc = bucketCtxs[bucketIndexForT(t)]
        bc.font = `bold ${Math.max(4, Math.round(size))}px 'Courier New'`
        bc.fillStyle = `rgba(${brightness},${alpha})`
        bc.fillText(this.char, x, y)
        if (this.glitch) {
          bc.fillStyle = `rgba(${brightness},${alpha * 0.35})`
          bc.fillText(this.char, x + 2, y + 2)
        }
      }
    }

    class RowString {
      y = 0
      x = -300
      speed = 0
      size = 0
      alpha = 0
      text = ""
      life = 0
      maxLife = 0

      constructor() {
        this.reset(true)
      }
      reset(init: boolean) {
        this.y = init ? Math.random() * logicalH : Math.random() * logicalH * 0.9
        this.x = -300
        this.speed = (0.25 + Math.random() * 0.5) * 5 * 0.95
        this.size = 12 + Math.random() * 6
        this.alpha = 0.28 + Math.random() * 0.22
        this.text = Array.from({ length: 14 + Math.floor(Math.random() * 16) }, () =>
          Math.random() < 0.15 ? " " : randChar()
        ).join("")
        this.life = 0
        this.maxLife = 900 + Math.random() * 600
      }
      update() {
        this.x += this.speed
        this.life++
        if (this.x > logicalW + 300 || this.life > this.maxLife) this.reset(false)
      }
      draw() {
        ctx!.font = `${this.size}px 'Courier New'`
        ctx!.fillStyle = `rgba(140,200,240,${this.alpha})`
        ctx!.fillText(this.text, this.x, this.y)
      }
    }

    let zoomChars: ZoomChar[] = []
    let rows: RowString[] = []

    function buildParticles() {
      zoomChars = Array.from({ length: 650 }, () => new ZoomChar())
      rows = Array.from({ length: 9 }, () => new RowString())
    }

    function frame() {
      ctx!.filter = "none"
      ctx!.fillStyle = "#000"
      ctx!.fillRect(0, 0, logicalW, logicalH)

      bucketCtxs.forEach((bc, i) => {
        bc.save()
        bc.setTransform(1, 0, 0, 1, 0, 0)
        bc.clearRect(0, 0, bucketCanvases[i].width, bucketCanvases[i].height)
        bc.restore()
      })

      const cx = logicalW / 2
      const cy = logicalH / 2

      rows.forEach(r => {
        r.update()
        r.draw()
      })
      zoomChars.forEach(z => {
        z.update()
        z.draw(cx, cy)
      })

      ctx!.save()
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      BLUR_BUCKETS.forEach((_, i) => {
        ctx!.drawImage(
          bucketCanvases[i],
          0,
          0,
          bucketCanvases[i].width,
          bucketCanvases[i].height,
          0,
          0,
          canvas!.width,
          canvas!.height
        )
      })
      ctx!.restore()
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)

      rafId = requestAnimationFrame(frame)
    }

    function handleResize() {
      resize()
      rebuildBuckets()
    }

    function start() {
      const r = canvas!.getBoundingClientRect()
      logicalW = r.width || canvas!.offsetWidth || 800
      logicalH = r.height || canvas!.offsetHeight || 520
      if (!logicalW || !logicalH) {
        rafId = requestAnimationFrame(start)
        return
      }
      resize()
      rebuildBuckets()
      buildParticles()
      frame()
    }

    window.addEventListener("resize", handleResize)
    start()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const orbWrap = orbWrapRef.current
    if (!orbWrap) return

    const particles: HTMLDivElement[] = []
    ;["#00d4ff", "#0088ff", "#44aaff", "#0066cc"].forEach((c, ci) => {
      for (let i = ci; i < 24; i += 4) {
        const p = document.createElement("div")
        p.className = "hero-orb-ring-particle"
        p.style.setProperty("--a", (i / 24) * 360 + "deg")
        p.style.setProperty("--r", 130 + Math.random() * 25 + "px")
        p.style.setProperty("--dur", 5 + Math.random() * 5 + "s")
        p.style.setProperty("--delay", Math.random() * 6 + "s")
        p.style.background = c
        p.style.boxShadow = `0 0 5px ${c}`
        orbWrap.appendChild(p)
        particles.push(p)
      }
    })

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    const pupilL = pupilLRef.current
    const pupilR = pupilRRef.current
    const eyeL = eyeLRef.current
    const eyeR = eyeRRef.current
    if (!scene || !pupilL || !pupilR || !eyeL || !eyeR) return

    const EYE_MAX = 7
    function trackEye(el: HTMLDivElement, pl: HTMLDivElement, mx: number, my: number) {
      const r = el.getBoundingClientRect()
      const dx = mx - (r.left + r.width / 2)
      const dy = my - (r.top + r.height / 2)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const t = Math.min(dist / 80, 1) * EYE_MAX
      const a = Math.atan2(dy, dx)
      pl.style.transform = `translate(calc(-50% + ${Math.cos(a) * t}px), calc(-50% + ${Math.sin(a) * t}px))`
    }

    function handleMove(e: MouseEvent) {
      trackEye(eyeL!, pupilL!, e.clientX, e.clientY)
      trackEye(eyeR!, pupilR!, e.clientX, e.clientY)
    }
    function handleLeave() {
      pupilL!.style.transform = "translate(-50%,-50%)"
      pupilR!.style.transform = "translate(-50%,-50%)"
    }

    scene.addEventListener("mousemove", handleMove)
    scene.addEventListener("mouseleave", handleLeave)
    return () => {
      scene.removeEventListener("mousemove", handleMove)
      scene.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div ref={sceneRef} className="hero-scene">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-glow-bg" />
      <div className="hero-orb-container" ref={orbWrapRef}>
        <div className="hero-ring" />
        <div className="hero-ring2" />
        <div className="hero-orb">
          <div className="hero-orb-depth" />
          <div className="hero-orb-spec" />
          <div className="hero-orb-scan" />
        </div>
        <div className="hero-eyes">
          <div className="hero-eye-wrap" ref={eyeLRef}>
            <div className="hero-pupil-group" ref={pupilLRef}>
              <div className="hero-pupil" />
            </div>
          </div>
          <div className="hero-eye-wrap" ref={eyeRRef}>
            <div className="hero-pupil-group" ref={pupilRRef}>
              <div className="hero-pupil" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-scene {
          position: absolute;
          inset: 0;
          background: #000;
          overflow: hidden;
        }
        .hero-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .hero-glow-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 340px;
          border-radius: 50%;
          z-index: 5;
          background: radial-gradient(circle, rgba(0, 80, 200, 0.28) 0%, rgba(0, 30, 120, 0.12) 50%, transparent 70%);
          filter: blur(32px);
          animation: hero-pulse-bg 4s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes hero-pulse-bg {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.18);
            opacity: 1;
          }
        }
        .hero-orb-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 220px;
          z-index: 10;
        }
        .hero-ring {
          position: absolute;
          inset: -22px;
          border-radius: 50%;
          border: 1px solid rgba(0, 200, 255, 0.28);
          animation: hero-ring-spin 12s linear infinite;
        }
        .hero-ring::before {
          content: "";
          position: absolute;
          top: -2px;
          left: 50%;
          width: 5px;
          height: 5px;
          background: #00cfff;
          border-radius: 50%;
          box-shadow: 0 0 10px 4px #00cfff;
          transform: translateX(-50%);
        }
        .hero-ring2 {
          position: absolute;
          inset: -38px;
          border-radius: 50%;
          border: 1px solid rgba(0, 100, 255, 0.16);
          animation: hero-ring-spin 22s linear infinite reverse;
        }
        .hero-ring2::before {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 28%;
          width: 3px;
          height: 3px;
          background: #0088ff;
          border-radius: 50%;
          box-shadow: 0 0 8px 3px #0088ff;
        }
        @keyframes hero-ring-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .hero-orb {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          animation: hero-breathe 5s ease-in-out infinite;
          box-shadow: 0 0 50px 12px rgba(0, 120, 255, 0.55), 0 0 110px 35px rgba(0, 50, 200, 0.32),
            inset 0 0 40px rgba(0, 0, 0, 0.5);
        }
        .hero-orb::before {
          content: "";
          position: absolute;
          inset: -60%;
          width: 220%;
          height: 220%;
          background: conic-gradient(
            from 0deg,
            #001a80,
            #0055ff,
            #00aaff,
            #0033cc,
            #0077ff,
            #00ccff,
            #0044dd,
            #001a80
          );
          animation: hero-spin 9s linear infinite;
        }
        .hero-orb-spec {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          z-index: 2;
          background: radial-gradient(circle at 30% 26%, rgba(255, 255, 255, 0.55) 0%, rgba(120, 200, 255, 0.18) 24%, transparent 58%);
        }
        .hero-orb-depth {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          z-index: 1;
          background: radial-gradient(circle at 58% 62%, rgba(0, 0, 40, 0.5) 0%, transparent 60%);
        }
        .hero-orb-scan {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          z-index: 3;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.08) 3px,
            rgba(0, 0, 0, 0.08) 4px
          );
        }
        @keyframes hero-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes hero-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .hero-eyes {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -55%);
          display: flex;
          gap: 17px;
          z-index: 20;
          pointer-events: none;
        }
        .hero-eye-wrap {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 55%, #04041a 60%, #080828 100%);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.88), 0 0 14px rgba(0, 150, 255, 0.55);
          position: relative;
          overflow: hidden;
          animation: hero-blink 7s ease-in-out infinite;
        }
        .hero-pupil-group {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 18px;
          height: 18px;
          transform: translate(-50%, -50%);
          transition: transform 0.07s ease-out;
        }
        .hero-pupil {
          width: 18px;
          height: 18px;
          background: #000;
          border-radius: 50%;
          position: relative;
        }
        .hero-pupil::before {
          content: "";
          position: absolute;
          top: 2px;
          left: 3px;
          width: 7px;
          height: 7px;
          background: white;
          border-radius: 50%;
          opacity: 0.95;
        }
        .hero-pupil::after {
          content: "";
          position: absolute;
          bottom: 3px;
          right: 3px;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
        }
        @keyframes hero-blink {
          0%,
          82%,
          100% {
            transform: scaleY(1);
          }
          90% {
            transform: scaleY(0.06);
          }
        }
        :global(.hero-orb-ring-particle) {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          opacity: 0;
          margin: -1px;
          animation: hero-orb-orbit var(--dur) linear infinite;
          animation-delay: var(--delay);
        }
        @keyframes hero-orb-orbit {
          0% {
            opacity: 0;
            transform: rotate(var(--a)) translateX(var(--r)) scale(1.5);
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
            transform: rotate(calc(var(--a) + 360deg)) translateX(var(--r)) scale(0.3);
          }
        }
      `}</style>
    </div>
  )
}
