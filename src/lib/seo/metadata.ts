import { SITE } from "@/features/marketing/constants";

export function buildPageMetadata({
  title,
  description,
  path = "",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const url = `${SITE.url}${path}`;
  return {
    title: `${title} | ${SITE.name}`,
    description,
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      locale: "en_IN",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | ${SITE.name}`,
      description,
    },
    alternates: { canonical: url },
  };
}

export function organizationJsonLd() {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address,
      addressCountry: "IN",
    },
    logo: `${SITE.url}/brand/icon-512.png`,
    sameAs: [],
  };
  if (SITE.founded) {
    jsonLd.foundingDate = SITE.founded;
  }
  return jsonLd;
}
