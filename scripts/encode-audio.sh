#!/usr/bin/env bash
# Turns the ambient track into a seamless loop for the web.
#
#   FFMPEG=/path/to/ffmpeg scripts/encode-audio.sh
#
# The last 4 seconds are crossfaded into the first 4 and the join moved to
# where the track starts, so when the player wraps round there is no seam.
# Written as Ogg Opus (small, gapless) and MP3 (for browsers without Opus).
set -euo pipefail
FF="${FFMPEG:-ffmpeg}"
SRC="${SRC:-assets/audio/dark-shamanic-horror.mp3}"
X=4
D=$({ "$FF" -hide_banner -i "$SRC" 2>&1 || true; } | awk -F'[:, ]+' '/Duration/ { print $3*3600 + $4*60 + $5 }')
LOOP="[0:a]asplit=3[a1][a2][a3];
[a1]atrim=0:$X,asetpts=PTS-STARTPTS[head];
[a2]atrim=$X:$(awk "BEGIN{print $D-$X}"),asetpts=PTS-STARTPTS[mid];
[a3]atrim=$(awk "BEGIN{print $D-$X}"):$D,asetpts=PTS-STARTPTS[tail];
[tail][head]acrossfade=d=$(awk "BEGIN{print $X-0.1}")[xf];
[mid][xf]concat=n=2:v=0:a=1[out]"
"$FF" -v error -y -i "$SRC" -filter_complex "$LOOP" -map "[out]" -c:a libopus -b:a 80k public/audio/ambient.ogg
"$FF" -v error -y -i "$SRC" -filter_complex "$LOOP" -map "[out]" -c:a libmp3lame -b:a 96k public/audio/ambient.mp3
echo done
