import type { Metadata } from "next";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { ProblemGuide } from "@/types/pseo";
import { ProblemGuideRenderer } from "@/components/pseo/problem-guide-renderer";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = getGeneratedSlugs("problem-guide");
  return slugs.map((slug) => ({ slug }));
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getGeneratedPage<ProblemGuide>("problem-guide", slug);
  if (!data) return { title: "Guide" };
  const url = `${BASE}/guides/${slug}`;
  return {
    title: data.seo.title,
    description: data.seo.description,
    keywords: data.seo.keywords,
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: data.seo.title,
      description: data.seo.description,
    },
    alternates: { canonical: url },
  };
}

export default async function GuidePageRoute({ params }: Props) {
  const { slug } = await params;
  const data = getGeneratedPage<ProblemGuide>("problem-guide", slug);
  if (!data) {
    return (
      <section className="py-24 md:py-32 border-b border-border/40">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="text-muted-foreground">Page not found. Run pseo:generate to create content.</p>
        </div>
      </section>
    );
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.content.faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.seo.title,
    description: data.content.intro,
    step: data.content.ai_approach.steps.map((s) => ({
      "@type": "HowToStep",
      name: s.title,
      text: s.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <ProblemGuideRenderer data={data} />
    </>
  );
}
