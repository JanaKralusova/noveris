import re, html as H
from comp import *
from mock import CARDS, STEPS
ROOT='/Users/mbr/projects/noveris/design-system/'

def Lum(h):
    h=h.lstrip('#');c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    a,b=Lum(a),Lum(b);a,b=max(a,b),min(a,b);return (a+.05)/(b+.05)

def pretty(s):
    s=re.sub(r'><', '>\n<', s)
    out=[];d=0
    for ln in s.split('\n'):
        if re.match(r'</',ln): d=max(d-1,0)
        out.append('  '*d+ln)
        if re.match(r'<[a-zA-Z]',ln) and not re.search(r'</[a-z0-9]+>$|/>$',ln) and not re.match(r'<(img|input|meta|link|br)',ln): d+=1
    return '\n'.join(out)
def snip(s):
    return ('<details class="mt-3 rounded-card border border-line bg-card"><summary class="flex items-center gap-2 px-4 py-2.5 font-label text-[13px] font-semibold text-ink">'
      f'{icon("chevron_right","doc-chev text-[18px] text-copper transition-transform")}HTML snippet (Tailwind classes)</summary>'
      f'<pre class="doc-code max-h-96 overflow-auto border-t border-line bg-sand/60 p-4 text-ink"><code>{H.escape(pretty(s))}</code></pre></details>')

def comp(id_, name, when, demo, src=None, pad=True, bg="bg-paper", notes=None):
    n = f'<p class="mt-2 text-[13px] text-muted">{notes}</p>' if notes else ''
    p = "p-6" if pad else ""
    return (f'<div id="{id_}" class="mt-12"><h3 class="font-headline text-[1.5rem] text-ink">{name}</h3>'
      f'<p class="mt-1 text-[14px] text-body"><span class="font-semibold text-ink">Use when:</span> {when}</p>{n}'
      f'<div class="mt-4 overflow-hidden rounded-card border border-dashed border-field/50 {bg} {p}">{demo}</div>{snip(src if src is not None else demo)}</div>')

def h2(id_, t, sub=None):
    s = f'<p class="mt-2 max-w-3xl text-[15px] text-body">{sub}</p>' if sub else ''
    return f'<div id="{id_}" class="mt-16 border-t border-line pt-10"><h2 class="font-headline text-[2rem] leading-tight text-ink md:text-[2.5rem]">{t}</h2>{s}</div>'

# ---------- colours ----------
COL=[("paper","#fbf9f5","Page background","bg-paper"),("sand","#f0ece6","Band / section background","bg-sand"),("sand-deep","#e7ded1","Step circles","bg-sand-deep"),
("chip","#f1ece5","Icon chip fill","bg-chip"),("line","#e6e0d6","Hairlines, card borders","border-line"),("card","#ffffff","Cards, inputs","bg-card"),
("forest","#17302b","Primary buttons, contact band","bg-forest"),("forest-dark","#0f231f","Primary hover","hover:bg-forest-dark"),("ink","#1c2420","Headings","text-ink"),
("body","#4a4740","Body text","text-body"),("muted","#6f6a60","Small / secondary text","text-muted"),("copper","#8f5535","Eyebrows, icons, arrows, active nav, links","text-copper"),
("copper-light","#e0b08a","Eyebrow on forest (dark bands)","text-copper-light"),("field","#8e867a","Form field border (non-text 3:1)","border-field"),("danger","#b3261e","Error text/border","text-danger")]
def swatches():
    out=[]
    for n,hx,use,cls in COL:
        if n in("paper","sand","card","chip","sand-deep","line"): m=f'ink on it: {cr("#1c2420",hx):.1f}:1'
        elif n in("forest","forest-dark"): m=f'white on it: {cr("#ffffff",hx):.1f}:1'
        elif n=="copper-light": m=f'on forest: {cr(hx,"#17302b"):.1f}:1'
        elif n=="field": m=f'on white: {cr(hx,"#ffffff"):.1f}:1 (border, needs 3:1)'
        else: m=f'on paper {cr(hx,"#fbf9f5"):.1f} | sand {cr(hx,"#f0ece6"):.1f} | white {cr(hx,"#ffffff"):.1f}'
        out.append(f'<div class="overflow-hidden rounded-card border border-line bg-card"><div class="h-16 border-b border-line" style="background:{hx}"></div>'
          f'<div class="p-3"><p class="font-label text-[14px] font-semibold text-ink">{n}</p><p class="doc-code text-muted">{hx}</p><p class="mt-1 text-[13px] text-body">{use}</p>'
          f'<p class="mt-1 text-[12px] text-muted">{m}</p><p class="doc-code mt-1 text-[11px] text-muted">{cls}</p></div></div>')
    return f'<div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{"".join(out)}</div>'

def typo():
    rows=[("H1 - page title","font-headline text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-ink","Vysporiadanie pozemkov a vlastníckych vzťahov"),
    ("H2 - section title","font-headline text-[2rem] leading-[1.15] text-ink md:text-[2.5rem]","S akými vlastníckymi problémami pomáhame?"),
    ("H3 - card title","font-headline text-[1.375rem] leading-snug text-ink md:text-[1.5rem]","Pozemky zapísané na zosnulé osoby"),
    ("Lead","text-[17px] leading-relaxed text-body md:text-[18px]","Nevysporiadané vlastnícke vzťahy môžu komplikovať predaj, výstavbu aj ďalšie využívanie nehnuteľností."),
    ("Body","text-[15px] leading-[1.6] text-body md:text-[16px]","Pomáhame jednotlivcom, obchodným spoločnostiam a investorom pri vysporiadaní pozemkov a riešení komplikovaných vlastníckych vzťahov."),
    ("Body bold","text-[15px] font-bold leading-[1.6] text-ink md:text-[16px]","Pomáhame jednotlivcom, obchodným spoločnostiam a investorom pri vysporiadaní pozemkov."),
    ("Small","text-[13px] leading-normal text-muted md:text-[14px]","© 2026 Noveris Legal s. r. o. Všetky práva vyhradené."),
    ("Eyebrow","font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-copper","Naše služby"),
    ("Nav link","font-label text-[14px] font-medium text-body","Vyhľadávanie vlastníkov"),
    ("Button label","font-label text-[12px] font-semibold uppercase tracking-[0.12em]","Dohodnite si konzultáciu")]
    o=''
    for n,c,t in rows:
        o+=(f'<div class="grid gap-2 border-b border-line py-5 md:grid-cols-[180px_1fr] md:gap-8"><div><p class="font-label text-[13px] font-semibold text-ink">{n}</p></div>'
            f'<div><div class="{c}">{t}</div><p class="doc-code mt-2 break-words text-muted">{H.escape(c)}</p></div></div>')
    return f'<div class="mt-4">{o}</div><p class="mt-4 text-[13px] text-muted">Fonts: Newsreader (headlines, weight 400 + italic) and Manrope (body/labels 400-700), self-hosted via fonts.css. Body text on the page: <span class="doc-code">font-body text-[15px] leading-[1.6] text-body</span> on <span class="doc-code">bg-paper</span>.</p>'

def spacing():
    sp=[("Section padding","py-12 md:py-16","48px mobile / 64px desktop (was 96-128px)"),("Container","mx-auto max-w-7xl px-6 lg:px-8","1280px max, 24px / 32px side padding"),
        ("Section header gap","mb-8 md:mb-10","between header and content"),("Grid gap (cards)","gap-5 lg:gap-6","20 / 24px"),("Card padding","p-6","24px")]
    t=''.join(f'<tr class="border-b border-line"><td class="py-2 pr-4 font-semibold text-ink">{a}</td><td class="doc-code py-2 pr-4 text-body">{b}</td><td class="py-2 text-[13px] text-muted">{c}</td></tr>' for a,b,c in sp)
    demo=('<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">'
     '<div><div class="h-20 rounded-card border border-line bg-card shadow-soft"></div><p class="doc-code mt-2 text-muted">rounded-card (6px) border-line shadow-soft</p></div>'
     '<div><div class="grid h-20 place-items-center"><span class="rounded-btn bg-forest px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Tlačidlo</span></div><p class="doc-code mt-2 text-muted">rounded-btn (4px)</p></div>'
     f'<div><div class="grid h-20 place-items-center">{chip("gavel")}</div><p class="doc-code mt-2 text-muted">rounded-pill (full circle)</p></div>'
     '<div><div class="h-20 rounded-card bg-card shadow-soft"></div><p class="doc-code mt-2 text-muted">shadow-soft: 0 10px 32px -4px rgba(28,36,32,.06)</p></div></div>')
    return f'<table class="mt-4 w-full text-left text-[14px]"><tbody>{t}</tbody></table>{demo}<p class="mt-4 text-[13px] text-muted">Note: in this Tailwind config the built-in <span class="doc-code">rounded-full</span> is 0.75rem (legacy), so circles use the new <span class="doc-code">rounded-pill</span> token.</p>'

ICONS=["account_balance","person","groups","description","apartment","factory","gavel","balance","search","map","call","mail"]
def icons():
    cells=''.join(f'<div class="flex flex-col items-center gap-2 rounded-card border border-line bg-card p-4 text-center">{chip(i)}<span class="doc-code text-[11px] text-muted">{i}</span></div>' for i in ICONS)
    return (f'<p class="mt-4 text-[14px] text-body">Material Symbols Outlined, weight 300 (set globally in styles.css), copper, inside a 44px round chip. Markup: <span class="doc-code">&lt;span class="grid h-11 w-11 place-items-center rounded-pill bg-chip text-copper"&gt;&lt;span class="material-symbols-outlined text-[22px]"&gt;gavel&lt;/span&gt;&lt;/span&gt;</span>. '
            f'Also used bare, 18-20px: arrows (<span class="doc-code">arrow_forward</span>), breadcrumb (<span class="doc-code">chevron_right</span>), menu/close.</p>'
            f'<div class="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">{cells}</div>'
            '<p class="mt-4 rounded-card border border-line bg-sand p-4 text-[13px] text-body">Prototype only: these pages load the FULL Material Symbols font from Google Fonts (the self-hosted subset lacks most icons). At implementation the subset is regenerated with only the icons actually used (see fonts.css header).</p>')

sample_art=('<div class="ds-article"><h2>Kde vznikajú problémy s nevysporiadanými pozemkami?</h2>'
 '<p>Nevysporiadané vlastnícke vzťahy sa netýkajú iba jednotlivých rodinných domov či garáží. Často sa vyskytujú aj pri rozsiahlejších nehnuteľnostiach, ktoré pozostávajú z viacerých stavieb a pozemkov.</p>'
 '<h3>Pozemky zapísané na zosnulé osoby</h3><p>Na listoch vlastníctva sa často nachádzajú osoby, ktoré <strong>zomreli pred desiatkami rokov</strong>, pričom pozemky neboli predmetom dedičského konania alebo ich právni nástupcovia nie sú známi.</p>'
 '<ul><li>identifikácia právnych nástupcov,</li><li>riešenie dedičských otázok,</li><li>dodatočné konania o dedičstve.</li></ul>'
 '<p>Viac o postupe nájdete v časti <a href="#">Ako prebieha vysporiadanie pozemkov</a>.</p></div>')

MOCKUPS=[("Domov","domov"),("O nás","o-nas"),("Služby","sluzby"),("Vysporiadanie pozemkov","vysporiadanie-pozemkov"),("Pod stavbami","pozemky-pod-stavbami"),
 ("Nehnuteľnosti","nehnutelnosti-a-development"),("Zmluvná agenda","zmluvna-agenda"),("Občianske právo","obcianske-pravo"),("Obchodné právo","obchodne-pravo"),
 ("Riešenie sporov","riesenie-sporov"),("Články","clanky"),("Článok","clanok"),("Vyhľadávanie","vyhladavanie"),("Kontakt","kontakt")]

def build():
    h=head("Design system | Noveris Legal (prototype)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    anchors=[("Colours","#colours"),("Typography","#typography"),("Spacing","#spacing"),("Icons","#icons"),("Header","#c-header"),("Hero","#c-hero"),("Cards","#c-cards"),("Steps","#c-steps"),("Bands","#c-bands"),("Footer","#c-footer"),("Articles","#c-articles"),("Forms","#c-forms")]
    b+=('<div class="sticky top-0 z-50 bg-forest text-white"><div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-2.5 lg:px-8">'
      '<span class="font-headline text-[1.125rem]">Noveris Legal <span class="text-copper-light">design system</span></span>'
      '<nav class="flex flex-wrap items-center gap-x-5 gap-y-1 font-label text-[13px] font-medium" aria-label="Stránky prototypu">'
      '<a href="/design-system/" aria-current="page" class="border-b border-copper-light pb-0.5">Design system</a>'
      + ''.join(f'<a href="/design-system/mockups/{f}.html" class="hover:text-copper-light">{t}</a>' for t,f in MOCKUPS) + '</nav></div>'
      '<div class="border-t border-white/15"><nav class="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-6 py-1.5 font-label text-[12px] text-white/85 lg:px-8" aria-label="Sekcie">'
      + ''.join(f'<a href="{h_}" class="whitespace-nowrap hover:text-copper-light">{t}</a>' for t,h_ in anchors) + '</nav></div></div>')
    b+='<main class="mx-auto max-w-7xl px-6 pb-24 pt-12 lg:px-8">'
    b+=('<p class="font-label text-[12px] font-semibold uppercase tracking-[0.16em] text-copper">Review prototype (noindex)</p>'
      '<h1 class="mt-2 font-headline text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-ink">Design system</h1>'
      '<p class="mt-4 max-w-3xl text-[17px] leading-relaxed text-body">Warm cream pages, dark forest green for actions and the contact band, copper for eyebrows, icons and links; Newsreader + Manrope; denser spacing than the current site. Everything on this page is rendered with the real compiled Tailwind classes shown beside each component. UI labels in this document are English; sample content is Slovak.</p>')
    # colours
    b+=h2("colours","Colours","Copper was darkened from the mockup value #9a5f3c to #8f5535: the original gave only 4.38:1 on the sand band; the new value gives 5.07:1 on sand, 5.68:1 on paper and 5.97:1 on white. Gold #735c00 and the brown satin gradient are retired.")+swatches()
    b+=('<div class="mt-6 rounded-card border border-line bg-card p-5 text-[14px]"><p class="font-semibold text-ink">Measured WCAG contrast (all small-text pairs must be 4.5:1 or more)</p><ul class="mt-2 grid gap-1 md:grid-cols-2">'
      +''.join(f'<li>{a}: <b class="text-ink">{cr(x,y):.2f}:1</b></li>' for a,x,y in [("body on paper","#4a4740","#fbf9f5"),("body on sand","#4a4740","#f0ece6"),("body on white","#4a4740","#ffffff"),("muted on paper","#6f6a60","#fbf9f5"),("muted on sand","#6f6a60","#f0ece6"),("muted on white","#6f6a60","#ffffff"),("copper on paper","#8f5535","#fbf9f5"),("copper on sand","#8f5535","#f0ece6"),("copper on white","#8f5535","#ffffff"),("copper on chip","#8f5535","#f1ece5"),("white on forest","#ffffff","#17302b"),("white/90 on forest (approx.)","#ffffff","#17302b"),("copper-light on forest","#e0b08a","#17302b"),("ink on paper","#1c2420","#fbf9f5"),("forest numerals on sand-deep","#17302b","#e7ded1"),("danger on white","#b3261e","#ffffff")])
      +'</ul></div>')
    b+=h2("typography","Typography")+typo()
    b+=h2("spacing","Spacing, radius, shadow")+spacing()
    b+=h2("icons","Icons")+icons()
    # components
    b+=h2("components","Components","Each component: live rendering, when to use it, and the exact markup (expand the snippet).")
    b+=comp("c-eyebrow","Eyebrow","above every section title (H2) and in the hero-less intro areas; copper on light, copper-light on forest.",
            f'<div class="space-y-3">{eyebrow("Naše služby")}<div class="bg-forest p-3">{eyebrow("Kontakt",True)}</div></div>')
    b+=comp("c-buttons","Buttons","primary = main call to action (one per view); outline = secondary; on-dark = on the forest band; text link = inline navigation to a deeper page.",
      '<div class="flex flex-wrap items-center gap-4">'+btn_primary("Dohodnite si konzultáciu")+btn_secondary("Naše služby")+'<span class="bg-forest p-3">'+btn_dark("Dohodnite si konzultáciu")+'</span>'+link_arrow("Viac o službe")+'</div>',
      notes="Hover: primary darkens to forest-dark, outline fills with forest, text-link arrow slides right. Focus: 2px copper outline, 2px offset (global in ds.css). Tab through to check.")
    b+=comp("c-hero-docs","Breadcrumb and language switch","breadcrumb on every sub-page inside the hero; language switch in the header (EN | SK).",
      breadcrumb([("Domov","/"),("Služby","/sluzby/"),("Vysporiadanie pozemkov a vlastníckych vzťahov","#")])+'<div class="mt-5">'+lang_switch()+'</div>')
    b+=comp("c-chip","Icon chip","behind every icon that introduces a card, list item or contact.",'<div class="flex gap-4">'+chip("account_balance")+chip("person")+chip("groups")+chip("description")+'</div>')
    # header
    b+=h2("c-header","Navigation and header")
    b+=comp("c-site-header","Site header (desktop)","every page; sticky. Quiet sentence-case Manrope 14px medium, copper 2px underline on the active item, hairline bottom border. Below 1024px the links collapse into the hamburger.",header("Služby"),pad=False)
    b+=comp("c-drawer","Mobile drawer (open state)","shown after tapping the hamburger below 1024px; slides in from the right over a dimmed backdrop (see the mockup page at 390px for the live behaviour).",
      f'<div class="relative h-[560px] bg-ink/40"><div class="absolute right-0 top-0 h-full">{drawer_panel("Služby")}</div></div>',pad=False)
    # hero
    b+=h2("c-hero","Hero and section header")
    hero_html=hero("farm2",[("Domov","/"),("Služby","/sluzby/"),("Vysporiadanie pozemkov a vlastníckych vzťahov","#")],"Vysporiadanie pozemkov a vlastníckych vzťahov",
      ["Nevysporiadané vlastnícke vzťahy môžu komplikovať predaj, výstavbu aj ďalšie využívanie nehnuteľností."],
      "Pomáhame jednotlivcom, obchodným spoločnostiam a investorom pri vysporiadaní pozemkov a riešení komplikovaných vlastníckych vzťahov.",
      "Každý prípad posudzujeme s ohľadom na právny stav nehnuteľností a možnosti dosiahnutia požadovaného usporiadania vlastníctva.","Dohodnite si konzultáciu")
    b+=comp("c-hero-main","Page hero with photo fade","top of every service page: breadcrumb, H1, intro, bold sentence, CTA. On desktop the photo sits right and dissolves into the page (CSS mask <span class=\"doc-code\">.fade-photo</span> in ds.css); on mobile it is a strip above the text.",hero_html,pad=False)
    b+=comp("c-section-header","Section header","opens each content section: eyebrow + H2 on the left, optional short note on the right.",
      section_header("Ako postupujeme","Ako prebieha vysporiadanie pozemkov?","Každý prípad posudzujeme s ohľadom na právny stav nehnuteľností.")+'')
    # cards
    b+=h2("c-cards","Cards")
    b+=comp("c-card-side","Service card with side image","long text cards (2 per row on desktop); image right, on mobile on top. Optional text link at the bottom. Linked tiles: photo and title are links; hovering the card zooms the photo (scale 1.03, 500 ms), turns the title copper and moves the arrow.",
      '<div class="grid gap-5 lg:grid-cols-2">'+card_side(*CARDS[1])+card_side(*CARDS[5])+'</div>')
    b+=comp("c-card-top","Service card with top image","services in 3 columns (e.g. contract agenda).",
      '<div class="grid gap-5 md:grid-cols-3">'+card_top("description","Príprava zmlúv",["Pripravujeme zmluvy podľa povahy konkrétneho právneho vzťahu a požiadaviek klienta."],"plan2")
      +card_top("person","Pozemky zapísané na zosnulé osoby",["Pomáhame pri preverovaní vlastníckej histórie a identifikácii právnych nástupcov."],"cem2")
      +card_top("account_balance","Pozemky so Slovenským pozemkovým fondom",["Zastupujeme klientov pri rokovaniach so SPF a príslušnými správcami štátneho majetku."],"gov")+'</div>')
    b+=comp("c-card-compact","Compact area card (5-up)","short lists of types or areas: 5 columns on desktop, 3 on tablet, 2 on mobile.",
      '<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">'+card_compact("factory","Výrobné a priemyselné areály","Výrobné haly, dielne, prevádzkové budovy.","ware")+card_compact("apartment","Iné prevádzkové areály","Nehnuteľnosti využívané na podnikateľskú činnosť.","off")+card_compact("map","Poľnohospodárske areály","Hospodárske budovy, sklady, dvory.","farm2")+card_compact("account_balance","Štátne pozemky","Pozemky vo vlastníctve štátu.","gov")+card_compact("person","Zosnulí vlastníci","Pozemky zapísané na zosnulé osoby.","cem2")+'</div>')
    b+=comp("c-card-icon","Icon-only service card (services overview)","the /sluzby/ overview: icon chip, title, summary, \"Viac o službe\" link; no photo.",
      '<div class="grid gap-5 md:grid-cols-3">'+card_icon("account_balance","Vysporiadanie pozemkov a vlastníckych vzťahov","Pomáhame jednotlivcom, obchodným spoločnostiam a investorom pri vysporiadaní pozemkov.","#")
      +card_icon("description","Zmluvná agenda","Pomáhame pri príprave, posudzovaní a vyjednávaní zmlúv.","#")+card_icon("balance","Riešenie sporov","Zastupujeme klientov pri riešení sporov a v súdnych konaniach.","#")+'</div>')
    # steps
    b+=h2("c-steps","Process steps")
    b+=comp("c-steps-h","Process steps, horizontal","3 steps on a sand band: numbered circle, title, text, arrow between steps (md and up; stacked on mobile).",steps_h(STEPS),bg="bg-sand")
    b+=comp("c-steps-v","Process steps, vertical list","narrow column next to other content; circles joined by a hairline.",'<div class="max-w-xl">'+steps_v(STEPS)+'</div>')
    # bands
    b+=h2("c-bands","Bands and text sections")
    b+=comp("c-split-r","Split band, image right (fading)","a single topic with a supporting photo; photo dissolves toward the text.",
      split_band("Náročné prípady","Keď vysporiadanie pozemkov vyžaduje komplexnejší právny postup",["Niektoré vlastnícke problémy možno vyriešiť dohodou s vlastníkom. Iné si vyžadujú podrobné preverenie historických dokumentov a posúdenie viacerých právnych režimov."],"farm1",link_arrow("Viac o vysporiadaní pozemkov"),side="right"),pad=False)
    b+=comp("c-split-l","Split band, image left (fading)","same, mirrored; also used for the cost section in the mockup.",
      split_band("Náklady","Koľko stojí vysporiadanie pozemku?",["Náklady na vysporiadanie závisia od konkrétnej situácie, najmä od počtu vlastníkov, rozsahu potrebného právneho preverovania a zvoleného postupu."],"pen",link_arrow("Viac o nákladoch na vysporiadanie pozemku"),side="left",bg="bg-paper"),pad=False)
    b+=comp("c-callout","Callout box","one highlighted statement.",callout("balance","Zameriavame sa aj na právne náročné prípady vysporiadania pozemkov, pri ktorých je potrebné preveriť historické vlastnícke vzťahy."))
    b+=comp("c-iconlist","Icon list","short enumerations of related situations.",icon_list([("groups","Viacerí spoluvlastníci s rôzne veľkými podielmi."),("person","Zosnulé osoby alebo vlastníci, ktorých nemožno identifikovať."),("account_balance","Slovenský pozemkový fond a pozemky vo vlastníctve štátu."),("apartment","Pozemky zapísané na zaniknuté spoločnosti."),("description","Spochybnená hodnovernosť údajov katastra.")]))
    b+=comp("c-twocol","Two-column text section","two parallel topics side by side (stack on mobile).",two_col("Prečo vznikajú nevysporiadané pozemky?","Dôvody sú často historické",'<p>Pri starších stavbách a areáloch môžu vlastnícke vzťahy vychádzať ešte z obdobia, keď pozemky užívali štátne podniky, družstvá alebo iné organizácie.</p>',"Aké vlastnícke problémy riešime?","Rôzne vlastnícke vzťahy",'<p>Pri rozsiahlejších areáloch sa tieto problémy často kombinujú, preto je potrebné posúdiť jednotlivé parcely vo vzájomných súvislostiach.</p>'))
    b+=comp("c-related","Related-service band","pointer from one service to a connected one, at the end of a content section.",
      related_band("Súvisiaca služba","Vysporiadanie pozemkov pod stavbami a v areáloch","Vlastník budovy nemusí byť zároveň vlastníkom pozemku pod ňou.",link_arrow("Viac o vysporiadaní pozemkov pod stavbami a v areáloch"),"ware"))
    b+=comp("c-quote","Quote block","a pull quote or key statement inside articles / about page.",quote("Každý prípad posudzujeme s ohľadom na právny stav nehnuteľností a možnosti dosiahnutia požadovaného usporiadania vlastníctva.","Noveris Legal"))
    b+=comp("c-contact-band","Closing contact band","last block before the footer on every page: forest green, copper-light eyebrow, white-on-dark button. The photo (desktop) fades into the green.",
      contact_band("Potrebujete vysporiadať pozemok?",["Ak máte nevysporiadané vlastnícke vzťahy k pozemku alebo potrebujete preveriť možnosti ich riešenia, obráťte sa na nás.","Po oboznámení sa s Vašou situáciou posúdime možnosti ďalšieho právneho postupu."],"Dohodnite si konzultáciu"),pad=False)
    b+=h2("c-footer","Footer")+comp("c-footer-c","Footer (3 columns)","every page. Real contact details only.",footer(),pad=False)
    b+=h2("c-articles","Articles")
    b+=comp("c-article-tile","Article tile (restyled)","the /clanky/ list and related-article rows. Linked tiles: photo and title are links; hovering the card zooms the photo (scale 1.03, 500 ms), turns the title copper and moves the arrow.",
      '<div class="grid gap-5 md:grid-cols-3">'+article_tile("farm1","20. 10. 2026","Koľko stojí vysporiadanie pozemku","Od čoho závisí cena, s akými výdavkami na právne služby, geodeta, znalca a poplatky počítať a kedy je dohoda lacnejšia ako súd.")
      +article_tile("cem2","20. 10. 2026","Neprededené pozemky po rodičoch","Ako zistiť, ktoré pozemky v dedičstve chýbajú, ako prebieha dodatočné konanie a čo ak medzičasom zomreli ďalší dedičia.")+'</div>')
    b+=comp("c-article-body","Article body typography","long-form article text (class .ds-article in ds.css; replaces .article-body). 16px / 1.7, copper links, copper list markers.",'<div class="max-w-2xl">'+sample_art+'</div>')
    b+=h2("c-reviews","Reviews")
    b+=comp("c-reviews-band","Reviews band, variant A: moving cards","home page, between the latest articles and the closing contact band (content/reviews.json field variant = a, the default). White cards with a round initial avatar slide slowly; pause button, pauses on hover/focus, still swipeable row for reduced motion. Renders only when reviews.json has reviews; demo data only with NOVERIS_DEMO_REVIEWS=1. Samples are placeholder text, not real reviews.",
      reviews_band([("Meno P.",5,"Ukážkový text recenzie. Skutočné recenzie sa berú z Google a nikdy sa nevymýšľajú."),("Meno Q.",4,"Druhý ukážkový text, o niečo dlhší, aby bolo vidieť zalamovanie riadkov, hviezdičky a pätu s menom a zdrojom."),("Meno R.",5,"Tretí ukážkový text pre rad.")]),pad=False)
    b+=comp("c-reviews-b","Reviews band, variant B: editorial quote","variant = b. One review at a time in Newsreader italic, cross-fade every 7 s, arrows, dots and pause button; reduced motion: no auto-advance.",
      reviews_band_b("Ukážkový text recenzie. Skutočné recenzie sa berú z Google a nikdy sa nevymýšľajú.","Meno P."),pad=False)
    b+=comp("c-reviews-c","Reviews band, variant C: rating panel + two rows","variant = c. Sand rating panel on the left, two borderless quote rows moving in opposite directions (about 9 s per review), pause button; reduced motion: one still swipeable row.",
      reviews_band_c([("Meno P.",5,"Ukážkový text recenzie. Skutočné recenzie sa berú z Google a nikdy sa nevymýšľajú."),("Meno Q.",4,"Druhý ukážkový text, o niečo dlhší, aby bolo vidieť zalamovanie riadkov, hviezdičky a pätu s menom a zdrojom."),("Meno R.",5,"Tretí ukážkový text pre rad.")]),pad=False)
    b+=h2("c-forms","Forms")+comp("c-form","Form card","contact page. Fields: 1px field border, 4px radius, forest focus ring; the e-mail field shows the error state (red text + border + icon, linked by aria-describedby).",form_card(),bg="bg-sand")
    b+='</main>'+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'index.html','w').write(h+b)
build()
