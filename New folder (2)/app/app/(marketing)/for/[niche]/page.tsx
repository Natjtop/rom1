import type { Metadata } from "next";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { NicheLandingPage } from "@/types/pseo";
import { NicheLandingRenderer } from "@/components/pseo/niche-landing-renderer";

type Props = { params: Promise<{ niche: string }> };

export async function generateStaticParams() {
  const slugs = getGeneratedSlugs("niche-landing");
  return slugs.map((niche) => ({ niche }));
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche } = await params;
  const data = getGeneratedPage<NicheLandingPage>("niche-landing", niche);
  if (!data) return { title: "AI Customer Support" };
  const url = `${BASE}/for/${niche}`;
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

export default async function ForNichePage({ params }: Props) {
  const { niche } = await params;
  const data = getGeneratedPage<NicheLandingPage>("niche-landing", niche);
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <NicheLandingRenderer data={data} />
    </>
  );
}
