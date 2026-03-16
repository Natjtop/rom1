"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function PseoBreadcrumb({
  category,
  title,
}: {
  category: string;
  title: string;
}) {
  // Category display: human-friendly labels and correct hrefs
  const categoryLabel =
    category === "resources"
      ? "Resources"
      : category === "vs"
        ? "Compare"
        : category === "for"
          ? "By industry"
          : category === "guides"
            ? "Guides"
            : category === "alternatives"
              ? "Alternatives"
              : category === "integrations"
                ? "Integrations"
                : category;
  const categoryHref = category === "resources" ? "/resources" : `/${category}`;

  return (
    <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href={categoryHref} className="hover:text-foreground transition-colors">
            {categoryLabel}
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

export function PseoCtaButton({ ctaText }: { ctaText: string }) {
  return (
    <Link
      href="/register"
      className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-lg hover:shadow-foreground/10"
    >
      {ctaText}
    </Link>
  );
}

export function PseoHero({
  category,
  title,
  description,
  eyebrow,
  children,
}: {
  category: string;
  title: string;
  description: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <PseoSection gradient firstSection>
      <PseoContainer>
        <PseoBreadcrumb category={category} title={title} />
        <div className="mx-auto max-w-4xl text-center">
          {eyebrow ? (
            <div className="mb-6 inline-flex items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {description}
          </p>
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </PseoContainer>
    </PseoSection>
  );
}

/** Inner content width — matches marketing pages */
export function PseoContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[1200px] px-6", className)}>
      {children}
    </div>
  );
}

/** Full-width section wrapper with standard marketing padding. Use firstSection on the first section of a page so content clears the fixed header. */
export function PseoSection({
  children,
  className,
  gradient,
  firstSection,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  /** First section on page: adds pt-24 md:pt-32 so content clears the fixed marketing header */
  firstSection?: boolean;
}) {
  return (
    <section
      className={cn(
        "border-b border-border/40",
        firstSection ? "pt-24 md:pt-32 pb-16 md:pb-24" : "py-16 md:py-24",
        gradient && "bg-gradient-to-b from-background to-[var(--surface-sunken)]",
        className
      )}
    >
      {children}
    </section>
  );
}
