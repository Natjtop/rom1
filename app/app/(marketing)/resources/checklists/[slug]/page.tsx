import type { Metadata } from "next";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { SupportChecklist } from "@/types/pseo";
import { ChecklistRenderer } from "@/components/pseo/checklist-renderer";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = getGeneratedSlugs("checklist");
  return slugs.map((slug) => ({ slug }));
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getGeneratedPage<SupportChecklist>("checklist", slug);
  if (!data) return { title: "Checklist" };
  const url = `${BASE}/resources/checklists/${slug}`;
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

export default async function ChecklistPageRoute({ params }: Props) {
  const { slug } = await params;
  const data = getGeneratedPage<SupportChecklist>("checklist", slug);
  if (!data) {
    return (
      <section className="py-24 md:py-32 border-b border-border/40">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="text-muted-foreground">Page not found. Run pseo:generate to create content.</p>
        </div>
      </section>
    );
  }

  return <ChecklistRenderer data={data} />;
}
