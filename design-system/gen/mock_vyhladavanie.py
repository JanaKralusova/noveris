from comp_owners import *
ROOT='/Users/mbr/projects/noveris/design-system/'
NB=' '
STATS=f"4{NB}951{NB}162 záznamov · 3{NB}520 katastrálnych území · stav k 30. 6. 2026"
SPF="https://pozfond.sk/verejny-pristup-k-informaciam/zoznam-nezistenych-vlastnikov/"
def hl(t):  # highlight 'Bruchat' at the start of words
    import re
    return re.sub(r'(?i)\b(bruchat)', lambda m: mark(m.group(1)), t)
# id, area, code, name, note, LVs, selected
R=[(157481,"Čeľadince","809101","Bruchatá Verona r. Španková","","408",False),
   (1046092,"Prašice","849171","BRUCHATÁ Katarína r. Herdová","","1946",False),
   (1046093,"Prašice","849171","BRUCHATÁ Mária r. Mališová","","3505",False),
   (1046094,"Prašice","849171","BRUCHATÁ Mária r. Mráziková","zomrela 15.7.1986","2092, 3517",False),
   (1046095,"Prašice","849171","BRUCHATÁ Mária r. Novotná","manž.Štefan zomrela 28.5.1957","434, 1405, 1562, 1563, 1571, 2076, 2686, 3876",True),
   (1046098,"Prašice","849171","BRUCHATÝ Štefan","ž.Mária Novotná zomrel 4.11.1970","1606, 1607, 2234, 2345, 3388",True)]
cards="".join(result_card(i,a,c,hl(n),hl(no),"LV č. "+lv,on) for i,a,c,n,no,lv,on in R)
sel=[r for r in R if r[6]]
sel_html="".join(selected_item(n,f"k. ú. {a} · LV č. {lv}") for i,a,c,n,no,lv,on in sel)
msg="Dobrý deň,\n\nv zozname nezistených vlastníkov na noveris.sk som vyhľadával(a) „Bruchat“ a našiel(a) som tieto záznamy:\n"+"\n".join(f"• {n} ({no}) – k. ú. {a} ({c}), LV č. {lv}" for i,a,c,n,no,lv,on in sel)+"\n\nMám záujem o pomoc s vysporiadaním. Prosím o konzultáciu.\n\nĎakujem"
fields=('<div class="grid gap-5 sm:grid-cols-2">'+text_field("owners-name","Meno a priezvisko","Ján Nový",value="",extra='name="name" required autocomplete="name"')
  +text_field("owners-phone","Telefón","+421",typ="tel",extra='name="phone" autocomplete="tel"')+'</div>'
  +text_field("owners-email","E-mail","jan.novy@email.sk",typ="email",extra='name="email" required autocomplete="email"')
  +labeled_select("owners-relation","Váš vzťah k vlastníkovi",["Som potomok / dedič","Som spoluvlastník pozemku","Chcem pozemok kúpiť","Iné"],cls=""))
panel=request_panel("Vyberte záznamy, ktoré Vás zaujímajú, a odošlite nám ich spolu s vašimi kontaktnými údajmi.","Mgr. Jana Králusová, advokátka","/assets/photos/avatar.jpg",
  sel_html,len(sel),fields,msg,"Odoslať advokátke","",
  'Odoslaním súhlasíte so spracovaním údajov podľa <a href="/ochrana-osobnych-udajov/" class="text-copper underline underline-offset-2">zásad ochrany osobných údajov</a>.')
STEPS=[("Vyhľadajte vlastníka","Zadajte priezvisko predka, katastrálne územie alebo číslo listu vlastníctva. Vyhľadávanie zahŕňa aj rodné priezviská a údaje uvedené v poznámkach."),
("Vyberte nájdené záznamy","Ak nájdete záznamy, ktoré by mohli súvisieť s vašou rodinou, pridajte ich do žiadosti."),
("Odošlite žiadosť advokátke","Vybrané záznamy nám môžete odoslať spolu s kontaktnými údajmi. Na základe vašej žiadosti vás budeme kontaktovať ohľadom možností ďalšieho právneho postupu.")]
def build():
    h=head("Vyhľadávanie vlastníkov | Noveris Legal (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("Vyhľadávanie vlastníkov",True)+drawer_overlay("Vyhľadávanie vlastníkov")+'<main>'
    b+=('<section class="bg-paper"><div class="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-8 lg:pb-12 lg:pt-14"><div class="max-w-3xl">'
      +eyebrow("Nezistení vlastníci · údaje SPF k 30. 6. 2026")+
      '<h1 class="mt-4 font-headline text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-ink">Patrí pozemok <span class="italic text-copper">vašej rodine?</span></h1>'
      '<div class="mt-5 space-y-3"><p class="text-[15px] leading-[1.6] text-body md:text-[16px]">Na Slovensku sa nachádzajú pozemky, ktorých vlastníci nie sú dostatočne identifikovaní alebo nie je známe ich miesto pobytu. Medzi týmito vlastníkmi môžu byť aj vaši predkovia, po ktorých zostali nevysporiadané pozemky.</p>'
      '<p class="text-[15px] font-bold leading-[1.6] text-ink md:text-[16px]">Vyhľadajte priezvisko svojho predka, katastrálne územie alebo číslo listu vlastníctva a zistite, či sa v zozname nezistených vlastníkov nachádzajú záznamy, ktoré môžu súvisieť s vašou rodinou.</p></div></div></div></section>')
    b+=section(section_header(None,"Ako vyhľadávanie funguje?")+steps_h(STEPS),bg="bg-sand")
    left=(search_field("Bruchat")+f'<p class="mb-5 mt-3 text-[13px] text-muted">{STATS}</p>'
      '<div id="owners-status" class="mb-4 min-h-[1.25rem] font-label text-[15px] font-semibold text-ink" role="status" aria-live="polite">28 výsledkov</div>'
      '<div id="owners-area-wrap" class="mb-5">'+labeled_select("owners-area","Katastrálne územie",["Všetky k. ú. (28)","Čeľadince (1)","Prašice (12)","Velušovce (11)","Závada (4)"])+'</div>'
      f'<div id="owners-results" class="space-y-3">{cards}</div>'
      f'<div class="mt-6 text-center"><button id="owners-more" type="button" class="{BTN} border border-forest text-forest hover:bg-forest hover:text-white">Zobraziť ďalšie (22 z 22)</button></div>'
      +source_note("Zdroj údajov",f'<p class="mt-2">Slovenský pozemkový fond – <a class="text-copper underline underline-offset-2" href="{SPF}" target="_blank" rel="noopener">Zoznam nezistených vlastníkov</a>, stav k 30. 6. 2026.</p>'
        '<p class="mt-2">Údaje preberáme bez obsahových úprav. Rozhodujúce sú aktuálne údaje evidované v katastri nehnuteľností. Noveris Legal nie je prevádzkovateľom zoznamu nezistených vlastníkov Slovenského pozemkového fondu.</p>'
        '<p class="mt-2"><b class="text-ink">Upozornenie:</b> Zhoda mena alebo priezviska sama osebe nepreukazuje totožnosť osoby, príbuzenský vzťah ani vlastnícke alebo dedičské právo k pozemku. Nájdené údaje je potrebné overiť v katastri nehnuteľností a ďalších dostupných dokumentoch.</p>'))
    b+=section('<div class="grid items-start gap-10 lg:grid-cols-12"><div class="min-w-0 lg:col-span-7">'+left+'</div><div class="lg:col-span-5">'+panel+'</div></div>',pad="py-10 md:py-14")
    b+=section(section_header(None,"Čo robiť, ak ste našli svojho predka?")+
      '<div class="max-w-3xl space-y-4"><p class="text-[15px] leading-[1.6] text-body md:text-[16px]">Ak sa v zozname nachádza osoba, o ktorej sa domnievate, že bola vaším predkom, je potrebné najskôr preveriť jej totožnosť, vlastnícke právo k pozemku a prípadné dedičské konania.</p>'
      '<p class="text-[15px] leading-[1.6] text-body md:text-[16px]">V závislosti od konkrétnych okolností môže byť potrebné napríklad dodatočné dedičské konanie alebo iný právny postup smerujúci k usporiadaniu vlastníckych vzťahov.</p>'
      '<p class="pt-1">'+link_arrow("Prečítajte si viac o možnostiach vysporiadania pozemkov a vlastníckych vzťahov.","vysporiadanie-pozemkov.html")+'</p></div>',bg="bg-sand")
    b+='</main>'+mobile_bar("Pokračovať k žiadosti (2)")+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/vyhladavanie.html','w').write(h+b)
build()
