"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Star, Quote } from "lucide-react"
import { getInitials } from "@/lib/utils"

const testimonials = [
  {
    quote:
      "We were spending 3 hours a day just on 'where is my order' emails. That's gone now. Replyma handles all of it.",
    name: "Rachel Torres",
    role: "Head of CX",
    company: "Lumina Skincare",
    metric: "3 hrs saved daily",
    rating: 5,
  },
  {
    quote:
      "I was skeptical of AI for support — most of it is just fancy autocomplete. This one actually reads the Shopify order and gives a real answer.",
    name: "Marcus Chen",
    role: "Founder",
    company: "Steelridge Goods",
    metric: "4x faster replies",
    rating: 5,
  },
  {
    quote:
      "Black Friday was the first time our support didn't melt down. Volume went up 4x. We added zero headcount.",
    name: "Aisha Patel",
    role: "Operations Lead",
    company: "Freshleaf Co",
    metric: "4x volume, same team",
    rating: 5,
  },
  {
    quote:
      "We switched from Gorgias. The per-ticket pricing was killing us during sales. Flat rate means I don't get nervous every time we run a promotion.",
    name: "David Kim",
    role: "Support Manager",
    company: "Apex Athletics",
    metric: "$280/mo saved",
    rating: 5,
  },
  {
    quote:
      "The live chat cart-recovery trigger recovered $12K in two months. That alone pays for the tool 10x over.",
    name: "Sophie Williams",
    role: "CMO",
    company: "Thread & Needle",
    metric: "$12K recovered",
    rating: 5,
  },
  {
    quote:
      "Setup was 8 minutes. Upload your policy, connect Shopify, done. The AI started answering tickets immediately.",
    name: "Liam O'Brien",
    role: "CTO",
    company: "Verdant Labs",
    metric: "8-min setup",
    rating: 5,
  },
]

function AnimatedCounter({ target, suffix, inView }: { target: string; suffix: string; inView: boolean }) {
  const [val, setVal] = useState("0")
  const num = parseFloat(target)

  useEffect(() => {
    if (!inView || isNaN(num)) { setVal(target); return }
    let start = 0
    const duration = 1400
    const step = 20
    const inc = num / (duration / step)
    const timer = setInterval(() => {
      start += inc
      if (start >= num) {
        setVal(target)
        clearInterval(timer)
      } else {
        setVal(num % 1 !== 0 ? start.toFixed(1) : Math.floor(start).toString())
      }
    }, step)
    return () => clearInterval(timer)
  }, [inView, num, target])

  return <>{val}{suffix}</>
}

function StarRating({ rating, delay }: { rating: number; delay: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: delay + i * 0.06,
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              i < rating
                ? "fill-white text-white"
                : "fill-white/20 text-white/20"
            }`}
          />
        </motion.div>
      ))}
    </div>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
}

export function Testimonials() {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true })

  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32"
    >
      <div className="absolute inset-0 border-t border-white/10" />
      <div className="mx-auto max-w-[1200px] px-6 relative z-10">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 text-[13px] font-medium text-white/50 uppercase tracking-widest"
            >
              Testimonials
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 }}
              className="text-3xl font-medium tracking-tight text-white md:text-[2.5rem]"
            >
              Trusted by <em className="font-serif italic text-white/80">e-commerce</em> teams.
            </motion.h2>
          </div>
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-6"
          >
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-white">
                <AnimatedCounter target="4.9" suffix="/5" inView={statsInView} />
              </p>
              <p className="text-[12px] text-white/60">avg CSAT</p>
            </div>
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="h-8 w-px bg-white/20"
            />
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-white">
                <AnimatedCounter target="2" suffix="M+" inView={statsInView} />
              </p>
              <p className="text-[12px] text-white/60">
                tickets resolved
              </p>
            </div>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="group flex flex-col rounded-2xl liquid-glass p-6 transition-all duration-300 hover:scale-[1.02] border-white/10"
            >
              {/* Quotation mark + metric badge */}
              <div className="mb-4 flex items-start justify-between">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.4 }}
                >
                  <Quote className="h-8 w-8 text-white/20 transition-colors duration-300 group-hover:text-white/40" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0.8 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.2, type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[12px] font-medium text-white/80"
                >
                  {t.metric}
                </motion.p>
              </div>

              {/* Star rating */}
              <div className="mb-3">
                <StarRating rating={t.rating} delay={i * 0.08 + 0.15} />
              </div>

              {/* Quote text */}
              <p className="flex-1 text-[14px] leading-[1.75] text-white font-light">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.3, type: "spring", stiffness: 300, damping: 15 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/60 ring-1 ring-white/10"
                >
                  {getInitials(t.name)}
                </motion.div>
                <div>
                  <p className="text-[13px] font-medium text-white">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-white/60 font-light">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
