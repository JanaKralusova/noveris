from comp_areas import *
C=[
 ("description","Príprava zmlúv",["Pripravujeme zmluvy podľa povahy konkrétneho právneho vzťahu a požiadaviek klienta. Dôraz kladieme na jednoznačné vymedzenie práv a povinností zmluvných strán, podmienok plnenia, zodpovednosti za porušenie povinností a možností ukončenia zmluvného vzťahu.","Súčasťou našich služieb je príprava občianskoprávnych aj obchodnoprávnych zmlúv vrátane súvisiacich dohôd a dodatkov."],"paperstack",None),
 ("search","Posudzovanie a revízia zmlúv",["Pred podpisom zmluvy je dôležité poznať nielen jej obsah, ale aj právne a finančné dôsledky jednotlivých ustanovení.","Preskúmavame návrhy zmlúv predložené druhou stranou, identifikujeme právne riziká a navrhujeme úpravy ustanovení, ktoré môžu byť pre klienta nevýhodné, nejednoznačné alebo nedostatočné."],"sign2",None),
 ("groups","Vyjednávanie zmluvných podmienok",["Pri uzatváraní zmlúv môže byť rozhodujúce správne nastavenie podmienok spolupráce, rozsahu zodpovednosti, zabezpečenia záväzkov či následkov porušenia zmluvy.","Zastupujeme klientov pri rokovaniach s druhou zmluvnou stranou a pri hľadaní zmluvného riešenia, ktoré zohľadňuje ich právne a obchodné záujmy."],"table2",None),
 ("settings","Zmeny a ukončenie zmluvných vzťahov",["Počas trvania zmluvného vzťahu môže vzniknúť potreba zmeniť dohodnuté podmienky, upraviť rozsah plnenia alebo spoluprácu ukončiť.","Posudzujeme možnosti zmeny a skončenia zmluvných vzťahov, pripravujeme dodatky, dohody o ukončení zmlúv, výpovede a odstúpenia od zmlúv vrátane posúdenia ich právnych následkov."],"sign3",None),
 ("gavel","Porušenie zmluvných povinností a zmluvné spory",["Ak jedna zo zmluvných strán neplní svoje povinnosti, môže vzniknúť nárok na splnenie záväzku, zaplatenie zmluvnej pokuty, náhradu škody alebo uplatnenie ďalších práv vyplývajúcich zo zmluvy a zákona.","Preverujeme zmluvnú dokumentáciu, posudzujeme vzniknuté nároky a možnosti ich uplatnenia alebo obrany proti nim. Klientov zastupujeme pri mimosúdnom riešení sporov aj v súdnych konaniach."],"justice_dark",None),
]
cards=[span(card_top_link(*c),2 if i<3 else 3) for i,c in enumerate(C)]
hero_html=hero("sign1",crumbs("Zmluvná agenda"),"Zmluvná agenda",
 ["Zmluvy upravujú práva a povinnosti zmluvných strán a vytvárajú právny základ ich vzájomných vzťahov. Nejasné ustanovenia, nevýhodne nastavené podmienky alebo nedostatočná úprava zodpovednosti môžu viesť k sporom a finančným stratám."],
 "Poskytujeme právne služby jednotlivcom, podnikateľom a obchodným spoločnostiam pri príprave, posudzovaní a vyjednávaní zmlúv.",
 "Pomáhame tiež pri riešení problémov vznikajúcich počas trvania zmluvného vzťahu a pri uplatňovaní nárokov z porušenia zmluvných povinností.","Dohodnite si konzultáciu")
main=section(section_header("Naše služby","Oblasti zmluvnej agendy, ktorým sa venujeme")+grid6(cards))
main+=split_band("Náš prístup","Zmluvná dokumentácia pre podnikateľov a obchodné spoločnosti",
 ["Pri podnikateľských vzťahoch je dôležité, aby zmluvná dokumentácia zodpovedala charakteru obchodnej spolupráce a primerane upravovala riziká spojené s jej realizáciou.",
  "Okrem individuálnych zmlúv sa venujeme aj príprave a revízii rámcových zmlúv, obchodných podmienok a ďalšej dokumentácie používanej pri opakovaných obchodných vzťahoch.",
  "Pri posudzovaní zmlúv zohľadňujeme nielen ich právne znenie, ale aj spôsob, akým má spolupráca fungovať v praxi."],"desk",side="right",bg="bg-sand")
main+=prose_section("Náš prístup","Právna pomoc počas celého zmluvného vzťahu",
 ["Právne otázky nemusia vzniknúť iba pri uzatváraní zmluvy. Rovnako dôležité môže byť posúdenie jej výkladu, plnenia dohodnutých povinností, zmien podmienok alebo možností ukončenia spolupráce.",
  "Rozsah právnej pomoci prispôsobujeme konkrétnej situácii – od posúdenia jednotlivého ustanovenia až po prípravu rozsiahlejšej zmluvnej dokumentácie alebo riešenie vzniknutého sporu."])
main+=contact_band("Potrebujete pripraviť alebo posúdiť zmluvu?",["Ak pripravujete uzatvorenie zmluvy, potrebujete preveriť jej podmienky alebo riešite problém vyplývajúci z existujúceho zmluvného vzťahu, obráťte sa na nás.","Po oboznámení sa s Vašou situáciou posúdime právne možnosti a navrhneme ďalší postup."],"Dohodnite si konzultáciu")
page("zmluvna-agenda","Zmluvná agenda",hero_html,main)
