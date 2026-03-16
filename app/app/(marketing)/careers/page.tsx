"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, MapPin, Clock, Briefcase } from "lucide-react"

const ease = [0.23, 1, 0.32, 1]

const benefits = [
  {
    title: "Remote-first",
    description: "Work from anywhere in the world. We care about output, not office hours.",
  },
  {
    title: "Equity",
    description: "Meaningful ownership stake for all employees. We grow together.",
  },
  {
    title: "Health & Wellness",
    description: "Full medical, dental, and vision coverage for you and your dependents.",
  },
  {
    title: "Learning budget",
    description: "$2,000/year for courses, conferences, and books. Never stop growing.",
  },
  {
    title: "Flexible PTO",
    description: "Take the time you need, no tracking. We trust you to manage your schedule.",
  },
  {
    title: "Team retreats",
    description: "Bi-annual meetups in great locations. Build real relationships with your team.",
  },
]

const positions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Account Executive",
    department: "Sales",
    location: "New York or Remote",
    type: "Full-time",
  },
  {
    title: "Support Lead",
    department: "Customer Success",
    location: "Remote",
    type: "Full-time",
  },
]

export default function CareersPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <Briefcase className="h-4 w-4" />
            Careers
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Build the future of
            <br />
            <span className="text-h1-muted">customer support.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Join a small team making a big impact. We&apos;re building the
            support platform that e-commerce brands actually deserve — and we
            need people who care as much as we do.
          </motion.p>
        </div>
      </section>

      {/* Culture / Why Replyma */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Culture
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Why Replyma?
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="rounded-xl border border-border/60 bg-card p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"
                >
                  <span className="text-[15px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                </motion.div>
                <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.75] text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Join us
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Open positions
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5">
            {positions.map((position, i) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="rounded-xl border border-border/60 bg-card p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                      {position.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.08, ease }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        {position.department}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.18 + i * 0.08, ease }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {position.location}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.21 + i * 0.08, ease }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {position.type}
                      </motion.span>
                    </div>
                  </div>
                  <a href="mailto:careers@replyma.com" className="cursor-pointer group inline-flex w-full sm:w-auto h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                      Apply
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-xl text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Don&apos;t see a role?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="mt-4 text-[16px] leading-[1.7] text-muted-foreground"
            >
              We&apos;re always looking for talented people. Send us an email
              and tell us what you&apos;d bring to the team.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, ease }}
              className="mt-8"
            >
              <a href="mailto:careers@replyma.com" className="cursor-pointer group inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                  Send us an email
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
