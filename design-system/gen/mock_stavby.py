from comp import *
from comp_services import *
ROOT='/Users/mbr/projects/noveris/design-system/'
PH.update({
 'hero':'1720156457517-c5ae8b9915f0','prod':'1759310347467-578dfd846229','agri':'1762344312199-822c73571003',
 'horse':'1576692194458-ea3f97b227af','chim':'1785439089025-0abc25bace85','fields':'1604808397353-36670a4b679d'})
AREAS=[("factory","Výrobné a priemyselné areály","výrobné haly, dielne, prevádzkové budovy a pozemky potrebné na zabezpečenie výroby.","prod"),
 ("warehouse","Skladové a logistické areály","skladové objekty, manipulačné plochy, prístupové komunikácie a ďalšie súvisiace pozemky.","ware"),
 ("agriculture","Poľnohospodárske areály a hospodárske dvory","hospodárske budovy, maštale, sklady, dvory a pozemky využívané pri poľnohospodárskej činnosti.","agri"),
 ("grass","Jazdecké areály, ranče a chovateľské prevádzky","stajne, výbehy, pastviny, prístupové cesty a ďalšie plochy potrebné na chov zvierat.","horse"),
 ("domain","Iné prevádzkové a komerčné areály","nehnuteľnosti využívané na podnikateľskú alebo inú činnosť, pri ktorých vlastníctvo pozemkov nie je usporiadané.","off")]
PROBLEMS=[("groups","pozemky patria viacerým spoluvlastníkom, prípadne desiatkam vlastníkov s rôzne veľkými podielmi"),
 ("person_search","na liste vlastníctva sú zapísané zosnulé osoby alebo vlastníci, ktorých nemožno spoľahlivo identifikovať"),
 ("account_balance","s pozemkami alebo spoluvlastníckymi podielmi nakladá Slovenský pozemkový fond"),
 ("flag","pozemky sú vo vlastníctve Slovenskej republiky"),
 ("business","ako vlastník je evidovaná spoločnosť, ktorá už zanikla"),
 ("fact_check","vlastníctvo je sporné alebo je hodnovernosť údajov katastra spochybnená")]
STEPS=[("Preverenie vlastníckych a právnych vzťahov","Preskúmame právny stav dotknutých pozemkov, dostupné historické dokumenty a okolnosti vzniku stavieb. Identifikujeme vlastníkov, existujúce právne tituly a prekážky vysporiadania."),
("Návrh právneho postupu","Na základe zistených skutočností posúdime možnosti usporiadania vlastníckych a užívacích vzťahov. Pri rozsiahlejších areáloch navrhneme aj postupnosť riešenia jednotlivých parciel s ohľadom na ich význam pre prevádzku alebo plánované využitie."),
("Realizácia vysporiadania","Zabezpečujeme rokovania s vlastníkmi a príslušnými inštitúciami, prípravu zmluvnej dokumentácie a právne zastupovanie v súdnych a ďalších konaniach podľa povahy prípadu.")]
P_=lambda *t:"".join(f'<p>{x}</p>' for x in t)
def build():
    h=head("Vysporiadanie pozemkov pod stavbami a v areáloch | Noveris Legal (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("Služby",True)+drawer_overlay("Služby")+'<main>'
    b+=hero("hero",[("Domov","/"),("Služby","/sluzby/"),("Vysporiadanie pozemkov a vlastníckych vzťahov","vysporiadanie-pozemkov.html"),("Vysporiadanie pozemkov pod stavbami a v areáloch","#")],
      "Vysporiadanie pozemkov pod stavbami a v areáloch",
      ["Vlastníte stavbu, ale pozemok pod ňou patrí inému vlastníkovi? Alebo prevádzkujete výrobný, skladový, poľnohospodársky či iný areál, v ktorom nie sú vysporiadané vlastnícke vzťahy k pozemkom?",
       "Pri rozsiahlejších areáloch môže ísť o desiatky parciel s rozdielnymi vlastníkmi, neprehľadnou vlastníckou históriou a odlišnými právnymi režimami. Niektoré pozemky môžu patriť zosnulým alebo nezisteným vlastníkom, iné štátu či spoločnostiam, ktoré už zanikli. Ich vysporiadanie preto často nemožno vyriešiť jedinou zmluvou alebo jedným právnym postupom."],
      "Zameriavame sa aj na právne náročné prípady vysporiadania pozemkov, pri ktorých je potrebné preveriť historické vlastnícke vzťahy, posúdiť viacero právnych možností a navrhnúť koordinovaný postup riešenia.",
      "Pomáhame vlastníkom stavieb, podnikateľom a obchodným spoločnostiam pri vysporiadaní pozemkov pod stavbami a v areáloch.","Dohodnite si konzultáciu")
    cards="".join(f'<div>{card_compact(i,t,d[0].upper()+d[1:],p)}</div>' for i,t,d,p in AREAS)
    b+=section(section_header("Areály","Kde vznikajú problémy s nevysporiadanými pozemkami?",
        "Nevysporiadané vlastnícke vzťahy sa netýkajú iba jednotlivých rodinných domov či garáží. Často sa vyskytujú aj pri rozsiahlejších nehnuteľnostiach, ktoré pozostávajú z viacerých stavieb a pozemkov. Môže ísť napríklad o:")
      +f'<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{cards}</div><div class="mt-8">'
      +callout("map","Problémom pritom nemusia byť iba pozemky priamo pod budovami. Rovnako dôležité môžu byť okolité parcely, ktoré sú nevyhnutné na prístup, prevádzku alebo ďalšie využívanie areálu.")+'</div>')
    left=card_side("history_edu","Prečo bývajú pozemky pod stavbami a v areáloch nevysporiadané?",
      ["Na Slovensku môžu mať stavba a pozemok rozdielnych vlastníkov. Takýto stav môže vzniknúť napríklad samostatným prevodom stavby alebo tým, že stavebník mal právo postaviť stavbu na cudzom pozemku.",
       "Pri starších prevádzkových areáloch môžu vlastnícke vzťahy vychádzať ešte z obdobia, keď pozemky užívali štátne podniky, družstvá alebo iné organizácie. Hoci sa vlastníctvo stavieb medzičasom zmenilo, pozemky mohli zostať zapísané na pôvodných vlastníkov alebo ich právnych nástupcov.",
       "Samotná skutočnosť, že stavba a pozemok majú rozdielnych vlastníkov, ešte neznamená, že ide o neoprávnenú stavbu. Preto je potrebné preveriť aj okolnosti výstavby a právny titul, na základe ktorého bola stavba postavená alebo sa pozemok užíva."],"chim")
    right=split_text_list("Vlastnícke problémy","Aké vlastnícke problémy riešime?",
      "Vysporiadanie pozemkov pod stavbami a v areáloch môže byť komplikované najmä vtedy, ak:",PROBLEMS,
      ["Pri rozsiahlejších areáloch sa tieto problémy často kombinujú. Jednotlivé parcely preto nemožno vždy riešiť izolovane, ale je potrebné posúdiť ich vlastnícke vzťahy vo vzájomných súvislostiach."],
      link_arrow("Viac o vysporiadaní pozemkov a komplikovaných vlastníckych vzťahov","vysporiadanie-pozemkov.html"))
    b+=section(f'<div class="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">{left}{right}</div>',bg="bg-sand")
    b+=split_band("Náročné prípady","Keď vysporiadanie pozemkov vyžaduje komplexnejší právny postup",
      ["Niektoré vlastnícke problémy možno vyriešiť dohodou s vlastníkom pozemku. Iné si vyžadujú podrobné preverenie historických dokumentov, identifikáciu právnych nástupcov, posúdenie viacerých právnych režimov a postupné riešenie jednotlivých vlastníckych vzťahov.",
       "Pri rozsiahlejších areáloch môže byť potrebné koordinovať viacero odlišných postupov. Kým pri jednej parcele môže prichádzať do úvahy odkúpenie spoluvlastníckych podielov, pri ďalšej môže byť potrebné dedičské konanie, rokovanie so Slovenským pozemkovým fondom alebo súdne konanie.",
       "Venujeme sa aj prípadom, pri ktorých predchádzajúce pokusy o vysporiadanie neviedli k výsledku alebo nie je zrejmé, akým spôsobom možno vlastnícke vzťahy usporiadať."],
      "fields",callout("balance","Naším cieľom je identifikovať právne prekážky, posúdiť dostupné možnosti ich riešenia a navrhnúť postup, ktorý zohľadňuje vzájomné súvislosti jednotlivých parciel."),side="right",bg="bg-paper")
    b+=section(two_col("Možnosti riešenia","Ako možno vysporiadať pozemok pod stavbou alebo v areáli?",
      P_("Vhodný spôsob riešenia závisí od vlastníckych vzťahov, okolností výstavby, existujúcich práv k pozemkom a spôsobu ich využívania.",
         "Podľa konkrétnej situácie môže prichádzať do úvahy napríklad odkúpenie pozemku alebo spoluvlastníckych podielov, dohoda s vlastníkom, zriadenie vecného bremena alebo iné zmluvné usporiadanie právnych vzťahov.",
         "Ak dohoda nie je možná, posudzujeme aj dostupné súdne riešenia. Tie sa môžu líšiť podľa toho, či ide o spor medzi spoluvlastníkmi, neoprávnenú stavbu alebo iný právny vzťah medzi vlastníkom stavby a pozemku.",
         "Pri rozsiahlejších areáloch môže byť potrebné zvoliť odlišný postup pre jednotlivé parcely a určiť poradie krokov podľa ich právneho stavu a významu pre fungovanie areálu."),
      "Náš postup","Ako postupujeme pri vysporiadaní pozemkov?",steps_v(STEPS)),bg="bg-sand")
    b+=split_band("","Vysporiadanie pozemkov pred predajom, rozšírením alebo ďalším využitím areálu",
      ["Nevysporiadané vlastnícke vzťahy môžu komplikovať predaj nehnuteľností, financovanie, rozšírenie prevádzky, výstavbu nových objektov alebo realizáciu ďalších investičných zámerov.",
       "V niektorých prípadoch sa vlastnícke problémy začnú riešiť až vtedy, keď spoločnosť plánuje areál predať, získať financovanie alebo realizovať novú výstavbu. Ich vysporiadanie však môže vyžadovať viacero na seba nadväzujúcich právnych krokov.",
       "Včasné preverenie vlastníckych vzťahov umožňuje identifikovať právne prekážky a posúdiť možnosti ich riešenia ešte pred uskutočnením plánovaného zámeru."],
      "plan1",side="left",bg="bg-paper")
    b+=contact_band("Potrebujete vysporiadať pozemky pod stavbou alebo v areáli?",
      ["Ak vlastníte stavbu na cudzom pozemku alebo potrebujete usporiadať vlastnícke vzťahy k pozemkom vo výrobnom, poľnohospodárskom či inom areáli, obráťte sa na nás.",
       "Preveríme právny stav nehnuteľností, posúdime možnosti vysporiadania a navrhneme ďalší právny postup s ohľadom na konkrétne okolnosti Vášho prípadu."],"Dohodnite si konzultáciu")
    b+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/pozemky-pod-stavbami.html','w').write(h+b)
build()
