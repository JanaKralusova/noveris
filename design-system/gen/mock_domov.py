from comp_site import *
local_photos()
ROOT='/Users/mbr/projects/noveris/design-system/'
SVC=[("landscape","Vysporiadanie pozemkov a vlastníckych vzťahov","Vysporiadanie pozemkov s komplikovanými vlastníckymi vzťahmi vrátane prípadov so Slovenským pozemkovým fondom, zosnulými vlastníkmi, duplicitným vlastníctvom či zaniknutými spoločnosťami. Riešenie spoluvlastníckych vzťahov, sporného vlastníctva a nevysporiadaných pozemkov pod stavbami a v priemyselných, poľnohospodárskych či iných areáloch.","vysporiadanie-pozemkov.html"),
("domain","Nehnuteľnosti a development","Právne služby pri kúpe a predaji nehnuteľností, príprave a realizácii developerských projektov a investičných zámerov. Preverovanie právneho stavu nehnuteľností, príprava a revízia zmluvnej dokumentácie, nájomné vzťahy, vecné bremená, stavebné právo a riešenie právnych otázok súvisiacich s výstavbou.","nehnutelnosti-a-development.html"),
("description","Zmluvná agenda","Príprava, posudzovanie a revízia zmlúv, vyjednávanie zmluvných podmienok a riešenie sporov vyplývajúcich zo zmluvných vzťahov.","zmluvna-agenda.html"),
("balance","Občianske právo","Dedičské konania a spory o dedičstvo, náhrada škody, bezdôvodné obohatenie, zrušenie a vyporiadanie bezpodielového spoluvlastníctva manželov a ďalšie občianskoprávne záležitosti.","obcianske-pravo.html"),
("business_center","Obchodné právo","Zakladanie a zmeny obchodných spoločností, korporátna agenda, zmluvná dokumentácia a likvidácia spoločností","obchodne-pravo.html"),
("gavel","Riešenie sporov","Mimosúdne a súdne riešenie sporov, vymáhanie pohľadávok a zastupovanie v súdnych a správnych konaniach.","riesenie-sporov.html")]
ART=[("kolko-stoji-vysporiadanie-pozemku","Ruka vyberá bankovky z peňaženky nad stolom s dokumentmi","Koľko stojí vysporiadanie pozemku?","Cena za vysporiadanie pozemku sa neodvíja iba od jeho výmery. Odkúpenie podielu od jedného vlastníka môže vyžadovať podstatne menej krokov než usporiadanie malej záhrady, pri ktorej treba dohľadať dedičov po viacerých generáciách.","clanok.html"),
("vysporiadanie-pozemku-pod-cestou","Kľukatá asfaltová cesta medzi stromami a vinicou","Vlastníte pozemok pod cestou? Aké máte možnosti vysporiadania?","Cez parcelu, ktorú ste zdedili, vedie obecná ulica alebo cesta medzi obcami. V katastri ste stále vlastníkom, no pozemok užívajú vodiči a o prípadnom odkúpení s vami nikto nerokuje. Môžete žiadať vysporiadanie alebo náhradu za jeho užívanie?","/clanky/vysporiadanie-pozemku-pod-cestou/"),
("kupna-zmluva-na-pozemok","Staršia dvojica a muž v obleku si podávajú ruky pred domom","Kúpna zmluva na pozemok: Čo má obsahovať a na čo si dať pozor?","Pri kúpe pozemku nemusíte získavať celú parcelu. Predmetom predaja môže byť aj spoluvlastnícky podiel alebo časť pozemku, ktorú treba najprv oddeliť geometrickým plánom. Od toho závisí, s kým zmluvu uzatvárate a čo v nej treba upraviť.","/clanky/kupna-zmluva-na-pozemok/")]
def build():
    h=head("Noveris Legal – Právo, ktoré dáva zmysel (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("Domov",True)+drawer_overlay("Domov")+'<main>'
    b+=home_hero("Advokátska kancelária",f'Právo, ktoré <br/>{em("dáva zmysel")}',
      "Spájame právnu precíznosť s ľudským prístupom. Pomáhame klientom orientovať sa v právnych vzťahoch a nachádzať riešenia, ktoré sú zrozumiteľné a dlhodobo udržateľné.",
      btn_primary("Dohodnúť konzultáciu","/kontakt/")+link_arrow("Naša filozofia","/o-nas/"),
      "/assets/other/desk.jpg","Advokátska kancelária Noveris Legal – elegantný pracovný stôl s právnickou knihou",
      "„Právo nie je len o pravidlách, ale o riešeniach, ktoré umožňujú rast“","Jana Králusová, Zakladateľka")
    b+=section(portrait_split("Osobný prístup",f'Aby ste vedeli, na čom {em("ste")}',
      "Právne otázky vedia byť zložité. To však neznamená, že musia byť nejasné. Klient by mal vždy rozumieť svojej situácií a tomu, aké má možnosti. Preto vysvetľujem veci priamo, bez právnického jazyka a navrhujem riešenia, ktorú sú využiteľné v praxi.",
      "/assets/photos/home.jpg","Mgr. Jana Králusová – osobný prístup ku klientom","Mgr. Jana Králusová","advokátka"),bg="bg-sand")
    cards="".join(card_icon(i,t,d,h) for i,t,d,h in SVC)
    b+=section(section_header("Naše služby",f'Kde spájame znalosti s {em("praxou")}')+f'<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">{cards}</div>'
      f'<div class="mt-10 text-center">{btn_secondary("Zobraziť všetky oblasti poradenstva","/sluzby/")}</div>')
    tiles="".join(article_card(f"/assets/articles/{s}-800.jpg",a,t,x,hr) for s,a,t,x,hr in ART)
    b+=section(section_header("Články",f'Praktické články o {em("pozemkoch")}')+f'<div class="grid gap-5 md:grid-cols-3 lg:gap-6">{tiles}</div>'
      f'<div class="mt-10 text-center">{btn_secondary("Všetky články","/clanky/")}</div>',bg="bg-sand")
    b+=contact_band("Potrebujete právnu konzultáciu?",["Kontaktujte nás a stručne opíšte vašu situáciu. Spoločne sa pozrieme na možnosti ďalšieho postupu."],"Dohodnúť konzultáciu")
    b+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/domov.html','w').write(relink(h+b))
build()
