from comp_site import *
local_photos()
ROOT='/Users/mbr/projects/noveris/design-system/'
def build():
    h=head("Kontakt | Noveris Legal (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("Kontakt",True)+drawer_overlay("Kontakt")+'<main>'
    b+=page_hero("Dôvera a zodpovednosť",f'Sme tu pre <br/>{em("vás")}',"„Každá komunikácia prebieha s dôrazom na dôveru a diskrétnosť.“")
    det=contact_details([("call","+421 915 622 518","tel:+421915622518"),("mail","kralusova@noveris.sk","mailto:kralusova@noveris.sk")],
      "https://www.linkedin.com/in/jana-kralusova/",
      [("Sídlo","Turčianska 42, 821 09 Bratislava, Slovensko"),("Identifikačné číslo","57 493 685"),
       ("Číslo zápisu v Slovenskej advokátskej komore",'<a href="https://www.sak.sk/en/lawyers/?sak_type=lawyers&amp;sak_id=8728" class="text-copper underline underline-offset-2">8728</a>')],
      "/assets/photos/contact.jpg","Mgr. Jana Králusová – kontaktný portrét","ADVOKÁTKA A ZAKLADATEĽKA","Mgr. Jana Králusová","Právne služby a poradenstvo")
    frm=contact_form("Napíšte nám","Máte otázku alebo hľadáte právne zastupovanie? Zanechajte nám správu a my sa vám ozveme.",
      '<a href="/ochrana-osobnych-udajov/" class="text-copper underline underline-offset-2">Odoslaním súhlasíte so spracovaním osobných údajov.</a>')
    b+=section(f'<div class="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16"><div>{det}</div>{frm}</div>'
      +'<div class="mt-12">'+wide_photo("/assets/other/bratislava.jpg","Letecký pohľad na Bratislavu – Noveris Legal sídli v centre mesta")+'</div>',pad="pb-12 md:pb-16")
    b+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/kontakt.html','w').write(relink(h+b))
build()
