#!/usr/bin/env bash
# macOS: open a CI autoplay build (desktop-build.mjs --ci-autoplay <port>), let
# it play the free US campaign from the landing page to week two, and
# screenshot the desk at week two.
#
#   smoke-macos-play.sh <path to CI autoplay .app> <output dir> <port>
#
# Writes <output dir>/play.jsonl (the page's reports), macos-week-two.png and
# macos-play.txt; exits non-zero if week two was not reached.
set -u
app=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); out=$2; port=$3
mkdir -p "$out"; out=$(cd "$out" && pwd)
here=$(cd "$(dirname "$0")" && pwd)
report="$out/macos-play.txt"; : > "$report"
fails=0
check() { if [ "$2" = 1 ]; then echo "PASS $1: $3" | tee -a "$report"; else echo "FAIL $1: $3" | tee -a "$report"; fails=$((fails + 1)); fi; }

node "$here/ci-autoplay.mjs" listen "$port" "$out/play.jsonl" 240 > "$out/listener.log" 2>&1 &
listener=$!
sleep 2
exe="$app/Contents/MacOS/$(defaults read "$app/Contents/Info" CFBundleExecutable)"
open -n "$app"
pid=""
for _ in $(seq 1 30); do pid=$(pgrep -f "$exe" | head -n1); [ -n "$pid" ] && break; sleep 2; done
check "app started" "$([ -n "$pid" ] && echo 1 || echo 0)" "pid=${pid:-none}"
shot=0
for second in $(seq 1 240); do
  [ "$second" = 90 ] && screencapture -x "$out/macos-play-90s.png"
  if [ "$shot" = 0 ] && grep -q '"stage":"week-two"' "$out/play.jsonl" 2>/dev/null; then
    sleep 1
    screencapture -x "$out/macos-week-two.png"; shot=1
  fi
  grep -q '"stage":"done"' "$out/play.jsonl" 2>/dev/null && break
  kill -0 "$listener" 2>/dev/null || break
  sleep 1
done
[ "$shot" = 0 ] && screencapture -x "$out/macos-play-end.png"
stages=$(sed -n 's/.*"stage":"\([a-z-]*\)".*/\1/p' "$out/play.jsonl" 2>/dev/null | tr '\n' ' ')
check "page reported back" "$(grep -q '"stage":"loaded"' "$out/play.jsonl" 2>/dev/null && echo 1 || echo 0)" "stages: ${stages:-none}"
week=$(grep '"stage":"week-two"' "$out/play.jsonl" 2>/dev/null | head -n1)
check "week two reached" "$(echo "$week" | grep -q '"ok":true' && echo 1 || echo 0)" "${week:-no week-two report} $(grep '"stage":"error"' "$out/play.jsonl" 2>/dev/null | head -c 700)"
check "week two screenshot" "$shot" "$out/macos-week-two.png"
[ -n "$pid" ] && kill "$pid" 2>/dev/null
kill "$listener" 2>/dev/null
echo "macos play failures: $fails" | tee -a "$report"
exit $(( fails > 0 ))
