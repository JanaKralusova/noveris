# Extra components for restyled live pages (home, about, contact, articles). Same style as comp.py.
import comp
from comp import *

def local_photos(extra=None):
    """Use when PH values should be site-relative paths (starting with '/') instead of Unsplash ids."""
    comp.U = lambda i, w=800: i if i.startswith('/') else f"https://images.unsplash.com/photo-{i}?w={w}&q=80&auto=format&fit=crop"
    PH.update(extra or {})

def em(t):
    """Use when a word inside a heading is set in italic copper (as on the live site)."""
    return f'<span class="italic text-copper">{t}</span>'

RELINK = [('href="/"', 'href="domov.html"'), ('href="/o-nas/"', 'href="o-nas.html"'), ('href="/kontakt/"', 'href="kontakt.html"'),
          ('href="/sluzby/"', 'href="sluzby.html"'), ('href="/clanky/"', 'href="clanky.html"'),
          ('href="/clanky/kolko-stoji-vysporiadanie-pozemku/"', 'href="clanok.html"')]
def relink(h):
    """Use when mockup pages should link to each other (.html files) instead of live site paths."""
    for a, b in RELINK: h = h.replace(a, b)
    return h

def page_hero(eb, h1, intro, photo=None, alt="", quote_text=None, quote_cite=None, photo_pos="center"):
    """Use when a top-level page opens with eyebrow, large title, short intro and an optional portrait photo on the right."""
    ph = ''
    if photo:
        qc = (f'<figure class="absolute inset-x-4 bottom-4 rounded-card border border-line bg-card/95 p-5 shadow-soft backdrop-blur md:inset-x-auto md:-left-8 md:bottom-8 md:max-w-xs">'
              f'<blockquote class="font-headline text-[1.125rem] italic leading-snug text-ink">{quote_text}</blockquote>'
              f'<figcaption class="mt-2 font-label text-[12px] text-muted">{quote_cite}</figcaption></figure>') if quote_text else ''
        ph = (f'<div class="relative mx-auto w-full max-w-sm lg:max-w-md"><div class="aspect-[4/5] overflow-hidden rounded-card shadow-soft">'
              f'<img src="{photo}" alt="{alt}" class="h-full w-full object-cover" style="object-position:{photo_pos}"/></div>{qc}</div>')
    grid = "lg:grid-cols-[1.1fr_0.9fr]" if photo else ""
    return (f'<section class="bg-paper"><div class="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:px-8 lg:py-16 {grid}"><div class="max-w-2xl">'
            f'{eyebrow(eb)}<h1 class="mt-4 font-headline text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.1] tracking-tight text-ink">{h1}</h1>'
            f'<p class="mt-5 text-[16px] leading-[1.65] text-body md:text-[17px]">{intro}</p></div>{ph}</div></section>')

def home_hero(eb, h1, intro, ctas, photo, alt, quote_text, quote_cite):
    """Use on the home page: title, intro, primary and secondary CTA, tall photo with a floating quote card."""
    return (f'<section class="bg-paper"><div class="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-16"><div>'
      f'{eyebrow(eb)}<h1 class="mt-4 font-headline text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-ink">{h1}</h1>'
      f'<p class="mt-6 max-w-xl text-[16px] leading-[1.65] text-body md:text-[18px]">{intro}</p>'
      f'<div class="mt-8 flex flex-wrap items-center gap-4">{ctas}</div></div>'
      f'<div class="relative mx-auto w-full max-w-md lg:max-w-none"><div class="aspect-[5/4] overflow-hidden rounded-card shadow-soft lg:aspect-[4/5]"><img src="{photo}" alt="{alt}" class="h-full w-full object-cover"/></div>'
      f'<figure class="absolute inset-x-4 bottom-4 rounded-card border border-line bg-card/95 p-5 shadow-soft backdrop-blur md:inset-x-auto md:-left-8 md:bottom-8 md:max-w-sm">'
      f'<blockquote class="font-headline text-[1.125rem] italic leading-snug text-ink md:text-[1.25rem]">{quote_text}</blockquote>'
      f'<figcaption class="mt-3 font-label text-[12px] text-muted">{quote_cite}</figcaption></figure></div></div></section>')

def portrait_split(eb, title, para, photo, alt, name, role, pos="center 20%"):
    """Use when a section pairs a portrait photo with a short statement and a name plate."""
    return (f'<div class="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"><div class="mx-auto w-full max-w-sm lg:max-w-none">'
      f'<div class="aspect-[4/5] overflow-hidden rounded-card shadow-soft"><img src="{photo}" alt="{alt}" loading="lazy" class="h-full w-full object-cover" style="object-position:{pos}"/></div></div>'
      f'<div>{eyebrow(eb)}<h2 class="mt-2 font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]">{title}</h2>'
      f'<p class="mt-5 text-[16px] leading-[1.65] text-body md:text-[17px]">{para}</p>'
      f'<div class="mt-7 flex items-center gap-4 border-t border-line pt-5"><span class="h-10 w-0.5 bg-copper" aria-hidden="true"></span><div>'
      f'<p class="font-headline text-[1.25rem] text-ink">{name}</p><p class="font-label text-[13px] text-muted">{role}</p></div></div></div></div>')

def quote_band(name, role, text):
    """Use when a full-width sand band presents a person's name and a large pull quote."""
    return (f'<section class="bg-sand py-12 md:py-16"><div class="mx-auto grid max-w-7xl items-center gap-8 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8"><div>'
      f'<h2 class="font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]">{name}</h2><p class="mt-2 font-label text-[14px] text-muted">{role}</p></div>'
      f'<blockquote class="border-l-2 border-copper pl-6 font-headline text-[1.5rem] italic leading-[1.35] text-ink md:text-[2rem]">{text}</blockquote></div></section>')

def text_photo(eb, title, paras, photo, alt, cta=None):
    """Use when a long narrative (several paragraphs) sits beside a photo, with an optional button."""
    ps = "".join(f'<p class="text-[15px] leading-[1.7] text-body md:text-[16px]">{p}</p>' for p in paras)
    c = f'<div class="pt-7">{cta}</div>' if cta else ''
    return (f'<div class="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"><div class="mx-auto w-full max-w-md lg:max-w-none">'
      f'<div class="aspect-square overflow-hidden rounded-card shadow-soft"><img src="{photo}" alt="{alt}" loading="lazy" class="h-full w-full object-cover"/></div></div>'
      f'<div>{eyebrow(eb)}<h2 class="mt-2 font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]">{title}</h2><div class="mt-5 space-y-4">{ps}</div>{c}</div></div>')

def card_value(ic, title, text):
    """Use when a value/principle needs an icon chip, title and one sentence, without a link."""
    return (f'<article class="rounded-card border border-line bg-card p-6 shadow-soft">{chip(ic)}'
      f'<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">{title}</h3>'
      f'<p class="mt-3 text-[14px] leading-[1.6] text-body md:text-[15px]">{text}</p></article>')

def contact_details(rows, linkedin, facts, person_photo, person_alt, kicker, name, sub):
    """Use on the contact page: linked contact rows, registry facts and a portrait plate with name."""
    r = "".join(f'<li><a href="{h}" class="flex items-center gap-3 text-[15px] text-ink hover:text-copper"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-chip text-copper">{icon(i)}</span>{t}</a></li>' for i, t, h in rows)
    r += (f'<li><a href="{linkedin}" rel="me noopener" class="flex items-center gap-3 text-[15px] text-ink hover:text-copper"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-chip font-label text-[13px] font-bold text-copper">in</span>LinkedIn</a></li>')
    f = "".join(f'<div><dt class="font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{k}</dt><dd class="mt-1 text-[15px] text-ink">{v}</dd></div>' for k, v in facts)
    return (f'<address class="not-italic"><h2 class="font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.25rem]">Kontakt</h2>'
      f'<ul class="mt-6 space-y-3">{r}</ul><dl class="mt-7 space-y-4 border-t border-line pt-6">{f}</dl></address>'
      f'<div class="mt-8 flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft"><img src="{person_photo}" alt="{person_alt}" class="h-24 w-20 shrink-0 rounded-btn object-cover" style="object-position:center 20%"/>'
      f'<div>{eyebrow(kicker)}<p class="mt-1 font-headline text-[1.25rem] text-ink">{name}</p><p class="text-[14px] text-body">{sub}</p></div></div>')

def contact_form(title, lead, note_html):
    """Use when the live contact form (name, e-mail, phone, message) is shown as a static card without submit logic."""
    L = "mb-1.5 block font-label text-[13px] font-semibold text-ink"
    def fld(i, lab, ph, t="text"):
        return f'<div><label for="{i}" class="{L}">{lab}</label><input id="{i}" type="{t}" placeholder="{ph}" class="{FIELD}"/></div>'
    return (f'<div><h2 class="font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.25rem]">{title}</h2><p class="mt-3 text-[15px] leading-[1.6] text-body">{lead}</p>'
      '<form class="mt-6 rounded-card border border-line bg-card p-6 shadow-soft md:p-8" onsubmit="return false" novalidate><div class="space-y-5">'
      f'<div class="grid gap-5 sm:grid-cols-2">{fld("c-name","Meno a priezvisko","Ján Nový")}{fld("c-mail","E-mailová adresa","jan.novy@email.sk","email")}</div>'
      f'{fld("c-phone","Telefónne číslo","+421","tel")}'
      f'<div><label for="c-msg" class="{L}">Vaša správa</label><textarea id="c-msg" rows="4" placeholder="Ako Vám môžeme pomôcť?" class="{FIELD}"></textarea></div>'
      f'<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="submit" class="{BTN} bg-forest text-white hover:bg-forest-dark">Odoslať správu{icon("arrow_forward","text-[18px]")}</button>'
      f'<p class="text-[13px] text-body">{note_html}</p></div></div></form></div>')

def wide_photo(src, alt):
    """Use when a full-width landscape photo with rounded corners closes a section."""
    return f'<div class="overflow-hidden rounded-card shadow-soft"><img src="{src}" alt="{alt}" loading="lazy" class="h-56 w-full object-cover sm:h-72 lg:h-80"/></div>'

def article_card(src, alt, title, text, href, tag="h3"):
    """Use when an article is listed as a tile with photo, title, excerpt and read link (no date)."""
    return (f'<article class="group flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft"><a href="{href}" class="block aspect-[3/2] overflow-hidden"><img src="{src}" alt="{alt}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></a>'
      f'<div class="flex flex-1 flex-col p-6"><{tag} class="font-headline text-[1.375rem] leading-snug text-ink"><a href="{href}" class="hover:text-copper">{title}</a></{tag}>'
      f'<p class="mt-3 flex-1 text-[14px] leading-[1.6] text-body">{text}</p><div class="pt-4">{link_arrow("Čítať článok", href)}</div></div></article>')

def article_header(back, crumbs, h1, avatar, author, author_href, date, dt, tags, hero_src, hero_alt):
    """Use at the top of an article: back link, breadcrumb, H1, author/date line, topic tags and lead photo."""
    tg = "".join(f'<li class="rounded-pill bg-chip px-3 py-1 font-label text-[12px] text-copper">{t}</li>' for t in tags)
    return (f'<a href="{back[1]}" class="inline-flex items-center gap-1.5 font-label text-[13px] font-semibold text-copper hover:text-forest">{icon("arrow_back","text-[18px]")}{back[0]}</a>'
      f'<header class="mt-5">{breadcrumb(crumbs)}<h1 class="mt-5 max-w-4xl font-headline text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.12] tracking-tight text-ink">{h1}</h1>'
      f'<div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3"><a href="{author_href}" class="flex items-center gap-3 font-label text-[14px] font-semibold text-ink hover:text-copper"><img src="{avatar}" alt="" class="h-10 w-10 rounded-pill object-cover"/>{author}</a>'
      f'<time datetime="{dt}" class="font-label text-[13px] text-muted">{date}</time></div><ul class="mt-4 flex flex-wrap gap-2">{tg}</ul></header>'
      f'<div class="mt-8 overflow-hidden rounded-card shadow-soft"><img src="{hero_src}" alt="{hero_alt}" class="aspect-[16/8] w-full object-cover"/></div>')

def article_toc(title, items):
    """Use when an article starts with an open, collapsible table of contents linking to its headings."""
    li = "".join(f'<li><a href="#{a}" class="text-body hover:text-copper">{t}</a></li>' for a, t in items)
    return (f'<nav class="mt-8"><details open class="rounded-card border border-line bg-sand p-5"><summary class="cursor-pointer font-label text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">{title}</summary>'
      f'<ol class="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] marker:text-copper">{li}</ol></details></nav>')

def author_box(photo, kicker, name, href, role, bio, more, disclaimer):
    """Use beside or below an article: author card with bio, link, and the general-information disclaimer."""
    return (f'<aside class="space-y-5"><div class="rounded-card border border-line bg-card p-6 shadow-soft"><a href="{href}" tabindex="-1"><img src="{photo}" alt="" class="h-20 w-20 rounded-pill object-cover"/></a>'
      f'<p class="mt-4 font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-copper">{kicker}</p>'
      f'<p class="mt-1 font-headline text-[1.375rem] text-ink"><a href="{href}" class="hover:text-copper">{name}</a></p><p class="font-label text-[13px] text-muted">{role}</p>'
      f'<p class="mt-3 text-[14px] leading-[1.6] text-body">{bio}</p><div class="pt-4">{link_arrow(more, href)}</div></div>'
      f'<p class="text-[13px] leading-[1.6] text-muted">{disclaimer}</p></aside>')
