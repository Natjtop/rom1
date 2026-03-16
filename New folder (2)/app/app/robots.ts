import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/invite",
          "/verify-email",
          "/onboarding",
          "/inbox/",
          "/customers/",
          "/analytics/",
          "/ai/",
          "/channels/",
          "/flows/",
          "/rules/",
          "/macros/",
          "/helpcenter/",
          "/team/",
          "/tags/",
          "/segments/",
          "/billing/",
          "/audit/",
          "/settings/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
