# Extra components + photos for the five service-area mockups (own module; comp.py stays untouched).
from comp import *

PH.update({
 # nehnutelnosti-a-development
 'bld': '1624204386084-dd8c05e32226', 'crane': '1551711974-faf378be34b2', 'planmodel': '1782879549420-7cd9dc53d334',
 'interior': '1724582586529-62622e50c0b3', 'sunfield': '1605145583191-24d17a7a2555', 'path2': '1755335493671-ae4a369d5989',
 'aerial2': '1777063011921-a13c80721c2c', 'pensign': '1627518788331-b3b7fdaa382f',
 # zmluvna-agenda
 'sign1': '1564846824194-346b7871b855', 'paperstack': '1516409590654-e8d51fc2d25c', 'sign2': '1521791055366-0d553872125f',
 'table2': '1681505504714-4ded1bc247e7', 'sign3': '1450101499163-c8848c66ca85', 'justice_dark': '1768839722927-df0ef3188f6d',
 'desk': '1764740109279-c7a8abd78821',
 # obcianske-pravo
 'justice_book': '1774898988393-5c752e4d55e9', 'books_pen': '1423592707957-3b212afa6733', 'jar': '1791304459096-5f16f5782e38',
 'house': '1768839720694-46c264d72b34', 'rings': '1553915632-175f60dd8e36', 'books_row': '1765969934461-2f945e5aacb8',
 'papers_table': '1775163024488-e88e4a71179f',
 # obchodne-pravo
 'skyline': '1767150145058-367fb68021f2', 'glassbld': '1532888277436-2286814f0ee1', 'sign4': '1764106813759-9ef7bf42a0af',
 'chairs': '1628062699790-7c45262b82b4', 'calc': '1762427355235-dd22e5cb010c', 'binders_old': '1780394799229-ee29ad4b0900',
 'meeting_sil': '1631701731910-2c6c6c1545f2',
 # riesenie-sporov
 'justice2': '1589994965851-a8f479c573a9', 'sil2': '1609673539873-cb21cc359348', 'gavel': '1767972159871-b9f5d320be2b',
 'folders': '1468779036391-52341f60b55d', 'sil3': '1772178138144-62e59799cc54', 'filestack': '1583521214690-73421a1829a9',
 'sil_group': '1502444330042-d1a1ddf9bb5b',
})

def card_top_link(ic, title, paras, photo, link=None):
    """Use when a top-image card needs a trailing text link (card_top has none)."""
    ps = "".join(f'<p class="text-[14px] leading-[1.6] text-body md:text-[15px]">{p}</p>' for p in paras)
    l = f'<div class="pt-4">{link}</div>' if link else ''
    im = f'<img src="{P(photo,700)}" alt="" loading="lazy" class="{{cls}}"/>'
    return (f'<article class="{tile_group(link)}overflow-hidden rounded-card border border-line bg-card shadow-soft">' + tile_photo(link, "h-40", im, "h-full w-full object-cover") +
      f'<div class="p-6">{chip(ic)}<h3 class="mt-4 font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]">{tile_title(link, title)}</h3><div class="mt-3 space-y-3">{ps}</div>{l}</div></article>')

def prose_section(eb, title, paras, bg="bg-paper"):
    """Use when a text-only section (heading plus paragraphs, no image) is needed after the cards."""
    ps = "".join(f'<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">{p}</p>' for p in paras)
    return section(f'<div class="max-w-3xl">{eyebrow(eb) if eb else ""}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2.25rem]">{title}</h2><div class="mt-4 space-y-3">{ps}</div></div>', bg=bg)

def span(inner, n):
    """Use to place a card in a 6-column grid (lg:col-span 2 or 3) for 3+2 or 2+2+1 layouts."""
    c = {2: "lg:col-span-2", 3: "lg:col-span-3", 6: "lg:col-span-6"}[n]
    return f'<div class="flex flex-col {c} [&>article]:flex-1">{inner}</div>'

def grid6(items):
    return f'<div class="grid gap-5 lg:grid-cols-6 lg:gap-6">{"".join(items)}</div>'

def page(slug, title, hero_html, main_html):
    h = head(f"{title} | Noveris Legal (mockup)")
    b = '<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n' + header("Služby", True) + drawer_overlay("Služby") + '<main>'
    b += hero_html + main_html + '</main>' + footer() + DRAWER_JS + MEASURE_JS + '\n</body>\n</html>\n'
    open(f'/Users/mbr/projects/noveris/design-system/mockups/{slug}.html', 'w').write(h + b)

def crumbs(name):
    return [("Domov", "/"), ("Služby", "sluzby.html"), (name, "#")]
