from comp_areas import *
CARDS=[
 ("account_balance","Kúpa a predaj nehnuteľností",["Pripravujeme a posudzujeme kúpne, rezervačné a ďalšie zmluvy súvisiace s prevodom nehnuteľností. Zastupujeme klientov pri rokovaniach o zmluvných podmienkach a zabezpečujeme právne úkony súvisiace s prevodom vlastníckeho práva vrátane konania pred katastrom nehnuteľností."],"pensign"),
 ("search","Právne preverenie nehnuteľností",["Pred kúpou alebo investíciou preverujeme právny stav nehnuteľností, vlastnícke vzťahy, vecné bremená, záložné práva a ďalšie právne skutočnosti, ktoré môžu ovplyvniť zamýšľanú transakciu alebo využitie nehnuteľnosti.","Na základe zistených skutočností identifikujeme právne riziká a posudzujeme možnosti ich riešenia."],"sunfield"),
 ("apartment","Developerské a investičné projekty",["Poskytujeme právne služby pri príprave a realizácii developerských a investičných projektov vrátane majetkovoprávneho preverovania pozemkov, zabezpečovania právnych vzťahov k nehnuteľnostiam a prípravy zmluvnej dokumentácie.","Zastupujeme klientov pri rokovaniach s vlastníkmi dotknutých nehnuteľností a ďalšími subjektmi zapojenými do realizácie projektu."],"crane"),
 ("engineering","Stavebné právo",["Poskytujeme právne poradenstvo pri príprave a povoľovaní stavebných zámerov, v konaniach pred príslušnými správnymi orgánmi a pri riešení právnych otázok súvisiacich s realizáciou stavieb.","Zastupujeme stavebníkov, vlastníkov nehnuteľností a ďalšie dotknuté osoby pri uplatňovaní a ochrane ich práv."],"planmodel"),
 ("key","Nájom nehnuteľností",["Pripravujeme a posudzujeme nájomné zmluvy k bytom, nebytovým priestorom, pozemkom a komerčným nehnuteľnostiam.","Poskytujeme právne služby pri vzniku, zmene a skončení nájomných vzťahov vrátane riešenia sporov medzi prenajímateľmi a nájomcami."],"interior"),
 ("alt_route","Vecné bremená a prístup k nehnuteľnostiam",["Riešime právne zabezpečenie prístupu k pozemkom a stavbám, zriaďovanie, zmenu a zánik vecných bremien, ako aj spory súvisiace s ich existenciou a výkonom.","Súčasťou našich služieb je aj príprava zmluvnej dokumentácie a zastupovanie pri rokovaniach s vlastníkmi dotknutých nehnuteľností."],"path2"),
]
hero_html=hero("bld",crumbs("Nehnuteľnosti a development"),"Nehnuteľnosti a development",
 ["Kúpa, predaj, prenájom či výstavba nehnuteľností prinášajú množstvo právnych otázok, ktoré môžu ovplyvniť priebeh transakcie, realizáciu projektu aj ďalšie využívanie nehnuteľnosti."],
 "Poskytujeme právne služby jednotlivcom, podnikateľom, investorom a developerským spoločnostiam pri realitných transakciách, príprave a realizácii developerských projektov a riešení právnych vzťahov týkajúcich sa nehnuteľností.",
 None,"Dohodnite si konzultáciu")
main=section(section_header("Naše služby","V akých oblastiach poskytujeme právne služby?")+'<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">'+"".join(card_side(*c) for c in CARDS)+'</div>')
main+=section(related_band("Súvisiaca služba","Vysporiadanie pozemkov a vlastníckych vzťahov",
 "Nevysporiadané vlastnícke vzťahy môžu predstavovať prekážku pri kúpe, predaji, výstavbe alebo ďalšom využívaní nehnuteľností. Osobitne sa venujeme vysporiadaniu pozemkov so Slovenským pozemkovým fondom, zosnulými vlastníkmi, duplicitným vlastníctvom, pozemkom zapísaným na zaniknuté spoločnosti či nevysporiadaným pozemkom pod stavbami a v rôznych typoch areálov.",
 link_arrow("Viac o vysporiadaní pozemkov a vlastníckych vzťahov","vysporiadanie-pozemkov.html"),"aerial2"),pad="pb-12 md:pb-16")
main+=prose_section("Náš prístup","Právne služby od prípravy až po realizáciu",
 ["Právne služby poskytujeme od úvodného preverenia nehnuteľnosti a posúdenia právnych rizík cez prípravu a vyjednávanie zmluvnej dokumentácie až po realizáciu transakcie, zastupovanie v príslušných konaniach alebo riešenie vzniknutých sporov.",
  "Rozsah poskytovaných služieb prispôsobujeme konkrétnej nehnuteľnosti, charakteru projektu a potrebám klienta."],bg="bg-sand")
main+=contact_band("Potrebujete právnu pomoc v oblasti nehnuteľností?",["Či už pripravujete kúpu alebo predaj nehnuteľnosti, realizujete developerský projekt alebo riešite právny problém súvisiaci s nehnuteľnosťou, obráťte sa na nás."],"Dohodnite si konzultáciu")
page("nehnutelnosti-a-development","Nehnuteľnosti a development",hero_html,main)
