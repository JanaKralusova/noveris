# Extra components for the Služby mockups (kept out of the shared comp.py).
from comp import *

def hero_label(label, *a, **k):
    """Use when a hero needs a small copper label above the H1 (e.g. "Právna expertíza" on the services overview)."""
    h = hero(*a, **k)
    return h.replace('<h1 class="mt-5', eyebrow(label) .replace('<p class="', '<p class="mt-5 ', 1) + '<h1 class="mt-2', 1)

def split_text_list(eb, title, intro, items, outro, link=None):
    """Use when a text column pairs an eyebrow + H2 + lead-in with an icon list and closing note, next to an image card (right half of the 'Prečo / Aké problémy' split)."""
    o = "".join(f'<p class="text-[14px] leading-[1.6] text-body md:text-[15px]">{p}</p>' for p in outro)
    l = f'<div class="pt-1">{link}</div>' if link else ''
    return (f'<div>{eyebrow(eb)}<h2 class="mt-2 font-headline text-[1.75rem] leading-[1.2] text-ink md:text-[2rem]">{title}</h2>'
            f'<p class="mt-4 mb-5 text-[14px] leading-[1.6] text-body md:text-[15px]">{intro}</p>{icon_list(items)}'
            f'<div class="mt-5 space-y-3">{o}</div><div class="mt-4">{l}</div></div>')
