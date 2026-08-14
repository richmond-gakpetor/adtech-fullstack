"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useReducedMotion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin, Users, Shield, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "150+", label: "Active Billboards" },
  { value: "50+", label: "Verified Owners" },
  { value: "200+", label: "Campaigns Launched" },
]

const MARQUEE_ROW_1 = [
  { src: "/placeholder.svg", alt: "Billboard in Accra" },
  { src: "/placeholder1.svg", alt: "Highway billboard" },
  { src: "/placeholder2.png", alt: "Digital billboard" },
  { src: "/placeholder1.svg", alt: "City center billboard" },
  { src: "/placeholder.svg", alt: "Premium location" },
]

const MARQUEE_ROW_2 = [
  { src: "/placeholder2.png", alt: "Shopping area billboard" },
  { src: "/placeholder1.svg", alt: "Roadside billboard" },
  { src: "/placeholder.svg", alt: "Transit billboard" },
  { src: "/placeholder2.png", alt: "Stadium billboard" },
  { src: "/placeholder1.svg", alt: "Airport billboard" },
]

const OWNER_STEPS = [
  { n: "01", title: "List Your Billboard", body: "Upload photos, set your price, and add availability with our intuitive dashboard." },
  { n: "02", title: "Connect with Advertisers", body: "Share your contact details and connect directly with interested advertisers." },
  { n: "03", title: "Negotiate & Earn", body: "Finalize terms directly and start earning from your space." },
]

const ADVERTISER_STEPS = [
  { n: "01", title: "Browse Listings", body: "Explore billboards by location, size, price, and availability across Ghana." },
  { n: "02", title: "Contact & Negotiate", body: "Access owner contact details and discuss your campaign needs directly." },
  { n: "03", title: "Finalize & Launch", body: "Agree on terms, handle payment, and launch your campaign." },
]

const FEATURES = [
  { icon: MapPin, title: "Prime Locations", description: "Billboards in high-traffic areas across Accra and major cities in Ghana." },
  { icon: Shield, title: "Easy Listing", description: "List your billboard in minutes with photos, pricing, and availability." },
  { icon: Users, title: "Verified Users", description: "All owners and advertisers are verified for your safety and trust." },
  { icon: Zap, title: "Direct Contact", description: "Connect directly with owners and advertisers — no middleman." },
]

const TESTIMONIALS = [
  {
    name: "Selase K.",
    role: "Billboard Owner, Accra",
    quote: "My revenue has increased by 40% since joining. Easy to use and I get quality inquiries every week.",
    initials: "SK",
  },
  {
    name: "Ama O.",
    role: "Marketing Manager, TechCorp",
    quote: "Found the perfect billboard for our campaign in just 2 days. Smooth, transparent, and professional.",
    initials: "AO",
  },
  {
    name: "Adelaide A.",
    role: "Small Business Owner",
    quote: "Access to premium billboard locations I couldn't find anywhere else. A genuine game changer.",
    initials: "AA",
  },
]

// ─── CyclingWord ─────────────────────────────────────────────────────────────

const CYCLING_WORDS = ["Accra", "Kumasi", "Takoradi", "Tema", "Cape Coast", "Ho", "Ghana"]

function CyclingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % CYCLING_WORDS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <motion.span
        key={index}
        className="inline-block text-green-400"
        initial={{ y: "60%", opacity: 0 }}
        animate={visible ? { y: "0%", opacity: 1 } : { y: "-60%", opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {CYCLING_WORDS[index]}
      </motion.span>
    </span>
  )
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

// ─── MarqueeRow ───────────────────────────────────────────────────────────────

function MarqueeRow({
  images,
  reverse = false,
}: {
  images: { src: string; alt: string }[]
  reverse?: boolean
}) {
  const doubled = [...images, ...images]
  return (
    <div className="relative flex overflow-hidden group">
      <div
        className={`flex gap-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"
          } group-hover:[animation-play-state:paused]`}
      >
        {doubled.map((img, i) => (
          <div key={i} className="relative flex-none w-72 h-44 rounded-xl overflow-hidden">
            <Image src={img.src} alt={img.alt} fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HomeClient ───────────────────────────────────────────────────────────────

export function HomeClient() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const prefersReducedMotion = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const parallaxEnabled = isDesktop && !prefersReducedMotion
  const bgY = useTransform(scrollYProgress, [0, 1], parallaxEnabled ? ["0%", "28%"] : ["0%", "0%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header showBrowse />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[640px] flex items-center overflow-hidden">
        {/* Parallax background image */}
        <motion.div
          className="absolute inset-0 scale-110 will-change-transform"
          style={{ y: bgY }}
        >
          <Image
            src="https://images.unsplash.com/photo-1533069027836-fa937181a8ce?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Billboard advertising in Ghana"
            fill
            priority
            className="object-cover blur-sm brightness-75"
          />
          <div className="absolute inset-0 bg-black/58" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          className="relative z-10 container mx-auto px-6"
          style={{ opacity: contentOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 bg-white/8 border border-white/15 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-white/80 text-sm font-medium tracking-wide">Ghana's #1 Outdoor Advertising Marketplace</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-white leading-[1.04] mb-6 max-w-5xl tracking-tight">
              Reach{" "}<CyclingWord />
              <span className="block text-white/90">Your audience is out there.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
              Xposure GH connects brands with high-impact advertising spaces across Ghana. Discover where your next campaign lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/list-billboard">
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-6 text-base rounded-xl transition-colors duration-200"
                >
                  List Your Billboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/browse">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white hover:border-white/70 font-semibold px-8 py-6 text-base rounded-xl backdrop-blur-sm transition-all duration-200"
                >
                  Browse Billboards
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats -- Hidden for now */}
          <motion.div
            className="mt-20 flex-col sm:flex-row gap-10 sm:gap-16 hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-white/50 text-sm mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-white/25 flex items-start justify-center pt-2"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-1 h-2 bg-white/60 rounded-full"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Billboard Showcase Marquee ────────────────────────────────────── */}
      <section className="py-16 bg-neutral-950 overflow-hidden">
        <FadeUp className="container mx-auto px-6 mb-10">
          <p className="text-neutral-500 text-xs uppercase tracking-widest font-medium">
            Available across Ghana
          </p>
          <h2 className="text-2xl font-bold text-white mt-2">Explore the Inventory</h2>
        </FadeUp>
        <div className="space-y-4">
          <MarqueeRow images={MARQUEE_ROW_1} />
          <MarqueeRow images={MARQUEE_ROW_2} reverse />
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-neutral-950 border-t border-white/5">
        <div className="container mx-auto px-6">
          <FadeUp className="mb-16 max-w-xl">
            <p className="text-green-400 text-xs uppercase tracking-widest font-medium">The Process</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 leading-tight">
              How Xposure GH Works
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Owners */}
            <div>
              <FadeUp>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-10">
                  For Billboard Owners
                </p>
              </FadeUp>
              <div className="space-y-10">
                {OWNER_STEPS.map((step, i) => (
                  <FadeUp key={step.n} delay={i * 0.1}>
                    <div className="flex gap-6 items-start">
                      <span className="text-4xl font-bold text-green-400/50 leading-none shrink-0 tabular-nums w-12 text-right">
                        {step.n}
                      </span>
                      <div>
                        <h4 className="text-white font-semibold text-lg mb-1.5">{step.title}</h4>
                        <p className="text-neutral-400 leading-relaxed text-sm">{step.body}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>

            {/* Advertisers */}
            <div>
              <FadeUp>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-10">
                  For Advertisers
                </p>
              </FadeUp>
              <div className="space-y-10">
                {ADVERTISER_STEPS.map((step, i) => (
                  <FadeUp key={step.n} delay={i * 0.1}>
                    <div className="flex gap-6 items-start">
                      <span className="text-4xl font-bold text-sky-400/50 leading-none shrink-0 tabular-nums w-12 text-right">
                        {step.n}
                      </span>
                      <div>
                        <h4 className="text-white font-semibold text-lg mb-1.5">{step.title}</h4>
                        <p className="text-neutral-400 leading-relaxed text-sm">{step.body}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <FadeUp className="mb-16 max-w-2xl">
            <p className="text-green-600 text-xs uppercase tracking-widest font-medium">Why Xposure GH</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 leading-tight">
              Everything you need to advertise with confidence
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
            {FEATURES.map((feat, i) => (
              <FadeUp key={feat.title} delay={i * 0.08}>
                <div className="group">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-500 transition-colors duration-300">
                    <feat.icon className="h-5 w-5 text-green-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{feat.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feat.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-neutral-950">
        <div className="container mx-auto px-6">
          <FadeUp className="mb-16">
            <p className="text-green-400 text-xs uppercase tracking-widest font-medium">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">
              Trusted by owners &amp; advertisers
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.1}>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/8 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-neutral-300 leading-relaxed flex-1 mb-8 text-[0.95rem]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-500/20 text-green-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-neutral-500 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-36 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1630386226447-af0a955c1009?q=80&w=2024&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Advertising billboard"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 container mx-auto px-6 text-center">
          <FadeUp>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="text-white/65 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Join Ghana's fastest-growing billboard marketplace. List your space or find the perfect spot for your next campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?type=owner">
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-400 text-white font-semibold px-10 py-6 text-base rounded-xl transition-colors duration-200"
                >
                  List Your Billboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/browse">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white hover:border-white/70 font-semibold px-8 py-6 text-base rounded-xl backdrop-blur-sm transition-all duration-200"
                >
                  Browse Billboards
                </Button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  )
}
