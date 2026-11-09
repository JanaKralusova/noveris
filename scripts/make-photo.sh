#!/bin/bash
# Usage: scripts/make-photo.sh <source.jpg> <name> [outdir]
# Writes <name>{-400,-560,-800,-1200,-1600,-2000,}.{jpg,avif} with sips; the unsuffixed file is the largest the source allows
# (2000 px wide, so use an original of at least 2000 px, e.g. Unsplash `?w=2400`: unsplash.com/photos/<id>/download).
# Each file is resized and cropped in one sips pass to an even height (some odd heights make Chrome render the
# AVIF blank); sources taller than 4:3 are centre-cropped to 4:3, wider ones keep their shape. Quality starts at
# JPEG 82 / AVIF 65 and steps down per file until the size budget (KB) is met:
#   width    400  560  800  1200  1600  2000
#   JPEG      55  100  160   300   480   680
#   AVIF      40   65  100   180   290   420
# 400 to 1200 are what phones and tiles download; 1600 and 2000 are for retina heroes and wide cards.
# ONLY=560 regenerates just that width (e.g. from an existing full-size file as <source>).
# CROP="x y w h" first cuts that rectangle (source pixels) out of the source, e.g. to keep a fixed framing.
set -euo pipefail
src="$1"; name="$2"
out="${3:-$(cd "$(dirname "$0")/.." && pwd)/assets/photos/services}"
mkdir -p "$out"
tmp=""
if [ -n "${CROP:-}" ]; then
  read -r cx cy cw ch <<<"$CROP"
  tmp="$(mktemp -d)/crop.png"
  sips --cropOffset "$cy" "$cx" --cropToHeightWidth "$ch" "$cw" -s format png "$src" --out "$tmp" >/dev/null
  src="$tmp"
fi
sw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
sh=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')

size_kb() { echo $(( ($(stat -f %z "$1") + 1023) / 1024 )); }

# encode <fmt> <start quality> <budget KB> <width> <even height> <out file>
encode() {
  local fmt="$1" q="$2" budget="$3" w="$4" h="$5" dest="$6"
  while :; do
    sips --resampleWidth "$w" --cropToHeightWidth "$h" "$w" -s format "$fmt" -s formatOptions "$q" "$src" --out "$dest" >/dev/null
    [ "$(size_kb "$dest")" -le "$budget" ] || [ "$q" -le 40 ] && break
    q=$((q - 5))
  done
}

jb=(${JB:-55 100 160 300 480 680}); ab=(${AB:-40 65 100 180 290 420}); ws=(400 560 800 1200 1600 2000)
# the unsuffixed file is the widest one the source can supply (2000 px at most)
last=2000; [ "$sw" -lt "$last" ] && last=$sw
for i in 0 1 2 3 4 5; do
  w=${ws[$i]}
  [ "$w" -le "$last" ] || continue
  [ -z "${ONLY:-}" ] || [ "$ONLY" = "$w" ] || continue
  suffix="-$w"; [ "$w" = "$last" ] && suffix=""
  h=$(( w * sh / sw ))
  max=$(( w * 3 / 4 ))
  [ "$h" -gt "$max" ] && h=$max
  h=$(( h / 2 * 2 ))
  encode jpeg 82 "${jb[$i]}" "$w" "$h" "$out/$name$suffix.jpg"
  encode avif 65 "${ab[$i]}" "$w" "$h" "$out/$name$suffix.avif"
done
# a source narrower than 2000 px that is not one of the widths above still gets its unsuffixed full-width file
if [ -z "${ONLY:-}" ] && [[ " ${ws[*]} " != *" $last "* ]]; then
  h=$(( last * sh / sw )); max=$(( last * 3 / 4 )); [ "$h" -gt "$max" ] && h=$max; h=$(( h / 2 * 2 ))
  encode jpeg 82 "${jb[5]}" "$last" "$h" "$out/$name.jpg"
  encode avif 65 "${ab[5]}" "$last" "$h" "$out/$name.avif"
fi
