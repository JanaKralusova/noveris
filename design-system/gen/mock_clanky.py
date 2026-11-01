import re
from comp_site import *
local_photos()
ROOT='/Users/mbr/projects/noveris/design-system/'
LIVE='/Users/mbr/projects/noveris/clanky/'
def rd(p): return open(p).read()
def tiles():
    s=rd(LIVE+'index.html'); m=re.search(r'<main.*?</main>',s,re.S).group(0)
    out=[]
    for a in re.finditer(r'<a href="(/clanky/[^"]+/)"[^>]*>(.*?)</a>',m,re.S):
        href,body=a.groups()
        src=re.search(r'<img src="([^"]+)"[^>]*alt="([^"]*)"',body).groups()
        t=re.search(r'<h2[^>]*>(.*?)</h2>',body,re.S).group(1).strip()
        x=re.search(r'<p(?:\s[^>]*)?>(.*?)</p>',body,re.S).group(1).strip()
        out.append(article_card(src[0],src[1],t,x,'clanok.html' if 'kolko-stoji' in href else href,"h2"))
    return out
def page(active_title,main,fname):
    h=head(active_title)
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'+header("Články",True)+drawer_overlay("Články")+'<main>'+main+'</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/'+fname,'w').write(relink(h+b))
def lst():
    t=tiles()
    m=page_hero("Články",f'Nehnuteľnosti, dedičstvo a {em("kataster")}',"Praktické články o vysporiadaní pozemkov, zápisoch na liste vlastníctva, dedičstve a spoluvlastníctve. Vysvetľujeme, čo jednotlivé situácie znamenajú a aké možnosti riešenia prichádzajú do úvahy.")
    m+=section('<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">'+"".join(t)+'</div>',pad="pb-12 md:pb-16")
    page("Články | Noveris Legal (mockup)",m,'clanky.html'); return len(t)
def art():
    s=rd(LIVE+'kolko-stoji-vysporiadanie-pozemku/index.html'); m=re.search(r'<main.*?</main>',s,re.S).group(0)
    start=m.index('<p>Cena za vysporiadanie'); end=m.rindex('</p>',0,m.index('<aside'))+4
    body=m[start:end]
    body=re.sub(r'<div class="[^"]*">\s*$','',body)
    toc=re.findall(r'<li><a href="#([^"]+)"[^>]*>(.*?)</a></li>',m)
    rel=m[m.index('id="related-heading"'):]
    rel_t=[]
    for a in re.finditer(r'<a href="(/clanky/[^"]+/)"[^>]*>(.*?)</a>',rel,re.S):
        href,bd=a.groups(); src=re.search(r'<img src="([^"]+)"[^>]*alt="([^"]*)"',bd).groups()
        rel_t.append(article_card(src[0],src[1],re.search(r'<h3[^>]*>(.*?)</h3>',bd,re.S).group(1).strip(),re.search(r'<p(?:\s[^>]*)?>(.*?)</p>',bd,re.S).group(1).strip(),href))
    ab=re.search(r'<p[^>]*>(Vo svojej advokátskej[^<]*)</p>',m).group(1)
    disc=re.search(r'<p[^>]*>(Článok má všeobecný[^<]*)</p>',m).group(1)
    head_=article_header(("Všetky články","/clanky/"),[("Domov","/"),("Články","/clanky/"),("Koľko stojí vysporiadanie pozemku?","")],
      "Koľko stojí vysporiadanie pozemku?","/assets/photos/avatar.jpg","Mgr. Jana Králusová, advokátka","/o-nas/","20. októbra 2026","2026-10-20",
      ["vysporiadanie pozemkov","náklady na vysporiadanie","geometrický plán","znalecký posudok","súdne vyporiadanie","Slovenský pozemkový fond"],
      "/assets/articles/kolko-stoji-vysporiadanie-pozemku-1024.jpg","Ruka vyberá bankovky z peňaženky nad stolom s dokumentmi")
    aside=author_box("/assets/photos/avatar.jpg","O autorke","Mgr. Jana Králusová","/o-nas/","advokátka, zakladateľka Noveris Legal",ab,"Viac o autorke",disc)
    main=(f'<article class="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">{head_}'
      f'<div class="mt-2 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14"><div class="max-w-[46rem]">{article_toc("Obsah článku",toc)}<div class="ds-article mt-8">{body}</div></div>'
      f'<div class="lg:pt-8">{aside}</div></div></article>')
    main+=contact_band("Potrebujete právnu konzultáciu?",["Kontaktujte nás a stručne opíšte vašu situáciu. Spoločne sa pozrieme na možnosti ďalšieho postupu."],"Dohodnúť konzultáciu")
    main+=section(section_header("Čítajte ďalej","Súvisiace články")+'<div class="grid gap-5 md:grid-cols-3 lg:gap-6">'+"".join(rel_t)+'</div>',bg="bg-sand")
    page("Koľko stojí vysporiadanie pozemku? | Noveris Legal (mockup)",main,'clanok.html')
print(lst()); art()
