'use strict';

/*
 * JSON-LD: one @graph per page with stable @ids. Organization, WebSite and the
 * founder's Person are included on every page; the page nodes reference them.
 */

const { SITE, SITE_NAME, CONTACT, OG_IMAGES, loadSiteConfig, loadTranslations, abs } = require('./site');
const { jpegSize } = require('./images');
const path = require('path');
const { ROOT } = require('./site');

const ID = {
  org: `${SITE}/#organization`,
  website: `${SITE}/#website`,
  person: `${SITE}/o-nas/#jana-kralusova`,
};
const ref = (id) => ({ '@id': id });

const ORG_DESC = {
  sk: 'Advokátska kancelária v Bratislave poskytujúca právne poradenstvo. Zameranie na vysporiadanie pozemkov, právo nehnuteľností, zmluvnú agendu, občianske a obchodné právo.',
  en: 'Law firm in Bratislava providing legal advice. Focus on land ownership settlement, real estate law, contracts, civil and corporate law.',
};

// The six practice areas, same source as the services cards (translation keys services.area.<id>.title/.desc).
const SERVICE_AREAS = ['vysporiadanie-pozemkov', 'nehnutelnosti-a-development', 'zmluvna-agenda', 'obcianske-pravo', 'obchodne-pravo', 'riesenie-sporov'];

function orgNode(lang) {
  const T = loadTranslations();
  const cfg = loadSiteConfig();
  const og = OG_IMAGES.sk;
  const node = {
    '@type': ['LegalService', 'Organization'],
    '@id': ID.org,
    name: SITE_NAME,
    legalName: 'Noveris Legal s. r. o.',
    url: SITE + '/',
    description: ORG_DESC[lang],
    logo: { '@type': 'ImageObject', '@id': `${SITE}/#logo`, url: `${SITE}/assets/logo.svg`, contentUrl: `${SITE}/assets/logo.svg`, caption: SITE_NAME },
    image: abs(og.path),
    telephone: CONTACT.phoneHref.replace('tel:', ''),
    email: CONTACT.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.street,
      postalCode: CONTACT.postalCode,
      addressLocality: CONTACT.city,
      addressCountry: 'SK',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 48.1490931, longitude: 17.1372062 },
    identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: '57493685' },
    areaServed: { '@type': 'Country', name: 'Slovakia' },
    knowsLanguage: ['sk', 'en'],
    founder: ref(ID.person),
    priceRange: '$$',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: lang === 'en' ? 'Legal services' : 'Právne služby',
      itemListElement: SERVICE_AREAS.map((id) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: T[lang][`services.area.${id}.title`],
          description: T[lang][`services.area.${id}.desc`],
        },
      })),
    },
  };
  if (cfg.sameAs.organization.length) node.sameAs = cfg.sameAs.organization;
  if (cfg.openingHours.length) node.openingHoursSpecification = cfg.openingHours;
  return node;
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    name: SITE_NAME,
    url: SITE + '/',
    inLanguage: ['sk', 'en'],
    publisher: ref(ID.org),
  };
}

function personNode() {
  const cfg = loadSiteConfig();
  const node = {
    '@type': 'Person',
    '@id': ID.person,
    name: 'Jana Králusová',
    honorificPrefix: 'Mgr.',
    jobTitle: 'advokátka',
    worksFor: ref(ID.org),
    image: `${SITE}/assets/photos/about.jpg`,
    url: `${SITE}/o-nas/`,
    knowsLanguage: ['sk', 'en'],
  };
  if (cfg.sameAs.person.length) node.sameAs = cfg.sameAs.person;
  if (cfg.sakNumber) {
    node.identifier = { '@type': 'PropertyValue', propertyID: 'Slovenská advokátska komora', value: cfg.sakNumber };
    node.memberOf = { '@type': 'Organization', name: 'Slovenská advokátska komora', url: 'https://www.sak.sk' };
  }
  return node;
}

// crumbs: [{ name, url }] (url absolute)
function breadcrumbNode(pageUrl, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
}

function imageNode(pageUrl, url, alt) {
  const size = jpegSize(path.join(ROOT, url.replace(SITE, '')));
  const n = { '@type': 'ImageObject', '@id': `${pageUrl}#primaryimage`, url, contentUrl: url };
  if (size) { n.width = size.width; n.height = size.height; }
  if (alt) n.caption = alt;
  return n;
}

/*
 * p: { url (absolute), type, name, description, lang, image, imageAlt, crumbs?, about?, extra? }
 * Returns the WebPage node (+ breadcrumb node when crumbs given) and the image node.
 */
function pageNodes(p) {
  const img = imageNode(p.url, p.image, p.imageAlt);
  const page = {
    '@type': p.type || 'WebPage',
    '@id': `${p.url}#webpage`,
    url: p.url,
    name: p.name,
    description: p.description,
    inLanguage: p.lang,
    isPartOf: ref(ID.website),
    primaryImageOfPage: ref(img['@id']),
    ...(p.extra || {}),
  };
  if (p.about !== false) page.about = ref(ID.org);
  const nodes = [page, img];
  if (p.crumbs && p.crumbs.length) {
    page.breadcrumb = ref(`${p.url}#breadcrumb`);
    nodes.push(breadcrumbNode(p.url, p.crumbs));
  }
  return nodes;
}

// Service page node; the provider is the firm.
function serviceNode({ url, name, description, lang }) {
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    description,
    url,
    inLanguage: lang,
    provider: ref(ID.org),
    areaServed: { '@type': 'Country', name: 'Slovakia' },
  };
}

// extraNodes: page specific nodes (Article, Service, ...)
function graph(lang, nodes) {
  return { '@context': 'https://schema.org', '@graph': [orgNode(lang), websiteNode(), personNode(), ...nodes] };
}

module.exports = { ID, ref, orgNode, websiteNode, personNode, breadcrumbNode, pageNodes, serviceNode, graph };
