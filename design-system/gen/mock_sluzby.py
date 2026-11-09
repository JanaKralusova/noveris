from comp import *
from comp_services import *
ROOT='/Users/mbr/projects/noveris/design-system/'
PH.update({'s_hero':'1726441741889-ebe90991e1e8','s_land':'1720155390935-f49e18525eb9','s_dev':'1658248709373-e1e4a79bc192',
 's_contract':'1631651693480-97f1132e333d','s_civil':'1741156386380-0236c72eb6f9','s_biz':'1740933084056-078fac872bff','s_court':'1783091478517-e6fb341b516e'})
SV=[("terrain","Vysporiadanie pozemkov a vlastníckych vzťahov","Vysporiadanie pozemkov s komplikovanými vlastníckymi vzťahmi vrátane prípadov so Slovenským pozemkovým fondom, zosnulými vlastníkmi, duplicitným vlastníctvom či zaniknutými spoločnosťami. Riešenie spoluvlastníckych vzťahov, sporného vlastníctva a nevysporiadaných pozemkov pod stavbami a v priemyselných, poľnohospodárskych či iných areáloch.","s_land","vysporiadanie-pozemkov.html"),
("domain","Nehnuteľnosti a development","Právne služby pri kúpe a predaji nehnuteľností, príprave a realizácii developerských projektov a investičných zámerov. Preverovanie právneho stavu nehnuteľností, príprava a revízia zmluvnej dokumentácie, nájomné vzťahy, vecné bremená, stavebné právo a riešenie právnych otázok súvisiacich s výstavbou.","s_dev","nehnutelnosti-a-development.html"),
("description","Zmluvná agenda","Príprava, posudzovanie a revízia zmlúv, vyjednávanie zmluvných podmienok a riešenie sporov vyplývajúcich zo zmluvných vzťahov.","s_contract","zmluvna-agenda.html"),
("balance","Občianske právo","Dedičské konania a spory o dedičstvo, náhrada škody, bezdôvodné obohatenie, zrušenie a vyporiadanie bezpodielového spoluvlastníctva manželov a ďalšie občianskoprávne záležitosti.","s_civil","obcianske-pravo.html"),
("business_center","Obchodné právo","Zakladanie a zmeny obchodných spoločností, korporátna agenda, zmluvná dokumentácia a likvidácia spoločností","s_biz","obchodne-pravo.html"),
("gavel","Riešenie sporov","Mimosúdne a súdne riešenie sporov, vymáhanie pohľadávok a zastupovanie v súdnych a správnych konaniach.","s_court","riesenie-sporov.html")]
def build():
    h=head("Služby | Noveris Legal (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("Služby",True)+drawer_overlay("Služby")+'<main>'
    b+=hero_label("Právna expertíza","s_hero",[("Domov","/"),("Služby","#")],"Riešenia založené na dôvere a odbornosti",
      ["V Noveris Legal pristupujeme ku každej veci individuálne, s dôrazom na jej dôsledné posúdenie a jasný postup. Cieľom je, aby klient vedel, aké má možnosti a čo môže očakávať."],
      cta=None)
    b+=section(quote("„Právo nemá byť prekážkou, ale oporou pri ďalších krokoch.“",""),bg="bg-sand",pad="py-10 md:py-12")
    cards="".join(card_side(i,t,[d],p,link_arrow("Viac o službe",u)) for i,t,d,p,u in SV)
    b+=section(section_header(None,"Naše služby")+f'<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">{cards}</div>')
    b+=contact_band("Potrebujete právnu konzultáciu?",["Kontaktujte nás a stručne opíšte vašu situáciu. Spoločne sa pozrieme na možnosti ďalšieho postupu."],"Dohodnúť konzultáciu")
    b+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/sluzby.html','w').write(h+b)
build()
