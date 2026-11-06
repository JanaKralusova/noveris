# Components for the owner-search page (Vyhľadávanie vlastníkov). Same style as comp.py.
from comp import *

MARK = '<mark class="rounded-[2px] bg-[#f0dcc8] px-px text-ink">{}</mark>'
def mark(t):
    """Use when a search term matches inside a result: pale-copper highlight, ink text (contrast ~13:1)."""
    return MARK.format(t)

def search_field(value, placeholder="Priezvisko, katastrálne územie alebo číslo LV"):
    """Use when a page is driven by one large search input: icon + underline-free boxed input with forest focus ring."""
    return ('<label class="flex items-center gap-3 rounded-btn border border-field bg-white px-4 py-3 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/25">'
      + icon("search", "text-[26px] text-forest") +
      f'<input id="owners-q" type="search" value="{value}" placeholder="{placeholder}" aria-label="Hľadať v zozname nezistených vlastníkov" autocomplete="off" autocapitalize="off" spellcheck="false" '
      'class="w-full border-0 bg-transparent p-0 font-body text-[18px] text-ink placeholder:text-muted focus:ring-0"/></label>')

def labeled_select(id_, label, options, cls="sm:max-w-md"):
    """Use when a filter needs a visible label above a full-width select (area filter, relation select)."""
    opts = "".join(f'<option{" selected" if i == 0 else ""}>{o}</option>' for i, o in enumerate(options))
    return (f'<div class="{cls}"><label for="{id_}" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">{label}</label>'
            f'<select id="{id_}" class="{FIELD}">{opts}</select></div>')

def pick_button(on):
    """Use when a result row can be toggled into a request: outline forest 'Riešiť' / solid forest 'Vybrané' (aria-pressed)."""
    if on:
        return (f'<button type="button" aria-pressed="true" class="owners-pick inline-flex w-[7.5rem] shrink-0 items-center justify-center gap-1.5 rounded-btn bg-forest px-3 py-2.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-forest-dark">{icon("check","text-[18px]")}Vybrané</button>')
    return (f'<button type="button" aria-pressed="false" class="owners-pick inline-flex w-[7.5rem] shrink-0 items-center justify-center gap-1.5 rounded-btn border border-forest px-3 py-2.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-forest hover:bg-forest hover:text-white">{icon("add","text-[18px]")}Riešiť</button>')

def result_card(rid, area_html, code, name_html, note_html, lv_html, on=False):
    """Use when listing a searchable record with a pick toggle: eyebrow area, serif name, note, LV line; selected = forest border + sand tint."""
    border = "border-forest bg-[#f6f1ea]" if on else "border-line bg-card"
    note = f'<p class="mt-1 break-words text-[14px] leading-[1.5] text-body">{note_html}</p>' if note_html else ''
    return (f'<div class="owners-card flex flex-col gap-3 rounded-card border {border} p-5 shadow-soft sm:flex-row sm:items-start sm:gap-4" data-id="{rid}">'
      f'<div class="min-w-0 flex-1"><p class="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-copper">{area_html} · k. ú. {code}</p>'
      f'<h3 class="mt-1 break-words font-headline text-[1.25rem] leading-snug text-ink">{name_html}</h3>{note}'
      f'<p class="mt-2 font-label text-[13px] tabular-nums text-muted">{lv_html}</p></div>{pick_button(on)}</div>')

def selected_item(name, line):
    """Use when listing records chosen for a request: icon, name, small meta line, remove button."""
    return (f'<li class="flex items-start gap-3 border-b border-line py-3 last:border-0">{icon("landscape","mt-0.5 text-[22px] text-copper")}'
      f'<div class="min-w-0 flex-1"><div class="break-words font-label text-[15px] font-semibold text-ink">{name}</div><div class="text-[13px] text-muted">{line}</div></div>'
      f'<button type="button" class="owners-rm -mr-1 p-1 text-muted hover:text-ink" aria-label="Odstrániť záznam {name}">{icon("close","text-[20px]")}</button></li>')

def text_field(id_, label, ph, typ="text", value="", extra=""):
    """Use when a form needs a labelled single-line field in the system style (label above, FIELD input)."""
    return (f'<div><label for="{id_}" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">{label}</label>'
            f'<input id="{id_}" type="{typ}" value="{value}" placeholder="{ph}" {extra} class="{FIELD}"/></div>')

def request_panel(heading, who, avatar, sel_items, sel_count, fields_html, message, submit, note, privacy):
    """Use when a sticky side panel collects chosen items plus contact data: avatar header, selected list, fields, prefilled textarea, submit."""
    return ('<aside id="owners-panel" class="scroll-mt-24 lg:sticky lg:top-24" aria-labelledby="owners-panel-h"><div class="overflow-hidden rounded-card border border-line bg-card shadow-soft">'
      f'<div class="flex items-center gap-4 border-b border-line bg-sand p-5 md:p-6"><img src="{avatar}" alt="" width="56" height="56" class="h-14 w-14 shrink-0 rounded-pill bg-sand-deep object-cover"/>'
      f'<div><h2 id="owners-panel-h" class="font-headline text-[1.125rem] leading-snug text-ink">{heading}</h2><p class="mt-1 text-[13px] text-muted">{who}</p></div></div>'
      '<form id="owners-form" class="space-y-5 p-5 md:p-6" onsubmit="return false" novalidate>'
      f'<div><div id="owners-sel-label" class="mb-2 font-label text-[13px] font-semibold text-ink">Vybrané záznamy ({sel_count})</div>'
      f'<ul id="owners-selected" class="rounded-btn bg-sand px-4" aria-labelledby="owners-sel-label">{sel_items}</ul></div>'
      f'{fields_html}'
      f'<div><label for="owners-message" class="mb-1.5 block font-label text-[13px] font-semibold text-ink">Správa (predvyplnená, môžete upraviť)</label>'
      f'<textarea id="owners-message" name="message" rows="12" required class="{FIELD} text-[14px] leading-[1.55]">{message}</textarea></div>'
      f'<div><button id="owners-submit" type="submit" class="{BTN} w-full justify-center bg-forest text-white hover:bg-forest-dark"><span>{submit}</span>{icon("arrow_forward","text-[18px]")}</button>'
      +(f'<p class="mt-3 text-center text-[13px] text-muted">{note}</p>' if note else '')+'</div>'
      f'<p class="text-[12px] leading-relaxed text-muted">{privacy}</p></form></div></aside>')

def mobile_bar(text):
    """Use when a long mobile page needs a persistent jump to the form: fixed bottom forest bar, hidden from lg up."""
    return (f'<a href="#owners-panel" id="owners-mbar" class="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center rounded-btn bg-forest py-4 text-center font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-xl lg:hidden">{text}</a>')

def source_note(label, inner):
    """Use when data comes from a third party: small muted block with top rule, eyebrow label and disclaimers."""
    return (f'<div class="mt-12 border-t border-line pt-6 text-[13px] leading-relaxed text-muted"><p class="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-copper">{label}</p>{inner}</div>')
