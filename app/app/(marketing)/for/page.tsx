import Link from "next/link";
import { getGeneratedSlugs } from "@/lib/pseo-data";
import { NICHE_LIST } from "@/data/niches";
import { Card, CardContent } from "@/components/ui/card";
import { PseoContainer, PseoSection } from "@/components/pseo/pseo-layout";
import {
  Shirt,
  Sparkles,
  PawPrint,
  Home,
  Coffee,
  Dumbbell,
  Baby,
  BookOpen,
  Heart,
  Leaf,
  Wrench,
  Gem,
  Package,
  Gift,
  Car,
  UtensilsCrossed,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";

/** Map niche slug to Lucide icon for /for hub cards */
const NICHE_ICON_MAP: Record<string, LucideIcon> = {
  fashion: Shirt,
  apparel: Shirt,
  shoes: Shirt,
  accessories: Shirt,
  bags: Shirt,
  luggage: Shirt,
  jewelry: Gem,
  watches: Gem,
  "jewelry-watches": Gem,
  eyewear: Shirt,
  lingerie: Shirt,
  swimwear: Shirt,
  activewear: Shirt,
  menswear: Shirt,
  womenswear: Shirt,
  "plus-size-fashion": Shirt,
  maternity: Baby,
  streetwear: Shirt,
  loungewear: Shirt,
  workwear: Shirt,
  "formal-wear": Shirt,
  "winter-gear": Shirt,
  hats: Shirt,
  belts: Shirt,
  "minimalist-fashion": Shirt,
  shapewear: Shirt,
  socks: Shirt,
  beauty: Sparkles,
  skincare: Sparkles,
  cosmetics: Sparkles,
  haircare: Sparkles,
  nail: Sparkles,
  perfume: Sparkles,
  "men-grooming": Sparkles,
  "pet-supplies": PawPrint,
  "pet-food": PawPrint,
  dog: PawPrint,
  cat: PawPrint,
  "pet-toys": PawPrint,
  aquarium: PawPrint,
  bird: PawPrint,
  reptile: PawPrint,
  equestrian: PawPrint,
  electronics: Smartphone,
  gadgets: Smartphone,
  "smart-home": Smartphone,
  "home-decor": Home,
  furniture: Home,
  bedding: Home,
  kitchen: Home,
  cookware: Home,
  lighting: Home,
  rugs: Home,
  curtains: Home,
  mattress: Home,
  storage: Home,
  "food-beverage": UtensilsCrossed,
  coffee: Coffee,
  tea: Coffee,
  wine: UtensilsCrossed,
  "beverage-alcohol": UtensilsCrossed,
  "snack-food": UtensilsCrossed,
  chocolate: UtensilsCrossed,
  "organic-food": UtensilsCrossed,
  "meal-kits": UtensilsCrossed,
  gourmet: UtensilsCrossed,
  "baby-food": Baby,
  protein: Dumbbell,
  nutrition: Heart,
  cbd: Leaf,
  "vegan-food": UtensilsCrossed,
  sports: Dumbbell,
  fitness: Dumbbell,
  "outdoor-gear": Dumbbell,
  camping: Dumbbell,
  cycling: Dumbbell,
  yoga: Dumbbell,
  running: Dumbbell,
  fishing: Dumbbell,
  hunting: Dumbbell,
  tactical: Dumbbell,
  "baby-products": Baby,
  "baby-gear": Baby,
  "baby-care": Baby,
  "baby-blankets": Baby,
  "maternity-nursing": Baby,
  "kids-toys": Baby,
  "kids-apparel": Baby,
  "stem-toys": Baby,
  puzzles: Baby,
  "school-supplies": BookOpen,
  books: BookOpen,
  stationery: BookOpen,
  "office-supplies": BookOpen,
  "art-prints": BookOpen,
  photography: BookOpen,
  "art-supplies": BookOpen,
  "craft-supplies": BookOpen,
  sewing: BookOpen,
  "musical-instruments": BookOpen,
  "board-games": BookOpen,
  collectibles: Gem,
  gaming: BookOpen,
  hobby: BookOpen,
  supplements: Heart,
  vitamins: Heart,
  "health-wellness": Heart,
  "first-aid": Heart,
  "oral-care": Heart,
  hearing: Heart,
  "braces-support": Heart,
  ergonomics: Heart,
  "sexual-wellness": Heart,
  candles: Leaf,
  "home-fragrance": Leaf,
  plants: Leaf,
  gardening: Leaf,
  "automotive-accessories": Car,
  "tools-diy": Wrench,
  electrical: Wrench,
  paint: Wrench,
  flooring: Wrench,
  industrial: Wrench,
  "cleaning-products": Leaf,
  reusable: Leaf,
  "sustainable-eco": Leaf,
  "luxury-goods": Gem,
  vintage: Gem,
  resale: Gem,
  dropshipping: Package,
  "print-on-demand": Package,
  "digital-products": Package,
  subscriptions: Package,
  "subscription-boxes": Package,
  "b2b-wholesale": Package,
  "handmade-artisan": Gift,
  wedding: Gift,
  "party-supplies": Gift,
  halloween: Gift,
  christmas: Gift,
  "gift-boxes": Gift,
  "tobacco-alternatives": Package,
  "home-office": Home,
  wigs: Shirt,
  tanning: Sparkles,
  "skincare-devices": Sparkles,
  towels: Home,
};

function getNicheIcon(slug: string): LucideIcon {
  return NICHE_ICON_MAP[slug] ?? Store;
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "AI Customer Support by Industry — E-commerce Niches",
  description:
    "AI customer support and automation for fashion, beauty, supplements, pet supplies, and 150+ e-commerce niches. Automate 80% of tickets.",
  keywords: [
    "AI support by industry",
    "e-commerce niches",
    "fashion customer support",
    "DTC support automation",
    "niche helpdesk",
  ],
  openGraph: {
    title: "AI Customer Support by Industry — E-commerce Niches | Replyma",
    description:
      "AI customer support and automation for fashion, beauty, supplements, pet supplies, and 150+ e-commerce niches. Automate 80% of tickets.",
    type: "website" as const,
    url: `${BASE}/for`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI Customer Support by Industry — E-commerce Niches",
    description:
      "AI support for fashion, beauty, supplements, pet, and 150+ e-commerce niches. Automate 80% of tickets.",
  },
  alternates: { canonical: `${BASE}/for` },
};

export default function ForHubPage() {
  const slugs = getGeneratedSlugs("niche-landing");
  const niches = NICHE_LIST.filter((n) => slugs.includes(n.slug));

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              AI customer support for your industry
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              See how Replyma automates support for your niche — from fashion and beauty to pet supplies and B2B.
            </p>
          </div>
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
          {niches.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No niche pages yet. Run <code className="rounded bg-muted px-1.5 py-0.5 text-sm">npm run pseo:generate</code> to generate content.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {niches.map((n) => {
                const Icon = getNicheIcon(n.slug);
                return (
                  <Link key={n.slug} href={`/for/${n.slug}`} className="block">
                    <Card className="rounded-xl border-border/60 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md h-full">
                      <CardContent className="pt-5 pb-5 flex items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{n.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            Automate support for {n.context.audience.split(",")[0].toLowerCase()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </PseoContainer>
      </PseoSection>
    </>
  );
}
