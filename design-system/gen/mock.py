from comp import *
PH.update({'hero_eu':'1658069190964-26b81b34417b','pen':'1732408425578-464d66066441'})
ROOT='/Users/mbr/projects/noveris/design-system/'
CARDS=[
 ("account_balance","Pozemky so Slovenským pozemkovým fondom a vo vlastníctve štátu",
  ["Na liste vlastníctva môže byť uvedený Slovenský pozemkový fond (SPF), ktorý v zákonom stanovených prípadoch nakladá s pozemkami vo vlastníctve štátu alebo nezistených vlastníkov. Možnosti ich vysporiadania závisia od právneho režimu pozemku a splnenia zákonných podmienok.",
   "Preverujeme možnosti nadobudnutia pozemkov a spoluvlastníckych podielov a zastupujeme klientov pri rokovaniach so SPF a príslušnými správcami štátneho majetku."],"gov",None),
 ("person","Pozemky zapísané na zosnulé osoby",
  ["Na listoch vlastníctva sa často nachádzajú osoby, ktoré zomreli pred desiatkami rokov, pričom pozemky neboli predmetom dedičského konania alebo ich právni nástupcovia nie sú známi.",
   "Pomáhame pri preverovaní vlastníckej histórie, identifikácii právnych nástupcov a riešení dedičských otázok vrátane dodatočných konaní o dedičstve."],"cem1",None),
 ("groups","Pozemky s viacerými spoluvlastníkmi",
  ["Niektoré pozemky majú desiatky spoluvlastníkov s rôzne veľkými podielmi. Časť vlastníkov môže byť známa, ďalší už nežijú alebo ich nemožno spoľahlivo identifikovať.",
   "Posudzujeme možnosti odkúpenia spoluvlastníckych podielov, uzatvorenia dohôd a zrušenia a vyporiadania podielového spoluvlastníctva vrátane súdneho konania."],"farm1",None),
 ("description","Duplicitné vlastníctvo a spochybnená hodnovernosť údajov katastra",
  ["V katastri nehnuteľností sa môžu vyskytnúť prípady duplicitného zápisu vlastníckeho práva alebo poznámky o spochybnení hodnovernosti údajov katastra.",
   "Preverujeme vlastnícke zápisy a listinné podklady, na základe ktorých vznikli alebo boli evidované vlastnícke práva, a posudzujeme možnosti odstránenia právnej neistoty vrátane súdneho riešenia."],"plan1",None),
 ("apartment","Pozemky zapísané na zaniknuté spoločnosti",
  ["Vlastníkom pozemku môže byť podľa listu vlastníctva spoločnosť, ktorá už bola vymazaná z obchodného registra.",
   "V takýchto prípadoch preverujeme okolnosti zániku spoločnosti a možnosti usporiadania vlastníckych vzťahov, napríklad prostredníctvom dodatočnej likvidácie, ak sú na to splnené zákonné podmienky."],"off",None),
 ("factory","Pozemky pod stavbami a v areáloch",
  ["Vlastník budovy nemusí byť zároveň vlastníkom pozemku pod ňou. Tento stav sa vyskytuje pri rodinných domoch, garážach, ale aj pri výrobných halách, skladových budovách, hospodárskych objektoch či rozsiahlych prevádzkových areáloch.",
   "Pomáhame pri preverení právneho vzťahu medzi vlastníkom stavby a pozemku a pri posúdení možností majetkovoprávneho usporiadania pozemkov pod stavbami aj ďalších pozemkov potrebných na fungovanie areálu."],"ware",
  link_arrow("Viac o vysporiadaní pozemkov pod stavbami a v areáloch","pozemky-pod-stavbami.html")),
]
STEPS=[("Preverenie vlastníckych vzťahov","Preskúmame aktuálne údaje katastra nehnuteľností, dostupné historické podklady a ďalšie relevantné dokumenty. Identifikujeme vlastnícke problémy a právne prekážky, ktoré je potrebné riešiť."),
("Návrh právneho postupu","Na základe zistených skutočností posúdime možnosti vysporiadania. Podľa okolností môže ísť napríklad o odkúpenie pozemkov alebo spoluvlastníckych podielov, dedičské konanie, dohodu spoluvlastníkov, postup vo vzťahu k SPF alebo súdne konanie."),
("Právne zastupovanie","Zabezpečujeme prípravu právnych dokumentov, rokovania s vlastníkmi a príslušnými inštitúciami, ako aj zastupovanie v súdnych a ďalších konaniach podľa povahy prípadu.")]

def build():
    h=head("Vysporiadanie pozemkov a vlastníckych vzťahov | Noveris Legal (mockup)")
    body='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    body+=header("Služby",True)+drawer_overlay("Služby")+'<main>'
    body+=hero("hero_eu",[("Domov","/"),("Služby","/sluzby/"),("Vysporiadanie pozemkov a vlastníckych vzťahov","/sluzby/vysporiadanie-pozemkov/")],
      "Vysporiadanie pozemkov a vlastníckych vzťahov",
      ["Nevysporiadané vlastnícke vzťahy môžu komplikovať predaj, výstavbu aj ďalšie využívanie nehnuteľností. Na liste vlastníctva môžu byť zapísané zosnulé osoby, Slovenská republika, desiatky spoluvlastníkov alebo vlastníci, ktorých nemožno identifikovať. Problémom môžu byť aj sporné vlastnícke zápisy či pozemky evidované na zaniknuté spoločnosti."],
      "Pomáhame jednotlivcom, obchodným spoločnostiam a investorom pri vysporiadaní pozemkov a riešení komplikovaných vlastníckych vzťahov.",
      "Každý prípad posudzujeme s ohľadom na právny stav nehnuteľností a možnosti dosiahnutia požadovaného usporiadania vlastníctva.","Dohodnite si konzultáciu")
    cards="".join(card_side(*c) for c in CARDS)
    body+=section(section_header("Naše služby","S akými vlastníckymi problémami pomáhame?")+f'<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">{cards}</div>')
    body+=section(section_header("Ako postupujeme","Ako prebieha vysporiadanie pozemkov?")+steps_h(STEPS),bg="bg-sand")
    body+=split_band("Náklady","Koľko stojí vysporiadanie pozemku?",
      ["Náklady na vysporiadanie závisia od konkrétnej situácie, najmä od počtu vlastníkov, rozsahu potrebného právneho preverovania a zvoleného postupu.",
       "Rozdiel môže byť medzi vysporiadaním jediného spoluvlastníckeho podielu a rozsiahlym prípadom zahŕňajúcim viacero parciel, historických vlastníkov a odlišných právnych režimov."],
      "pen",link_arrow("Viac o nákladoch na vysporiadanie pozemku","/clanky/kolko-stoji-vysporiadanie-pozemku/"),side="left",bg="bg-paper")
    body+=contact_band("Potrebujete vysporiadať pozemok?",
      ["Ak máte nevysporiadané vlastnícke vzťahy k pozemku alebo potrebujete preveriť možnosti ich riešenia, obráťte sa na nás.","Po oboznámení sa s Vašou situáciou posúdime možnosti ďalšieho právneho postupu."],"Dohodnite si konzultáciu")
    body+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/vysporiadanie-pozemkov.html','w').write(h+body)
build()
