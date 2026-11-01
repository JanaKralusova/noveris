#!/bin/bash
# Usage: scripts/make-photo.sh <source.jpg> <name> [outdir]
# Writes <name>{-400,-800,-1200,}.{jpg,avif} (the unsuffixed file is 1600 px wide) with sips.
# Each file is resized and cropped in one sips pass to an even height (some odd heights make Chrome
# render the AVIF blank); sources taller than 4:3 are centre-cropped to 4:3. Quality starts at
# JPEG 70 / AVIF 55 and steps down per file until the size budget (KB) is met:
#   width    400  800  1200  1600
#   JPEG      35   90   180   300
#   AVIF      25   60   110   180
set -euo pipefail
src="$1"; name="$2"
out="${3:-$(cd "$(dirname "$0")/.." && pwd)/assets/photos/services}"
mkdir -p "$out"
sw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
sh=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')

size_kb() { echo $(( ($(stat -f %z "$1") + 1023) / 1024 )); }

# encode <fmt> <start quality> <budget KB> <width> <even height> <out file>
encode() {
  local fmt="$1" q="$2" budget="$3" w="$4" h="$5" dest="$6"
  while :; do
    sips --resampleWidth "$w" --cropToHeightWidth "$h" "$w" -s format "$fmt" -s formatOptions "$q" "$src" --out "$dest" >/dev/null
    [ "$(size_kb "$dest")" -le "$budget" ] || [ "$q" -le 25 ] && break
    q=$((q - 5))
  done
}

jb=(35 90 180 300); ab=(25 60 110 180); ws=(400 800 1200 1600)
for i in 0 1 2 3; do
  w=${ws[$i]}
  suffix="-$w"; [ "$w" = 1600 ] && suffix=""
  h=$(( w * sh / sw ))
  max=$(( w * 3 / 4 ))
  [ "$h" -gt "$max" ] && h=$max
  h=$(( h / 2 * 2 ))
  encode jpeg 70 "${jb[$i]}" "$w" "$h" "$out/$name$suffix.jpg"
  encode avif 55 "${ab[$i]}" "$w" "$h" "$out/$name$suffix.avif"
done
