# Component library: every function returns an HTML string (Tailwind classes only).
import html, re

def U(i, w=800):
    return f"https://images.unsplash.com/photo-{i}?w={w}&q=80&auto=format&fit=crop"

PH = {
 'farm1': '1761185259302-88d5175c9d42', 'farm2': '1759800713797-1b613a51b1e6', 'farm5': '1561682709-ce152c5b789a',
 'gov': '1783571856202-05070539dc12', 'cem1': '1781455590042-ca2fb875a54a', 'cem2': '1698696609179-25b0b3b7e7e2',
 'plan1': '1762146828422-50a8bd416d3c', 'plan2': '1721244653721-bc681b2dfd27', 'off': '1778961419928-2968ddd57c05',
 'ware': '1726776230760-ae81dc9d4e55', 'pen': '1517842645767-c639042777db', 'plant': '1557865353-72c46b1f864f',
}
def P(k, w=800): return U(PH[k], w)

MENU = [("Domov","/"),("O nás","/o-nas/"),("Služby","/sluzby/"),("Články","/clanky/"),("Vyhľadávanie vlastníkov","/nezisteni-vlastnici/"),("Kontakt","/kontakt/")]

def icon(name, cls="text-[22px]"):
    return f'<span class="material-symbols-outlined {cls}" aria-hidden="true">{name}</span>'

def img(k, w=800, cls="h-full w-full object-cover", alt=""):
    return f'<img src="{P(k,w)}" alt="{alt}" loading="lazy" class="{cls}"/>'

# ---------- atoms ----------
def eyebrow(t, dark=False):
    c = "text-copper-light" if dark else "text-copper"
    return f'<p class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] {c}">{t}</p>'

def chip(name):
    return f'<span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-chip text-copper">{icon(name)}</span>'

BTN = "inline-flex items-center gap-3 rounded-btn px-6 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200"
def btn_primary(t, href="#"):
    return f'<a href="{href}" class="{BTN} bg-forest text-white hover:bg-forest-dark">{t}{icon("arrow_forward","text-[18px]")}</a>'
def btn_secondary(t, href="#"):
    return f'<a href="{href}" class="{BTN} border border-forest text-forest hover:bg-forest hover:text-white">{t}{icon("arrow_forward","text-[18px]")}</a>'
def btn_dark(t, href="#"):
    return f'<a href="{href}" class="{BTN} bg-white text-forest hover:bg-sand">{t}{icon("arrow_forward","text-[18px]")}</a>'
def link_arrow(t, href="#"):
    return (f'<a href="{href}" class="group inline-flex items-center gap-2 font-label text-[14px] font-semibold text-ink transition-colors hover:text-copper">{t}'
            f'<span class="material-symbols-outlined text-[18px] text-copper transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">arrow_forward</span></a>')

def breadcrumb(items):
    out = []
    for i, (t, h) in enumerate(items):
        last = i == len(items) - 1
        if last: out.append(f'<li aria-current="page" class="text-body">{t}</li>')
        else: out.append(f'<li class="flex items-center gap-1.5"><a href="{h}" class="hover:text-copper hover:underline">{t}</a>{icon("chevron_right","text-[16px]")}</li>')
    return f'<nav aria-label="Omrvinková navigácia"><ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-label text-[12px] text-muted">{"".join(out)}</ol></nav>'

def lang_switch():
    return ('<div class="flex items-center gap-2 font-label text-[12px] font-semibold tracking-wider">'
            '<a href="/en/" hreflang="en" lang="en" aria-label="EN: Switch to English" class="text-muted transition-colors hover:text-copper">EN</a>'
            '<span class="text-line" aria-hidden="true">|</span>'
            '<a href="/" hreflang="sk" lang="sk" aria-label="SK: Prepnúť na slovenčinu" aria-current="true" class="text-ink">SK</a></div>')

def logo(h="h-7"):
    return f'<a href="/" class="inline-flex shrink-0"><img src="/assets/logo.svg" alt="Noveris Legal" width="821" height="277" class="{h} w-auto invert"/></a>'

# ---------- header ----------
def header(active="Služby", sticky=False):
    pos = "sticky top-0 z-50" if sticky else "relative"
    links = []
    for t, h in MENU:
        if t == active:
            links.append(f'<a href="{h}" aria-current="page" class="flex h-16 items-center border-b-2 border-copper font-label text-[14px] font-medium text-ink">{t}</a>')
        else:
            links.append(f'<a href="{h}" class="flex h-16 items-center border-b-2 border-transparent font-label text-[14px] font-medium text-body transition-colors hover:text-copper">{t}</a>')
    return (f'<header class="{pos} border-b border-line bg-paper/95 backdrop-blur">'
        '<nav class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8" aria-label="Hlavná navigácia">'
        f'{logo()}'
        f'<div class="hidden items-center gap-7 lg:flex">{"".join(links)}</div>'
        f'<div class="flex items-center gap-4">{lang_switch()}'
        '<button type="button" id="mobile-menu-btn" class="-mr-2 p-2 text-ink lg:hidden" aria-label="Menu" aria-expanded="false">'
        f'{icon("menu","text-[26px]")}</button></div></nav></header>')

def drawer_panel(active="Služby"):
    items = []
    for t, h in MENU:
        c = "text-copper" if t == active else "text-ink"
        items.append(f'<a href="{h}" class="block border-b border-line py-3.5 font-label text-[15px] font-medium {c}"' + (' aria-current="page"' if t == active else '') + f'>{t}</a>')
    return ('<div class="flex h-full w-72 flex-col border-l border-line bg-paper shadow-2xl">'
        '<div class="flex h-16 items-center justify-between border-b border-line px-6">'
        '<span class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">Menu</span>'
        f'<button type="button" aria-label="Zavrieť menu" class="-mr-2 p-2 text-ink" data-close-menu>{icon("close","text-[26px]")}</button></div>'
        f'<div class="flex-1 overflow-y-auto px-6 py-2">{"".join(items)}</div>'
        f'<div class="border-t border-line p-6"><a href="/kontakt/" class="{BTN} w-full justify-center bg-forest text-white hover:bg-forest-dark">Dohodnite si konzultáciu</a></div></div>')

# ---------- sections ----------
def section(inner, bg="bg-paper", pad="py-12 md:py-16"):
    return f'<section class="{bg} {pad}"><div class="mx-auto max-w-7xl px-6 lg:px-8">{inner}</div></section>'

def section_header(eb, title, note=None):
    n = f'<p class="max-w-sm text-[13px] leading-normal text-muted md:text-[14px] md:text-right">{note}</p>' if note else ''
    return (f'<div class="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-10"><div>'
            + (eyebrow(eb) if eb else '') +
            f'<h2 class="mt-2 font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]">{title}</h2></div>{n}</div>')

def hero(photo, crumbs, h1, intro, bold=None, after=None, cta=None, cta_href="/kontakt/"):
    paras = "".join(f'<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">{p}</p>' for p in intro)
    b = f'<p class="text-[15px] font-bold leading-[1.6] text-ink md:text-[16px]">{bold}</p>' if bold else ''
    a = f'<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">{after}</p>' if after else ''
    c = f'<div class="pt-7">{btn_primary(cta, cta_href)}</div>' if cta else ''
    return (f'<section class="relative overflow-hidden bg-paper">'
      f'<div class="fade-photo relative h-52 sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">{img(photo,1600)}</div>'
      f'<div class="relative mx-auto max-w-7xl px-6 pb-12 pt-2 lg:px-8 lg:py-14"><div class="lg:w-[50%]">'
      f'{breadcrumb(crumbs)}<h1 class="mt-5 font-headline text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-ink">{h1}</h1>'
      f'<div class="mt-5 space-y-3">{paras}{b}{a}</div>{c}</div></div></section>')

# Linked tiles: photo and title link to the card's page; the root carries `group` so hovering the card
# zooms the photo, turns the title copper and moves the arrow. `link` is the link_arrow HTML (or None).
ZOOM = " transition-transform duration-500 group-hover:scale-[1.03]"
def _href(link):
    m = re.search(r'href="([^"]*)"', link or "")
    return m.group(1) if m else None
def tile_photo(link, cls, img_html, img_cls):
    """Photo box: a hidden link (aria-hidden, tabindex -1) when the card has a link, a plain div otherwise."""
    h = _href(link)
    if not h:
        return f'<div class="{cls}">{img_html.format(cls=img_cls)}</div>'
    return f'<a href="{h}" tabindex="-1" aria-hidden="true" class="block {cls.replace("overflow-hidden ", "").replace(" overflow-hidden", "")} overflow-hidden">{img_html.format(cls=img_cls + ZOOM)}</a>'
def tile_title(link, title, href=None):
    h = href or _href(link)
    return f'<a href="{h}" class="transition-colors group-hover:text-copper">{title}</a>' if h else title
def tile_group(link):
    return "group " if _href(link) else ""

def card_side(ic, title, paras, photo, link=None):
    ps = "".join(f'<p class="text-[14px] leading-[1.6] text-body md:text-[15px]">{p}</p>' for p in paras)
    l = f'<div class="pt-4">{link}</div>' if link else ''
    im = f'<img src="{P(photo,600)}" alt="" loading="lazy" class="{{cls}}"/>'
    return (f'<article class="{tile_group(link)}flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft sm:flex-row">'
      f'<div class="flex-1 p-6">{chip(ic)}<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">{tile_title(link, title)}</h3>'
      f'<div class="mt-3 space-y-3">{ps}</div>{l}</div>'
      + tile_photo(link, "relative order-first h-44 sm:order-last sm:h-auto sm:w-[34%] sm:shrink-0", im, "absolute inset-0 h-full w-full object-cover") + '</article>')

def card_top(ic, title, paras, photo):
    ps = "".join(f'<p class="text-[14px] leading-[1.6] text-body md:text-[15px]">{p}</p>' for p in paras)
    return (f'<article class="overflow-hidden rounded-card border border-line bg-card shadow-soft"><div class="h-40"><img src="{P(photo,700)}" alt="" loading="lazy" class="h-full w-full object-cover"/></div>'
      f'<div class="p-6">{chip(ic)}<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">{title}</h3><div class="mt-3 space-y-3">{ps}</div></div></article>')

def card_compact(ic, title, text, photo):
    return (f'<article class="h-full overflow-hidden rounded-card border border-line bg-card shadow-soft"><div class="h-28"><img src="{P(photo,500)}" alt="" loading="lazy" class="h-full w-full object-cover"/></div>'
      f'<div class="p-4">{chip(ic)}<h3 class="mt-3 font-headline text-[1.125rem] leading-snug text-ink">{title}</h3><p class="mt-2 text-[13px] leading-normal text-body">{text}</p></div></article>')

def card_icon(ic, title, text, href="#"):
    return (f'<article class="group flex flex-col rounded-card border border-line bg-card p-6 shadow-soft">{chip(ic)}'
      f'<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">{tile_title(None, title, href)}</h3>'
      f'<p class="mt-3 flex-1 text-[14px] leading-[1.6] text-body md:text-[15px]">{text}</p><div class="pt-5">{link_arrow("Viac o službe", href)}</div></article>')

def steps_h(steps):
    cols = []
    for i, (t, d) in enumerate(steps):
        arrow = f'<span class="hidden shrink-0 self-start pt-3 text-muted md:block">{icon("arrow_forward","text-[20px]")}</span>' if i < len(steps) - 1 else ''
        cols.append(f'<li class="flex flex-1 items-start gap-4"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-sand-deep font-headline text-[1.125rem] text-forest">{i+1:02d}</span>'
          f'<div><h3 class="font-headline text-[1.25rem] leading-snug text-ink md:text-[1.375rem]">{t}</h3><p class="mt-2 text-[14px] leading-[1.6] text-body md:text-[15px]">{d}</p></div></li>{arrow}')
    return f'<ol class="flex flex-col gap-8 md:flex-row md:gap-6">{"".join(cols)}</ol>'

def steps_v(steps):
    out = []
    for i, (t, d) in enumerate(steps):
        line = '' if i == len(steps) - 1 else '<span class="absolute left-[21px] top-12 h-[calc(100%-2rem)] w-px bg-line" aria-hidden="true"></span>'
        out.append(f'<li class="relative flex gap-4 pb-7 last:pb-0">{line}<span class="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-sand-deep font-headline text-[1.125rem] text-forest">{i+1:02d}</span>'
          f'<div class="pt-1"><h3 class="font-headline text-[1.25rem] leading-snug text-ink">{t}</h3><p class="mt-1 text-[14px] leading-[1.6] text-body">{d}</p></div></li>')
    return f'<ol>{"".join(out)}</ol>'

def split_band(eb, title, paras, photo, link=None, side="left", bg="bg-sand"):
    ps = "".join(f'<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">{p}</p>' for p in paras)
    l = f'<div class="pt-5">{link}</div>' if link else ''
    fade = "fade-photo-l" if side == "left" else "fade-photo"
    pos = "lg:left-0" if side == "left" else "lg:right-0"
    pad = "lg:ml-auto lg:w-[52%] lg:pl-12" if side == "left" else "lg:w-[52%] lg:pr-12"
    return (f'<section class="relative overflow-hidden {bg}"><div class="{fade} relative h-48 sm:h-64 lg:absolute lg:inset-y-0 {pos} lg:h-auto lg:w-[48%]">{img(photo,1200)}</div>'
      f'<div class="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16"><div class="{pad}">{eyebrow(eb) if eb else ""}'
      f'<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2.25rem]">{title}</h2><div class="mt-4 space-y-3">{ps}</div>{l}</div></div></section>')

def callout(ic, text):
    return f'<div class="flex items-start gap-4 rounded-card border border-line bg-card p-5 shadow-soft">{chip(ic)}<p class="pt-1.5 text-[15px] font-bold leading-[1.5] text-ink">{text}</p></div>'

def icon_list(items):
    li = "".join(f'<li class="flex items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-chip text-copper">{icon(i,"text-[20px]")}</span><span class="text-[14px] leading-snug text-body md:text-[15px]">{t}</span></li>' for i, t in items)
    return f'<ul class="space-y-3">{li}</ul>'

def two_col(eb1, h1, p1, eb2, h2, p2):
    def col(e, h, ps):
        return f'<div>{eyebrow(e)}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2rem]">{h}</h2><div class="mt-4 space-y-3 text-[15px] leading-[1.6] text-body md:text-[16px]">{ps}</div></div>'
    return f'<div class="grid gap-10 md:grid-cols-2 md:gap-14">{col(eb1,h1,p1)}{col(eb2,h2,p2)}</div>'

def related_band(eb, title, text, link, photo):
    im = f'<img src="{P(photo,700)}" alt="" loading="lazy" class="{{cls}}"/>'
    return (f'<div class="{tile_group(link)}flex flex-col overflow-hidden rounded-card border border-line bg-sand sm:flex-row"><div class="flex-1 p-6 md:p-8">{eyebrow(eb)}'
      f'<h3 class="mt-2 font-headline text-[1.5rem] leading-snug text-ink md:text-[1.75rem]">{tile_title(link, title)}</h3><p class="mt-3 text-[15px] leading-[1.6] text-body">{text}</p><div class="pt-4">{link}</div></div>'
      + tile_photo(link, "relative h-40 sm:h-auto sm:w-[32%]", im, "absolute inset-0 h-full w-full object-cover") + '</div>')

def contact_band(title, paras, cta, photo="plant", cta_href="/kontakt/"):
    ps = "".join(f'<p class="text-[15px] leading-[1.6] text-white/90 md:text-[16px]">{p}</p>' for p in paras)
    return (f'<section class="relative overflow-hidden bg-forest"><div class="fade-photo-dark absolute inset-y-0 right-0 hidden w-1/2 opacity-60 lg:block">{img(photo,1200)}</div>'
      f'<div class="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14"><div class="lg:w-[55%]">{eyebrow("Kontakt", True)}'
      f'<h2 class="mt-2 font-headline text-[1.875rem] leading-[1.2] text-white md:text-[2.25rem]">{title}</h2><div class="mt-4 space-y-3">{ps}</div><div class="pt-7">{btn_dark(cta, cta_href)}</div></div></div></section>')

def footer():
    ml = "".join(f'<a href="{h}" class="py-1 font-label text-[14px] text-body transition-colors hover:text-copper">{t}</a>' for t, h in MENU)
    def c(ic, t, h=None):
        inner = f'<a href="{h}" class="hover:text-copper">{t}</a>' if h else t
        return f'<li class="flex items-center gap-3 text-[14px] text-body">{icon(ic,"text-[20px] text-copper")}<span>{inner}</span></li>'
    return ('<footer class="border-t border-line bg-paper"><div class="mx-auto max-w-7xl px-6 lg:px-8">'
      '<div class="grid gap-10 py-12 md:grid-cols-3 md:gap-0">'
      f'<div class="md:pr-10">{logo("h-8")}<p class="mt-4 text-[14px] text-body">Právo, ktoré dáva zmysel</p></div>'
      f'<nav aria-label="Pätička" class="md:border-l md:border-line md:px-10"><div class="grid grid-cols-2 gap-x-6">{ml}</div></nav>'
      '<ul class="space-y-3 md:border-l md:border-line md:pl-10">'
      + c("call", "+421 915 622 518", "tel:+421915622518") + c("mail", "kralusova@noveris.sk", "mailto:kralusova@noveris.sk") + c("location_on", "Turčianska 42, 821 09 Bratislava") +
      '</ul></div><div class="flex flex-col gap-2 border-t border-line py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">'
      '<p>© 2026 Noveris Legal s. r. o. Všetky práva vyhradené.</p><a href="/ochrana-osobnych-udajov/" class="hover:text-copper hover:underline">Ochrana osobných údajov</a></div></div></footer>')

def article_tile(photo, date, title, text, href="#"):
    return (f'<article class="group flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft"><a href="{href}" tabindex="-1" aria-hidden="true" class="block h-44 overflow-hidden"><img src="{P(photo,700)}" alt="" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></a>'
      f'<div class="flex flex-1 flex-col p-6"><time datetime="2026-10-20" class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-copper">{date}</time>'
      f'<h3 class="mt-2 font-headline text-[1.375rem] leading-snug text-ink"><a href="{href}" class="transition-colors group-hover:text-copper">{title}</a></h3>'
      f'<p class="mt-2 flex-1 text-[14px] leading-[1.6] text-body">{text}</p><div class="pt-4">{link_arrow("Čítať článok", href)}</div></div></article>')

def quote(text, cite):
    return (f'<figure class="border-l-2 border-copper pl-6"><blockquote class="font-headline text-[1.375rem] italic leading-[1.4] text-ink md:text-[1.75rem]">{text}</blockquote>'
            f'<figcaption class="mt-3 font-label text-[13px] text-muted">{cite}</figcaption></figure>')

FIELD = "block w-full rounded-btn border border-field bg-white px-4 py-3 font-body text-[15px] text-ink placeholder:text-muted focus:border-forest focus:ring-2 focus:ring-forest/25"
def form_card():
    return ('<form class="max-w-xl rounded-card border border-line bg-card p-6 shadow-soft md:p-8" onsubmit="return false" novalidate><div class="space-y-5">'
      '<div><label for="f-name" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">Meno a priezvisko</label>'
      f'<input id="f-name" type="text" placeholder="Meno Priezvisko" class="{FIELD}"/></div>'
      '<div><label for="f-mail" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">E-mail</label>'
      f'<input id="f-mail" type="email" value="meno@" aria-invalid="true" aria-describedby="f-mail-err" class="{FIELD} !border-danger"/>'
      '<p id="f-mail-err" class="mt-1.5 flex items-center gap-1.5 text-[13px] text-danger">' + icon("error", "text-[16px]") + 'Zadajte e-mail v tvare meno@domena.sk.</p></div>'
      '<div><label for="f-topic" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">Oblasť</label>'
      f'<select id="f-topic" class="{FIELD}"><option>Vysporiadanie pozemkov</option><option>Zmluvná agenda</option><option>Občianske právo</option><option>Obchodné právo</option></select></div>'
      '<div><label for="f-msg" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">Správa</label>'
      f'<textarea id="f-msg" rows="4" class="{FIELD}"></textarea></div>'
      '<label class="flex items-start gap-3 text-[13px] leading-snug text-body"><input type="checkbox" class="mt-0.5 h-4 w-4 rounded-[3px] border-field text-forest focus:ring-forest"/>'
      '<span>Súhlasím so spracovaním osobných údajov (<a href="/ochrana-osobnych-udajov/" class="text-copper underline underline-offset-2">Ochrana osobných údajov</a>).</span></label>'
      f'<button type="submit" class="{BTN} bg-forest text-white hover:bg-forest-dark">Odoslať správu{icon("arrow_forward","text-[18px]")}</button></div></form>')

DRAWER_JS = '''<script>
(function(){var b=document.getElementById('mobile-menu-btn'),m=document.getElementById('mobile-menu');if(!b||!m)return;
function t(o){m.classList.toggle('opacity-0',!o);m.classList.toggle('pointer-events-none',!o);m.firstElementChild.nextElementSibling.classList.toggle('translate-x-full',!o);b.setAttribute('aria-expanded',o)}
b.addEventListener('click',function(){t(true)});m.addEventListener('click',function(e){if(e.target===m.firstElementChild||e.target.closest('[data-close-menu]'))t(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')t(false)})})();
</script>'''

def drawer_overlay(active="Služby"):
    return ('<div id="mobile-menu" class="pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity duration-300 lg:hidden">'
      '<div class="absolute inset-0 bg-ink/40"></div>'
      f'<div class="absolute right-0 top-0 h-full translate-x-full transition-transform duration-300 ease-out">{drawer_panel(active)}</div></div>')

def head(title, depth=0):
    return ('<!DOCTYPE html>\n<html lang="sk">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n'
      f'<title>{title}</title>\n<meta name="robots" content="noindex"/>\n'
      '<link rel="stylesheet" href="/fonts.css"/>\n<link rel="stylesheet" href="/tailwind-output.css"/>\n<link rel="stylesheet" href="/styles.css"/>\n'
      '<!-- Prototype only: full Material Symbols font from Google Fonts (the self-hosted subset lacks most icons). Loaded after fonts.css so it overrides the subset face. Regenerate the subset at implementation. -->\n'
      '<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>\n'
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"/>\n'
      '<link rel="stylesheet" href="/design-system/ds.css"/>\n</head>\n')

MEASURE_JS = '<script>window.addEventListener("load",function(){setTimeout(function(){var d=document.documentElement;d.setAttribute("data-h",d.scrollHeight);d.setAttribute("data-ow",d.scrollWidth>window.innerWidth?"overflow":"ok")},1500)})</script>'
