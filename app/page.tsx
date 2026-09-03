"use client"

import Link from "next/link"
import { Mail, Github, Linkedin, Instagram, ChevronsDown } from "lucide-react"
import { HeroBackground } from "@/components/homepage/hero-background"
import { MiniOrb } from "@/components/homepage/mini-orb"
import { Starfield } from "@/components/homepage/starfield"

const TRY_CARDS = [
  { slug: "election-jp", title: "Japan 2026 election" },
  { slug: "kickstarter-technology", title: "Kickstarter technology" },
]

export default function LandingPage() {
  return (
    <div className="bg-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-8 py-8 flex items-center justify-between">
          <span className="text-white font-bold tracking-[0.04em] text-sm">EBI</span>
          <div className="flex items-center gap-10 text-white/85 text-xs font-medium tracking-[0.12em]">
            <a href="#about" className="hover:text-white transition-colors">ABOUT</a>
            <a href="#try-your-ebi" className="hover:text-white transition-colors">TRY YOUR EBI</a>
            <a href="#contact" className="hover:text-white transition-colors">CONTACT</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen w-full">
        <HeroBackground />
        <div className="absolute top-28 left-0 right-0 z-10 flex flex-col items-center text-center px-6">
          <span className="inline-block text-[11px] tracking-[0.08em] text-[#4fd1ff] bg-[#4fd1ff]/10 border border-[#4fd1ff]/30 rounded-full px-3 py-1 mb-6">
            EBI FRAMEWORK · EMNLP 2026
          </span>
          <h1 className="text-[42px] sm:text-[64px] font-bold uppercase leading-[1.05] tracking-[-0.01em] text-white">
            Predicting Collective Behavior
          </h1>
        </div>
        <div className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center text-center px-6">
          <p className="max-w-xl text-sm sm:text-base text-white/70 leading-relaxed mb-8">
            We use LLMs to predict how crowds respond — across elections and crowdfunding markets.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="#try-your-ebi"
              className="bg-[#0071e3] hover:bg-[#0077ed] transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-full"
            >
              Explore the Demo →
            </a>
          </div>
        </div>
        <a
          href="#about"
          aria-label="Scroll to About"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:border-white transition-colors"
        >
          <ChevronsDown className="h-5 w-5" />
        </a>
      </section>

      {/* About */}
      <section id="about" className="bg-[#080808] py-24">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <p className="text-xl sm:text-2xl leading-relaxed text-white/85">
            <span className="font-semibold text-white">EBI</span> — an{" "}
            <span className="text-[#4fd1ff]">Exogenous</span>–
            <span className="text-[#4fd1ff]">Behavioral</span>–
            <span className="text-[#4fd1ff]">Inference</span> framework that predicts
            collective behavior without relying on abundant history-side data.
          </p>
        </div>
      </section>

      {/* Try your EBI */}
      <section id="try-your-ebi" className="relative bg-black py-24 overflow-hidden">
        <Starfield />
        <div className="relative container mx-auto px-6">
          <h2 className="text-center text-white text-2xl sm:text-3xl font-bold mb-3">
            Try your EBI
          </h2>
          <p className="text-center text-white/40 text-xs mb-16">
            The Taiwan Health Supplements domain studied in the paper is confidential and not included in this demo.
          </p>
          <div className="flex flex-wrap justify-center gap-x-20 gap-y-12 max-w-4xl mx-auto">
            {TRY_CARDS.map((card, i) => (
              <Link
                key={card.slug}
                href={`/domain/${card.slug}`}
                className="group flex flex-col items-center gap-5 w-48"
              >
                <div className="relative">
                  <MiniOrb phase={i * 1.3} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium bg-black/50 rounded-full px-3 py-1">
                      Try it →
                    </span>
                  </div>
                </div>
                <p className="text-white/80 text-sm text-center group-hover:text-white transition-colors">
                  {card.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-[#080808] py-24">
        <div className="container mx-auto px-6 max-w-md">
          <h2 className="text-center text-white text-2xl sm:text-3xl font-bold mb-12">
            Contact
          </h2>
          <div className="flex flex-col gap-5 text-white/75 text-sm">
            <a href="mailto:bubu3013@as.edu.tw" className="flex items-center gap-3 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
              bubu3013@as.edu.tw
            </a>
            <a
              href="https://github.com/bubu3013/ebi-framework-demo"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              ebi-framework-demo
            </a>
            <a
              href="https://www.linkedin.com/in/yu-shan-yen-0b4b2a2b7/?locale=zh"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              Yu-Shan Yen
            </a>
            <a
              href="https://instagram.com/rreal_silvia"
              className="flex items-center gap-3 hover:text-white transition-colors"
            >
              <Instagram className="h-4 w-4" />
              @rreal_silvia
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-8">
        <p className="text-center text-xs text-white/40">
          © 2026 Academia Sinica · MIT License
        </p>
      </footer>
    </div>
  )
}
