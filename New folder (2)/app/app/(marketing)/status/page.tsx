"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Clock } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const services = [
  { name: "API", status: "Operational" },
  { name: "Dashboard", status: "Operational" },
  { name: "AI Agent", status: "Operational" },
  { name: "Email Delivery", status: "Operational" },
  { name: "Webhooks", status: "Operational" },
]

const incidents = [
  {
    date: "Feb 28, 2026",
    title: "Elevated API latency",
    resolution: "Resolved in 23 minutes",
    severity: "Minor",
  },
  {
    date: "Feb 14, 2026",
    title: "Email delivery delays",
    resolution: "Resolved in 1 hour 12 minutes",
    severity: "Major",
  },
  {
    date: "Jan 30, 2026",
    title: "Dashboard intermittent errors",
    resolution: "Resolved in 8 minutes",
    severity: "Minor",
  },
]

function generateUptimeBars() {
  const bars: { height: number; color: "green" | "amber" }[] = []
  const amberIndices = new Set([23, 47, 71])
  for (let i = 0; i < 90; i++) {
    const isAmber = amberIndices.has(i)
    const height = isAmber
      ? 16 + Math.floor((i * 7) % 10)
      : 28 + Math.floor((i * 13 + 5) % 12)
    bars.push({
      height,
      color: isAmber ? "amber" : "green",
    })
  }
  return bars
}

const uptimeBars = generateUptimeBars()

function ServiceRow({ service, index }: { service: (typeof services)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      className={`flex items-center justify-between px-6 py-4 ${
        index < services.length - 1
          ? "border-b border-border/40"
          : ""
      }`}
    >
      <span className="text-[15px] font-medium text-foreground">
        {service.name}
      </span>
      <motion.span
        className="flex items-center gap-2 text-[14px] text-emerald-500"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: index * 0.07 + 0.15, type: "spring", stiffness: 300, damping: 18 }}
      >
        <motion.span
          className="h-2 w-2 rounded-full bg-emerald-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ delay: index * 0.07 + 0.2, type: "spring", stiffness: 300, damping: 12 }}
        />
        {service.status}
      </motion.span>
    </motion.div>
  )
}

function UptimeChart() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: 0.08, ease }}
      className="rounded-xl border border-border/60 bg-card p-6"
    >
      <div className="flex items-end gap-[3px]">
        {uptimeBars.map((bar, i) => (
          <motion.div
            key={i}
            className={`w-1.5 rounded-sm ${
              bar.color === "green"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${bar.height}px`, opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: i * 0.008,
              ease,
 }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <motion.span
          className="text-[12px] text-muted-foreground/60"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8, ease }}
        >
          90 days ago
        </motion.span>
        <motion.span
          className="text-[12px] text-muted-foreground/60"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8, ease }}
        >
          Today
        </motion.span>
      </div>
    </motion.div>
  )
}

function IncidentCard({ incident, index }: { incident: (typeof incidents)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="rounded-xl border border-border/60 bg-card p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <motion.span
          className="text-[13px] text-muted-foreground/60"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.08 + 0.1, ease }}
        >
          {incident.date}
        </motion.span>
        <motion.span
          className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
            incident.severity === "Major"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-muted text-muted-foreground"
          }`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 + 0.15, type: "spring", stiffness: 300, damping: 16 }}
        >
          {incident.severity}
        </motion.span>
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
        {incident.title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <motion.span
          className="flex items-center gap-1.5 text-[14px] text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.08 + 0.22, ease }}
        >
          <Clock className="h-3.5 w-3.5" />
          {incident.resolution}
        </motion.span>
        <motion.span
          className="flex items-center gap-1.5 text-[14px] text-emerald-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 + 0.28, type: "spring", stiffness: 300, damping: 16 }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved
        </motion.span>
      </div>
    </motion.div>
  )
}

export default function StatusPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            Status
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            System Status
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Real-time health and incident history for all Replyma services.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-10 flex items-center justify-center"
          >
            <motion.span
              className="inline-flex items-center gap-2.5 rounded-full bg-emerald-500/10 px-4 py-2 text-[15px] font-medium text-emerald-500"
              initial={{ }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.22, type: "spring", stiffness: 200, damping: 14 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.28, type: "spring", stiffness: 300, damping: 12 }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
              All systems operational
            </motion.span>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[800px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="rounded-xl border border-border/60 bg-card"
          >
            {services.map((service, i) => (
              <ServiceRow key={service.name} service={service} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Uptime history */}
      <section className="border-t border-border/40 py-24">
        <div className="mx-auto max-w-[800px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
            className="mb-8"
          >
            <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]">
              90-day uptime history
            </h2>
            <motion.p
              className="mt-3 text-[17px] leading-[1.7] text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
            >
              99.98% average uptime
            </motion.p>
          </motion.div>

          <UptimeChart />
        </div>
      </section>

      {/* Incident history */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[800px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
            className="mb-12"
          >
            <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]">
              Recent incidents
            </h2>
          </motion.div>

          <div className="flex flex-col gap-5">
            {incidents.map((incident, i) => (
              <IncidentCard key={incident.title} incident={incident} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
