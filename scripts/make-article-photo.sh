#!/bin/bash
# Usage: scripts/make-article-photo.sh <source.jpg|png> <slug> [top-offset-%] [outdir]
# Writes <slug>{-400,-640,-800,-1024,-1600,}.{jpg,avif} with sips (the unsuffixed file is 2000 px wide; a source
# narrower than 2000 px, e.g. a screenshot, gets the widths up to its own width and the unsuffixed file at that width).
# The source is first cut to 3:2 once (lossless PNG): the aspect of the article tiles and the page hero. A source taller
# than 3:2 is cut at [top-offset-%] from the top (default 50 = centre), a wider one is centred. Every file then has an
# exact 3:2 even height (some odd heights make Chrome render an AVIF blank). Quality starts at JPEG 82 / AVIF 65 and
# steps down per file until the size budget (KB) is met:
#   width    400  640  800  1024  1600  2000
#   JPEG      70  140  210   330   620   900
#   AVIF      30   60   90   140   260   380
# Use the original photo (Jana's files are 2200-7400 px wide); the build only needs the files to exist.
set -euo pipefail
src="$1"; slug="$2"; pct="${3:-50}"
out="${4:-$(cd "$(dirname "$0")/.." && pwd)/assets/articles}"
mkdir -p "$out"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
sw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
sh=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')
# 3:2 crop rectangle in source pixels
if [ $(( sw * 2 )) -ge $(( sh * 3 )) ]; then   # wider than (or exactly) 3:2: cut the width
  ch=$sh; cw=$(( sh * 3 / 2 )); cx=$(( (sw - cw) / 2 )); cy=0
else                                           # taller: cut the height
  cw=$sw; ch=$(( sw * 2 / 3 )); cx=0; cy=$(( (sh - ch) * pct / 100 ))
fi
sips --cropOffset "$cy" "$cx" --cropToHeightWidth "$ch" "$cw" -s format png "$src" --out "$work/crop.png" >/dev/null

size_kb() { echo $(( ($(stat -f %z "$1") + 1023) / 1024 )); }
encode() {
  local fmt="$1" q="$2" budget="$3" w="$4" h="$5" dest="$6"
  while :; do
    sips --resampleHeightWidth "$h" "$w" -s format "$fmt" -s formatOptions "$q" "$work/crop.png" --out "$dest" >/dev/null
    [ "$(size_kb "$dest")" -le "$budget" ] || [ "$q" -le 40 ] && break
    q=$((q - 5))
  done
}

jb=(${JB:-70 140 210 330 620 900}); ab=(${AB:-30 60 90 140 260 380}); ws=(400 640 800 1024 1600 2000)
for i in 0 1 2 3 4 5; do
  w=${ws[$i]}
  [ "$w" -lt "$cw" ] || [ "$w" = 2000 -a "$cw" -ge 2000 ] || break   # never upscale
  suffix="-$w"; [ "$w" = 2000 ] && suffix=""
  h=$(( w * 2 / 3 / 2 * 2 ))
  encode jpeg 82 "${jb[$i]}" "$w" "$h" "$out/$slug$suffix.jpg"
  encode avif 65 "${ab[$i]}" "$w" "$h" "$out/$slug$suffix.avif"
done
# a source narrower than 2000 px: the unsuffixed file is the source width
if [ "$cw" -lt 2000 ]; then
  h=$(( cw * 2 / 3 / 2 * 2 ))
  encode jpeg 82 "${jb[$i]:-${jb[5]}}" "$cw" "$h" "$out/$slug.jpg"
  encode avif 65 "${ab[$i]:-${ab[5]}}" "$cw" "$h" "$out/$slug.avif"
fi
