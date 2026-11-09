from comp_site import *
local_photos()
ROOT='/Users/mbr/projects/noveris/design-system/'
def build():
    h=head("O nás | Noveris Legal (mockup)")
    b='<body class="bg-paper font-body text-[15px] leading-[1.6] text-body antialiased">\n'
    b+=header("O nás",True)+drawer_overlay("O nás")+'<main>'
    b+=page_hero("Skúsenosti a prax",f'Záleží na <br/>{em("súvislostiach")}',
      "To, čo rozhoduje, nebýva vždy len samotná právna otázka. Dôležité sú aj okolnosti a následky, ktoré z nej vyplývajú. Práve tie často určujú, aký postup je naozaj vhodný.",
      "/assets/photos/about.jpg","Mgr. Jana Králusová – profesionálny portrét advokátky",photo_pos="center 15%")
    b+=quote_band("Jana Králusová","Zakladateľka a Advokátka","„Moja filozofia je postavená na tom, že dôležité nie je len to, čo je možné, ale aj to, čo je v danej situácii rozumné.“")
    b+=section(text_photo("Moja cesta","Skúsenosti a individuálny prístup",[
      "Moja profesionálna cesta sa začala túžbou po porozumení práva v širšom spoločenskom kontexte. Už počas štúdia ma formovala stáž v advokátskej kancelárii v Rakúsku, ktorá mi otvorila dvere k precíznosti a vysokým štandardom európskej právnej praxe. Práve tam som pochopila, že právo musí byť v prvom rade funkčné a predvídateľné.",
      "Svoje skúsenosti som neskôr rozvíjala v popredných advokátskych kanceláriách na Slovensku, kde som sa venovala komplexným a rôznorodým prípadom. Táto rozmanitosť ma naučila, že riešenie nie je len o striktných paragrafoch, ale predovšetkým o stratégii postavenej na porozumení potrieb klienta.",
      "V Noveris Legal sa vraciam k tomu najdôležitejšiemu - k osobnému vzťahu. Môj prístup je založený na absolútnom záväzku voči klientovi. Nehľadám len technicky správne odpovede, ale riešenia, ktoré skutočne rešpektujú integritu a životné či biznisové ciele tých, ktorých zastupujem."],
      "/assets/other/meeting.jpg","Rokovacia miestnosť Noveris Legal – profesionálne prostredie pre klientov",btn_primary("Dohodnúť konzultáciu","/kontakt/")))
    vals=[("handshake","Dôvera","Budujeme dlhodobé vzťahy založené na absolútnej diskrétnosti a lojalite k vašim záujmom."),
      ("verified","Zodpovednosť","Každý prípad riešime s maximálnou odbornou starostlivosťou a s ohľadom na najlepší záujem klienta."),
      ("visibility","Transparentnosť","Jasné pravidlá hry sú základom dlhodobého partnerstva. U nás vždy viete, na čom ste.")]
    b+=section(section_header(None,"Naše základné hodnoty","Piliere, na ktorých staviame každú jednu spoluprácu.")+'<div class="grid gap-5 md:grid-cols-3 lg:gap-6">'+"".join(card_value(*v) for v in vals)+'</div>',bg="bg-sand")
    b+='</main>'+footer()+DRAWER_JS+MEASURE_JS+'\n</body>\n</html>\n'
    open(ROOT+'mockups/o-nas.html','w').write(relink(h+b))
build()
