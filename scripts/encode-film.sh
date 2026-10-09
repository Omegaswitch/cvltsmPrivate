#!/usr/bin/env bash
# Cuts and grades the hero footage into web clips in public/film/.
#
#   FFMPEG=/path/to/ffmpeg SRC=/path/to/originals scripts/encode-film.sh
#
# Each clip is cut from an original, graded to one look (near-monochrome,
# crushed blacks, a dirty dried-blood cast) and encoded at 720p for large
# screens and 480p for phones, each as VP9 WebM (smaller) and H.264 MP4 (for
# browsers without VP9), silent, with a keyframe every two seconds so the
# player can start a clip at once. A poster frame is
# written for each, used before the video plays and when motion is off.
# The order, timing and transitions live in data/film.ts.
set -euo pipefail
FF="${FFMPEG:-ffmpeg}"
SRC="${SRC:-assets/film}"
OUT=public/film

# name | source file | start (s) | length (s) | gamma | contrast
CLIPS=(
  "window|13313175_1920_1080_25fps.mp4|0|10|1.7|1.12"
  "hands|okno.mp4|0.3|6|1.0|1.12"
  "figure|16513463-hd_1920_1080_24fps.mp4|28|10|1.55|1.3"
  "cabin|blairwitch_2.mp4|25.5|7|1.15|1.12"
)

grade() { # gamma contrast
  echo "eq=saturation=0.16:contrast=$2:gamma=$1,colorchannelmixer=rr=1.0:gg=0.82:bb=0.74,curves=all='0/0 0.1/0.045 0.5/0.44 1/0.93'"
}

for row in "${CLIPS[@]}"; do
  IFS='|' read -r name file start len gamma contrast <<< "$row"
  g=$(grade "$gamma" "$contrast")
  for size in lg:720:26 sm:480:28; do
    IFS=: read -r tag h crf <<< "$size"
    "$FF" -v error -y -ss "$start" -t "$len" -i "$SRC/$file" -an \
      -vf "scale=-2:$h:flags=lanczos,$g,fps=24,format=yuv420p" \
      -c:v libx264 -profile:v high -preset slow -crf "$crf" -g 48 -movflags +faststart \
      "$OUT/$name-$tag.mp4"
    "$FF" -v error -y -ss "$start" -t "$len" -i "$SRC/$file" -an \
      -vf "scale=-2:$h:flags=lanczos,$g,fps=24,format=yuv420p" \
      -c:v libvpx-vp9 -b:v 0 -crf $((crf + 8)) -row-mt 1 -deadline good -cpu-used 2 -g 48 \
      "$OUT/$name-$tag.webm"
  done
  "$FF" -v error -y -ss "$(awk "BEGIN{printf \"%.2f\", $start + 0.4}")" -i "$SRC/$file" -frames:v 1 \
    -vf "scale=-2:720:flags=lanczos,$g" -c:v libwebp -quality 72 "$OUT/$name.webp"
  echo "$name"
done

# film damage: a looping pass of dust and grime, laid over the footage
"$FF" -v error -y -i "$SRC/3611029-hd_1920_1080_24fps.mp4" -an \
  -vf "scale=-2:540:flags=lanczos,format=gray,eq=contrast=1.6:brightness=-0.05,fps=24,format=yuv420p" \
  -c:v libx264 -profile:v high -preset slow -crf 30 -g 48 -movflags +faststart "$OUT/damage.mp4"
"$FF" -v error -y -i "$SRC/3611029-hd_1920_1080_24fps.mp4" -an \
  -vf "scale=-2:540:flags=lanczos,format=gray,eq=contrast=1.6:brightness=-0.05,fps=24,format=yuv420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -deadline good -cpu-used 2 -g 48 "$OUT/damage.webm"
echo damage
