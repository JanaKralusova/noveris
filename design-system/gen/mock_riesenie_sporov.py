from comp_areas import *
C=[
 ("forum","Mimosúdne riešenie sporov",["Nie každý právny spor musí viesť k súdnemu konaniu. V závislosti od okolností prípadu môže byť vhodným riešením dohoda, ktorá umožní usporiadať sporné vzťahy bez potreby súdneho rozhodnutia.","Posudzujeme právne postavenie klienta, pripravujeme predžalobné výzvy a návrhy dohôd a zastupujeme klientov pri rokovaniach s druhou stranou."],"sil2",None),
 ("account_balance","Súdne spory",["Zastupujeme klientov v občianskoprávnych a obchodnoprávnych sporoch, najmä pri uplatňovaní nárokov zo zmluvných vzťahov, náhrady škody, bezdôvodného obohatenia a sporoch týkajúcich sa vlastníckych a iných majetkových práv.","Súčasťou právneho zastupovania je posúdenie dôvodnosti nárokov, príprava procesných podaní, zabezpečenie dôkazných podkladov a zastupovanie v priebehu súdneho konania."],"gavel",None),
 ("payments","Vymáhanie pohľadávok",["Nezaplatené faktúry, pôžičky alebo iné peňažné záväzky môžu viesť k potrebe právneho vymáhania pohľadávok.","Preverujeme právny základ a vymáhateľnosť pohľadávok, pripravujeme výzvy na zaplatenie a zastupujeme veriteľov pri súdnom uplatňovaní nárokov vrátane upomínacieho konania."],"folders",None),
 ("shield","Obrana proti uplatňovaným nárokom",["Právne zastupovanie zabezpečujeme aj klientom, voči ktorým druhá strana uplatňuje peňažné alebo iné právne nároky.","Posudzujeme ich dôvodnosť, rozsah a dostupné možnosti obrany. Pripravujeme vyjadrenia, odpory, opravné prostriedky a ďalšie procesné podania podľa povahy konania."],"sil3",None),
 ("apartment","Zastupovanie v správnych konaniach",["Zastupujeme klientov v konaniach pred orgánmi verejnej správy, najmä pri riešení otázok týkajúcich sa nehnuteľností, vlastníckych práv a ďalších správnoprávnych záležitostí.","Súčasťou právnej pomoci je príprava žiadostí, vyjadrení, námietok a opravných prostriedkov, ako aj zastupovanie pri komunikácii s príslušnými orgánmi."],"filestack",None),
]
cards=[span(card_top_link(*c),2 if i<3 else 3) for i,c in enumerate(C)]
hero_html=hero("justice2",crumbs("Riešenie sporov"),"Riešenie sporov",
 ["Spory môžu vzniknúť z porušenia zmluvných povinností, nezaplatených pohľadávok, vlastníckych vzťahov či iných právnych nárokov. Ich riešenie si vyžaduje posúdenie právneho postavenia jednotlivých strán, dostupných dôkazov a možností ďalšieho postupu."],
 "Zastupujeme jednotlivcov, podnikateľov a obchodné spoločnosti pri mimosúdnom a súdnom riešení sporov.",
 "Pomáhame pri uplatňovaní a ochrane práv, vymáhaní pohľadávok a zastupovaní v súdnych a správnych konaniach.","Dohodnite si konzultáciu")
main=section(section_header("Naše služby","Oblasti riešenia sporov, ktorým sa venujeme")+grid6(cards))
main+=split_band("Náš prístup","Posúdenie právnych možností pred začatím sporu",
 ["Pred začatím súdneho konania je dôležité posúdiť nielen právny základ nároku, ale aj dostupné dôkazy, procesné riziká a možné náklady konania.",
  "Na základe konkrétnych okolností prípadu vyhodnocujeme možnosti mimosúdneho riešenia a súdneho uplatnenia alebo obrany práv. Cieľom je zvoliť postup, ktorý zohľadňuje právne postavenie klienta aj praktické dôsledky vedenia sporu."],"sil_group",side="right",bg="bg-sand")
main+=contact_band("Potrebujete vyriešiť právny spor?",["Ak potrebujete uplatniť svoj nárok, vymôcť pohľadávku alebo sa brániť proti požiadavkám druhej strany, obráťte sa na nás.","Po oboznámení sa s Vašou situáciou posúdime právne možnosti a navrhneme ďalší postup."],"Dohodnite si konzultáciu")
page("riesenie-sporov","Riešenie sporov",hero_html,main)
