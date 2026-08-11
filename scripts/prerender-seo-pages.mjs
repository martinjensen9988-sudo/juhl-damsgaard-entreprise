import fs from 'node:fs';
import path from 'node:path';
import { serviceSeoPages, shortServicePaths } from '../src/data/serviceSeoPages.js';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const siteUrl = 'https://juhldamsgaard.dk';
const logoUrl = `${siteUrl}/assets/juhl-damsgaard-logo.jpeg`;

const baseHtml = fs.readFileSync(indexPath, 'utf8');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const serviceSchema = (page) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${siteUrl}/tjenester/${page.slug}#service`,
  name: page.heading,
  serviceType: page.shortName,
  description: page.metaDescription,
  provider: { '@id': `${siteUrl}/#localbusiness` },
  areaServed: page.areas,
  offers: {
    '@type': 'Offer',
    url: `${siteUrl}/tjenester/${page.slug}`,
    priceCurrency: 'DKK',
    availability: 'https://schema.org/InStock',
  },
});

const faqSchema = (page, canonicalPath) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${siteUrl}${canonicalPath}#faq`,
  mainEntity: page.faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
});

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'Juhl & Damsgaard Entreprise',
  url: `${siteUrl}/`,
  logo: {
    '@type': 'ImageObject',
    url: logoUrl,
  },
  email: 'hej@juhldamsgaard.dk',
  telephone: '+4540602086',
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${siteUrl}/#localbusiness`,
  name: 'Juhl & Damsgaard Entreprise',
  url: `${siteUrl}/`,
  image: logoUrl,
  logo: logoUrl,
  telephone: '+4540602086',
  email: 'hej@juhldamsgaard.dk',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karup',
    addressRegion: 'Midtjylland',
    addressCountry: 'DK',
  },
  areaServed: ['Fyn', 'Jylland', 'Odense', 'Kolding', 'Vejle', 'Aarhus', 'Middelfart', 'Fredericia'],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '17:00',
    },
  ],
  priceRange: '$$',
};

const renderStaticArticle = (page) => `
  <main class="seo-prerender">
    <article>
      <p>Juhl &amp; Damsgaard Entreprise</p>
      <h1>${escapeHtml(page.heading)}</h1>
      <p>${escapeHtml(page.lead)}</p>
      <p>Få tilbud på ${escapeHtml(page.shortName)} i Odense, Kolding, Vejle, Fredericia, Middelfart, på Fyn og i Jylland.</p>
      <img src="${escapeHtml(page.image.src)}" alt="${escapeHtml(page.image.alt)}" />
      ${page.sections.map((section) => `<section><h2>${escapeHtml(section.h)}</h2><p>${escapeHtml(section.p)}</p></section>`).join('\n')}
      <section>
        <h2>FAQ om ${escapeHtml(page.shortName)}</h2>
        ${page.faq.map((item) => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`).join('\n')}
      </section>
      <p><a href="/beregn-tilbud">Få tilbud</a></p>
    </article>
  </main>
`;

const replaceHead = (html, page, canonicalPath) => {
  const canonical = `${siteUrl}${canonicalPath}`;
  const jsonLd = [organizationSchema, localBusinessSchema, serviceSchema(page), faqSchema(page, canonicalPath)]
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');

  return html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.metaDescription)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.metaDescription)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${siteUrl}${page.image.src}" />`)
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, jsonLd)
    .replace('<div id="root"></div>', `<div id="root">${renderStaticArticle(page)}</div>`);
};

const writePage = (routePath, page) => {
  const dir = path.join(distDir, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), replaceHead(baseHtml, page, `/tjenester/${page.slug}`));
};

for (const page of Object.values(serviceSeoPages)) {
  writePage(path.join('tjenester', page.slug), page);
}

for (const slug of shortServicePaths) {
  writePage(slug, serviceSeoPages[slug]);
}

console.log(`Prerendered ${Object.keys(serviceSeoPages).length + shortServicePaths.length} SEO pages.`);
