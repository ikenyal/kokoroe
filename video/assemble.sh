#!/usr/bin/env bash
# Join recorded clips into video/out/kokoroe-demo.mp4 (1280×720, 30 fps, H.264 + AAC).
# Each clip is cut to its planned length; narration video/out/audio/<id>.mp3 is used when present (starting after scenes.json "lead",
# padded with silence), otherwise silence.
set -euo pipefail
cd "$(dirname "$0")"
LIST=out/concat.txt; : > "$LIST"
LEAD=$(node -e 'console.log(require("./scenes.json").lead ?? 0)')
DELAY=$(awk -v l="$LEAD" 'BEGIN{printf "%d", l*1000}')
for row in $(node -e 'const s=require("./scenes.json");for(const x of s.scenes)console.log(x.id+":"+x.seconds)'); do
  id="${row%%:*}"; sec="${row##*:}"; clip="out/$id.webm"
  [ -f "$clip" ] || { echo "missing $clip (run video/record.ts)"; exit 1; }
  if [ -f "out/audio/$id.mp3" ]; then
    audio=(-i "out/audio/$id.mp3")
    a=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/audio/$id.mp3")
    awk -v a="$a" -v l="$LEAD" -v s="$sec" 'BEGIN{exit !(a+l>s)}' && echo "warning: $id narration ${a}s (+${LEAD}s lead) > ${sec}s — it will be cut"
  else audio=(-f lavfi -t "$sec" -i anullsrc=r=48000:cl=stereo); fi
  ffmpeg -loglevel error -y -i "$clip" "${audio[@]}" -t "$sec" -map 0:v:0 -map 1:a:0 \
    -vf "fps=30,scale=1280:720,format=yuv420p" -af "adelay=${DELAY}:all=1,apad" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -ar 48000 "out/$id.mp4"
  echo "file '$id.mp4'" >> "$LIST"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" -c copy out/kokoroe-demo.mp4
ffprobe -v error -show_entries format=duration -of default=nw=1 out/kokoroe-demo.mp4
