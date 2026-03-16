"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

export default function PortalNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pt-20 sm:pt-40 pb-16 sm:pb-32">
      <div className="max-w-[1200px] mx-auto px-6 w-full">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
          >
            <motion.p
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="text-[80px] sm:text-[120px] font-semibold leading-none tracking-[-0.06em] text-muted-foreground/20 select-none md:text-[160px]"
            >
              <motion.span
                initial={{ opacity: 0, y: 30, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.1, duration: 0.7, ease }}
                className="inline-block"
              >
                4
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 14 }}
                className="inline-block"
              >
                0
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease }}
                className="inline-block"
              >
                4
              </motion.span>
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto mt-2 mb-6 h-px w-16 bg-border/60"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6, ease }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
          >
            Page not found
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.56, ease }}
            className="mx-auto mt-4 max-w-sm text-[16px] leading-[1.7] text-muted-foreground"
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62, ease }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90"
            >
              Go home
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/help-center"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 text-[14px] font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80"
            >
              Help Center
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
