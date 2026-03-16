export const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    annualPrice: 0,
    agentSeats: 1,
    stores: 1,
    aiResolutions: 25,
    channels: 2,
    features: [
      "1 Agent seat",
      "25 AI resolutions/mo",
      "Email + Live Chat",
      "Basic inbox",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: 49,
    annualPrice: 470,
    agentSeats: 2,
    stores: 1,
    aiResolutions: 500,
    channels: 2,
    features: [
      "1 Store",
      "2 Agent seats",
      "500 AI resolutions/mo",
      "Email + Live Chat",
      "Shopify integration",
      "Basic analytics",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: 99,
    annualPrice: 950,
    agentSeats: 5,
    stores: 3,
    aiResolutions: 2000,
    channels: 2,
    features: [
      "3 Stores",
      "5 Agent seats",
      "2,000 AI resolutions/mo",
      "Email + Live Chat",
      "All integrations",
      "Advanced analytics",
      "Macros & rules",
      "Knowledge base + RAG",
    ],
  },
  {
    key: "scale",
    name: "Scale",
    price: 199,
    annualPrice: 1910,
    agentSeats: 999,
    stores: 999,
    aiResolutions: 10000,
    channels: 2,
    features: [
      "Unlimited Stores",
      "Unlimited seats",
      "10,000 AI resolutions/mo",
      "Email + Live Chat",
      "Custom AI training",
      "Dedicated onboarding",
      "SLA guarantee",
    ],
  },
] as const;

export type PlanKey = (typeof PLANS)[number]["key"];

export function getPlanByKey(key: string) {
  return PLANS.find((p) => p.key === key) ?? PLANS[0];
}
