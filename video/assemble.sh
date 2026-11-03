#!/usr/bin/env bash
# Join recorded clips into video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264 + AAC).
# Each clip is cut to its planned length; narration video/out/audio/<id>.mp3 is used when present (starting after scenes.json
# "lead", padded with silence), otherwise silence.
# A breath between scenes (Kento 11/4): after every scene but the last, its last frame is held in silence for "gap" seconds; a
# chapter scene ("wipe") also opens on its first frame (the closed noren) held for "wipeHold" seconds, so a chapter break is longer.
set -euo pipefail
cd "$(dirname "$0")"
LIST=out/concat.txt; : > "$LIST"
LEAD=$(node -e 'console.log(require("./scenes.json").lead ?? 0)')
# id:seconds:pre:post for every scene
ROWS=$(node -e '
  const p = require("./scenes.json"), gap = p.gap ?? 0, hold = p.wipeHold ?? 0;
  p.scenes.forEach((x, i) => console.log([x.id, x.seconds, x.wipe ? hold : 0, i < p.scenes.length - 1 ? gap : 0].join(":")));')
for row in $ROWS; do
  IFS=: read -r id sec pre post <<< "$row"
  clip="out/$id.webm"
  [ -f "$clip" ] || { echo "missing $clip (run video/record.ts)"; exit 1; }
  total=$(awk -v s="$sec" -v a="$pre" -v b="$post" 'BEGIN{printf "%.3f", s+a+b}')
  delay=$(awk -v l="$LEAD" -v a="$pre" 'BEGIN{printf "%d", (l+a)*1000}')
  if [ -f "out/audio/$id.mp3" ]; then
    audio=(-i "out/audio/$id.mp3")
    a=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/audio/$id.mp3")
    awk -v a="$a" -v l="$LEAD" -v s="$sec" 'BEGIN{exit !(a+l>s)}' && echo "warning: $id narration ${a}s (+${LEAD}s lead) > ${sec}s — it will be cut"
  else audio=(-f lavfi -t "$total" -i anullsrc=r=48000:cl=stereo); fi
  ffmpeg -loglevel error -y -t "$sec" -i "$clip" "${audio[@]}" -t "$total" -map 0:v:0 -map 1:a:0 \
    -vf "fps=30,scale=1280:720,format=yuv420p,tpad=start_mode=clone:start_duration=${pre}:stop_mode=clone:stop_duration=${post}" \
    -af "adelay=${delay}:all=1,apad" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -ar 48000 "out/$id.mp4"
  echo "file '$id.mp4'" >> "$LIST"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" -c copy out/kokoroe-demo.mp4
ffprobe -v error -show_entries format=duration -of default=nw=1 out/kokoroe-demo.mp4
