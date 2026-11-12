#!/usr/bin/env bash
# macOS desktop smoke test on a CI runner.
#
#   smoke-macos.sh <path to .app> <output dir> [unsealed copy of the .app]
#
# 1. Records the app's signature and what Gatekeeper says about it.
# 2. Opens the .app as built (no quarantine flag, like a local build), waits
#    for its process and an on-screen window, and screenshots the screen.
# 3. Copies the app, marks the copy as downloaded from the internet (the
#    quarantine flag a browser sets), asks Gatekeeper again, opens it, and
#    screenshots what a tester would see. With a third argument, does the same
#    for the app as Tauri left it, before the workflow sealed it, for comparison.
# Writes <output dir>/macos-smoke.txt; exits non-zero if step 2 fails.
set -u
app=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); out=$2; mkdir -p "$out"; out=$(cd "$out" && pwd)
report="$out/macos-smoke.txt"; : > "$report"
fails=0
check() { if [ "$2" = 1 ]; then echo "PASS $1: $3" | tee -a "$report"; else echo "FAIL $1: $3" | tee -a "$report"; fails=$((fails + 1)); fi; }
note() { echo "NOTE $*" | tee -a "$report"; }

cat > "$out/windows.swift" <<'SWIFT'
import CoreGraphics
let pid = Int32(CommandLine.arguments[1]) ?? 0
let list = (CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]]) ?? []
for w in list where (w[kCGWindowOwnerPID as String] as? Int32) == pid {
  let b = (w[kCGWindowBounds as String] as? [String: Any]) ?? [:]
  let layer = w[kCGWindowLayer as String] as? Int ?? -1
  print("layer=\(layer) w=\(b["Width"] ?? 0) h=\(b["Height"] ?? 0) name=\(w[kCGWindowName as String] as? String ?? "")")
}
SWIFT
swiftc -O "$out/windows.swift" -o "$out/windows" 2> "$out/swiftc.log" || note "swiftc failed: $(head -c 300 "$out/swiftc.log")"

note "macOS $(sw_vers -productVersion) $(uname -m)"
note "codesign: $(codesign -dv "$app" 2>&1 | grep -E 'Signature|Authority|TeamIdentifier|flags' | tr '\n' ' ')"
note "Gatekeeper on the local build: $(spctl -a -t exec -vv "$app" 2>&1 | tr '\n' ' ')"

exe="$app/Contents/MacOS/$(defaults read "$app/Contents/Info" CFBundleExecutable)"
open -n "$app"
pid=""
for _ in $(seq 1 30); do pid=$(pgrep -f "$exe" | head -n1); [ -n "$pid" ] && break; sleep 2; done
wins=""
for _ in $(seq 1 20); do
  [ -n "$pid" ] && wins=$("$out/windows" "$pid" 2>/dev/null | grep 'layer=0' || true)
  [ -n "$wins" ] && break
  sleep 2
done
sleep 10
screencapture -x "$out/macos-smoke.png"
alive=0; [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && alive=1
check "app opens with a window" "$([ $alive = 1 ] && [ -n "$wins" ] && echo 1 || echo 0)" "pid=${pid:-none} windows: $(echo "$wins" | tr '\n' ';')"
[ -n "$pid" ] && kill "$pid" 2>/dev/null
sleep 2

# What a tester gets after downloading the unsigned build. `open` waits while
# Gatekeeper's prompt is up, so it runs in the background and is killed.
try_downloaded() { # try_downloaded <label> <app>
  local label=$1 src=$2 q
  q="$out/quarantined-$label/$(basename "$src")"
  mkdir -p "$(dirname "$q")"; ditto "$src" "$q"
  xattr -w com.apple.quarantine "0083;$(printf %x "$(date +%s)");Safari;" "$q"
  note "$label: Gatekeeper on a downloaded copy: $(spctl -a -t exec -vv "$q" 2>&1 | tr '\n' ' ')"
  open -n "$q" > "$out/open-$label.log" 2>&1 &
  local opener=$!
  sleep 12
  screencapture -x "$out/macos-downloaded-$label.png"
  local qpid; qpid=$(pgrep -f "$q/Contents/MacOS/" | head -n1)
  note "$label: downloaded copy running after open: $([ -n "$qpid" ] && echo "yes (pid $qpid)" || echo no)"
  [ -n "$qpid" ] && kill "$qpid" 2>/dev/null
  kill "$opener" 2>/dev/null
  killall CoreServicesUIAgent 2>/dev/null   # dismisses the Gatekeeper prompt
  sleep 2
  note "$label: open said: $(tr '\n' ' ' < "$out/open-$label.log")"
  rm -rf "$(dirname "$q")"
}
try_downloaded sealed "$app"
[ $# -ge 3 ] && [ -d "$3" ] && try_downloaded unsealed "$3"
rm -f "$out/windows"

echo "macos smoke failures: $fails" | tee -a "$report"
exit $(( fails > 0 ))
