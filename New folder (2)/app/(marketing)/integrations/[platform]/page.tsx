import type { Metadata } from "next";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { IntegrationPage } from "@/types/pseo";
import { IntegrationPageRenderer } from "@/components/pseo/integration-page-renderer";

type Props = { params: Promise<{ platform: string }> };

export async function generateStaticParams() {
  const slugs = getGeneratedSlugs("integration");
  return slugs.map((platform) => ({ platform }));
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform } = await params;
  const data = getGeneratedPage<IntegrationPage>("integration", platform);
  if (!data) return { title: "Integration" };
  const url = `${BASE}/integrations/${platform}`;
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

export default async function IntegrationPageRoute({ params }: Props) {
  const { platform } = await params;
  const data = getGeneratedPage<IntegrationPage>("integration", platform);
  if (!data) {
    return (
      <div className="container py-12 text-center">
        <p>Page not found. Run pseo:generate to create content.</p>
      </div>
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
      <IntegrationPageRenderer data={data} />
    </>
  );
}
