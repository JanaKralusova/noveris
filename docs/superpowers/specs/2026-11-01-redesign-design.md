# Noveris site redesign – design

Date: 2026-11-01 · Branch: `redesign` · Approved look: `design-system/` (design system + 14 mockups, "lgtm build it")

## Intent

Bring the whole site to the denser, more modern look Jana sketched in her mockups while keeping the
site's identity (NL logo, Newsreader + Manrope, warm cream), and add the six service-area pages plus the
"pod stavbami" page she wrote. More, better-structured service content = more search traffic and more
consultation requests.

## Goals

- Every page (SK + EN home/about/services/contact, privacy, 404, articles list, 19 articles, owner search)
  rendered with the approved design system: tokens in `tailwind.config.js`, components as shared
  generator functions.
- Seven new SK pages with Jana's copy verbatim (from `design-system/gen/jana-texty.txt`), laid out like
  their mockups. Services overview: six areas, "Vymáhanie pohľadávok" no longer a separate area.
- English versions of the seven pages, drafted by us, approved by Jana before launch.
- Real, self-hosted photos (AVIF + JPEG variants via the existing `picture()` pipeline), credited.

## Non-goals

- No new copy beyond Jana's text, short eyebrows, and the EN translation of her text.
- No CMS, no new dependencies, no change to hosting (GitHub Pages from `main`).
- Village pages, FAQ additions and Umami activation are separate tasks.

## Anti-goals (failure even if it "works")

- Any invented fact, superlative or promise (SAK advertising rules); fake contact details.
- Third-party requests on the live site (Google Fonts, Unsplash hotlinks) – the prototype uses them, the
  site must not.
- Regressions: owner search, contact form (web3forms), structured data, sitemap/llms.txt, Lighthouse
  performance/accessibility, no-layout-shift fonts.
- Pushing to `main` without an explicit "push to main now".

## Constraints

- Zero-dependency Node generator (`scripts/`), Tailwind 3 build, templates in `templates/pages`.
- WCAG AA contrast (tokens already measured: copper #8f5535 etc.).
- Material Symbols self-hosted subset must be regenerated for the new icons (procedure in `fonts.css`).
- Memory: sips AVIF odd-height bug – verify every AVIF renders.

## Decided (by the user)

Whole site at once · green + copper · free stock photos · keep NL logo + menu (incl. Vyhľadávanie
vlastníkov, EN|SK) · footer with real details and "Právo, ktoré dáva zmysel" · translate the 7 pages now ·
home restyled with current content (services section shows all six areas) · articles: new look, same
layout · pages follow their mockups closely, built from shared blocks.

## Builder's calls (mine – the user can override)

- URLs: `/sluzby/vysporiadanie-pozemkov/`, `/sluzby/vysporiadanie-pozemkov/pozemky-pod-stavbami/`,
  `/sluzby/nehnutelnosti-a-development/`, `/sluzby/zmluvna-agenda/`, `/sluzby/obcianske-pravo/`,
  `/sluzby/obchodne-pravo/`, `/sluzby/riesenie-sporov/`; EN under `/en/services/<english-slug>/`.
- Service pages are data-driven: one `content/services/<id>.json` per page (sections + component type +
  copy per language) rendered by shared components; layout per page mirrors its mockup.
- Components live in `scripts/lib/components.js` (JS ports of `design-system/gen/comp*.py`); page chrome
  (header, drawer, footer, contact band) in `scripts/lib/layout.js`.
- JSON-LD: BreadcrumbList on every subpage, `Service` (provider = the firm) on service pages.
- `design-system/` stays in the repo as the reference, `noindex` and `Disallow` in robots.txt.
- Launch is gated on Jana approving the EN translations; until then the EN service pages can be built
  but not linked (hidden flag), so SK can ship first if the user chooses.

## Left to the builder

Exact Tailwind class strings, component APIs, image crops, alt texts (descriptive, Slovak/English),
how to split the work into tasks.
