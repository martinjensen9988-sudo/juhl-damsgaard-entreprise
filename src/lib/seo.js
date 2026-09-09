import { useEffect } from 'react';
import { BRAND_EMAIL, BRAND_LOGO_FULL_URL, BRAND_NAME, BRAND_PHONE_LINK } from '@/lib/brand';
import { serviceAreas } from '@/lib/localAreas';

const SITE_URL = 'https://juhldamsgaard.dk';

const setMeta = (selector, attr, value) => {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const match = selector.match(/\[(name|property)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const setJsonLd = (id, data) => {
  if (!data) return;
  let el = document.head.querySelector(`script[data-seo-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND_NAME,
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: BRAND_LOGO_FULL_URL,
  },
  email: BRAND_EMAIL,
  telephone: BRAND_PHONE_LINK,
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#localbusiness`,
  name: BRAND_NAME,
  url: `${SITE_URL}/`,
  image: BRAND_LOGO_FULL_URL,
  logo: BRAND_LOGO_FULL_URL,
  telephone: BRAND_PHONE_LINK,
  email: BRAND_EMAIL,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karup',
    addressRegion: 'Midtjylland',
    addressCountry: 'DK',
  },
  areaServed: serviceAreas,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '17:00',
    },
  ],
  priceRange: '$$',
  description:
    'Dansk entreprenørvirksomhed med gravearbejde, kloak, beton, anlæg, tømrer, VVS, elektriker, skadeservice og totalentreprise på Fyn og i Jylland.',
};

export function useSeo({ title, description, canonicalPath, image = BRAND_LOGO_FULL_URL, schema = [] }) {
  useEffect(() => {
    const canonical = `${SITE_URL}${canonicalPath || window.location.pathname}`;
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', 'index, follow');
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:locale"]', 'content', 'da_DK');
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setCanonical(canonical);
    setJsonLd('organization', organizationSchema);
    setJsonLd('local-business', localBusinessSchema);
    schema.forEach((item, index) => setJsonLd(`page-${index}`, item));
  }, [title, description, canonicalPath, image, schema]);
}

export function serviceSchema(service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/tjenester/${service.slug}#service`,
    name: service.title,
    serviceType: service.title,
    description: service.metaDescription,
    provider: { '@id': `${SITE_URL}/#localbusiness` },
    areaServed: service.areas,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/tjenester/${service.slug}`,
      priceCurrency: 'DKK',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function faqSchema(items, pageId) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${pageId}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
