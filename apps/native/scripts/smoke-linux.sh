#!/usr/bin/env bash
# Linux desktop smoke test on a CI runner, run inside xvfb-run.
#
#   smoke-linux.sh <dir with the .AppImage and .deb> <output dir>
#
# 1. Runs the AppImage itself, first as a player would (which needs FUSE 2),
#    then extracted if FUSE is missing. Waits for the window, screenshots it,
#    clicks "Play free" on the landing page and checks the screen changed.
# 2. Installs the .deb with apt, launches the installed binary, screenshots
#    it, removes the package and checks the program is gone and the saves
#    folder is left alone.
# Writes <output dir>/linux-smoke.txt and exits non-zero if a check failed.
set -u
pkgdir=$(realpath "$1"); out=$(realpath -m "$2"); mkdir -p "$out"
report="$out/linux-smoke.txt"; : > "$report"
fails=0
check() { # check <name> <0|1 ok> <detail>
  if [ "$2" = 1 ]; then echo "PASS $1: $3" | tee -a "$report"; else echo "FAIL $1: $3" | tee -a "$report"; fails=$((fails + 1)); fi
}
note() { echo "NOTE $*" | tee -a "$report"; }

# Wait for a visible window named like the app; prints its id.
wait_window() {
  local win=""
  for _ in $(seq 1 30); do
    win=$(xdotool search --onlyvisible --name "Margin of Victory" 2>/dev/null | head -n1)
    [ -n "$win" ] && break
    kill -0 "${app_pid:-0}" 2>/dev/null || break   # the app already exited
    sleep 2
  done
  echo "$win"
}

run_app() { # run_app <label> <command...>: launch, screenshot, leave the pid in $app_pid
  local label=$1; shift
  "$@" > "$out/$label.log" 2>&1 &
  app_pid=$!
  win=$(wait_window)
  sleep 12
  import -window root "$out/$label.png"
  local alive=0; kill -0 "$app_pid" 2>/dev/null && alive=1
  local title=""; [ -n "$win" ] && title=$(xdotool getwindowname "$win")
  local colours; colours=$(identify -format "%k" "$out/$label.png")
  check "$label window" "$([ $alive = 1 ] && [ -n "$win" ] && [ "$colours" -gt 16 ] && echo 1 || echo 0)" \
    "alive=$alive window=$win title='$title' distinctColours=$colours"
}

stop_app() {
  kill "$app_pid" 2>/dev/null
  for _ in $(seq 1 10); do kill -0 "$app_pid" 2>/dev/null || return 0; sleep 1; done
  kill -9 "$app_pid" 2>/dev/null
}

# 1. AppImage.
appimage=$(ls "$pkgdir"/*.AppImage | head -n1)
chmod +x "$appimage"
# Plain start first, as a player would. Without FUSE 2 the AppImage runtime
# exits at once; then run it extracted, which is what players without libfuse2
# have to do as well.
"$appimage" > "$out/appimage-plain.log" 2>&1 &
app_pid=$!
win=$(wait_window)
if [ -n "$win" ]; then
  stop_app
  note "AppImage starts directly on this runner"
else
  stop_app
  note "AppImage did not open directly: $(head -c 400 "$out/appimage-plain.log" | tr '\n' ' ')"
fi
if grep -qi fuse "$out/appimage-plain.log"; then
  run_app appimage env APPIMAGE_EXTRACT_AND_RUN=1 "$appimage"
else
  run_app appimage "$appimage"
fi
if [ -n "$win" ]; then
  # No window manager under xvfb: put the window at the origin at its configured size.
  xdotool windowmove "$win" 0 0 windowsize "$win" 1280 800 2>/dev/null
  sleep 2
  import -window root "$out/appimage-landing.png"
  # "Play free" on the landing page (measured at 1280x800).
  xdotool mousemove 117 363 click 1
  sleep 4
  import -window root "$out/appimage-after-click.png"
  before=$(md5sum < "$out/appimage-landing.png"); after=$(md5sum < "$out/appimage-after-click.png")
  check "appimage takes a click" "$([ "$before" != "$after" ] && echo 1 || echo 0)" "landing then Play free: screenshots differ=$([ "$before" != "$after" ] && echo yes || echo no)"
fi
stop_app

# 2. .deb install, run, remove.
deb=$(ls "$pkgdir"/*.deb | head -n1)
pkg=$(dpkg-deb -f "$deb" Package)
sudo apt-get install -y "$deb" > "$out/deb-install.log" 2>&1
check "deb installs" "$(dpkg -s "$pkg" > /dev/null 2>&1 && echo 1 || echo 0)" "package $pkg $(dpkg-deb -f "$deb" Version)"
bin=$(dpkg -L "$pkg" | grep '^/usr/bin/' | head -n1)
desktop=$(dpkg -L "$pkg" | grep '\.desktop$' | head -n1)
check "deb puts the program on PATH" "$([ -n "$bin" ] && [ -x "$bin" ] && echo 1 || echo 0)" "$bin"
check "deb adds a menu entry" "$([ -n "$desktop" ] && echo 1 || echo 0)" "$desktop: $(grep -E '^(Name|Exec)=' "$desktop" 2>/dev/null | tr '\n' ' ')"
run_app deb "$bin"
stop_app
datadir=$(ls -d "$HOME"/.local/share/com.lakesidegames.electioneer* 2>/dev/null | head -n1)
note "app data folder: ${datadir:-none found under ~/.local/share}"
sudo apt-get remove -y "$pkg" > "$out/deb-remove.log" 2>&1
check "deb removes cleanly" "$([ ! -e "$bin" ] && ! dpkg -s "$pkg" > /dev/null 2>&1 && echo 1 || echo 0)" "$bin gone"
if [ -n "$datadir" ]; then
  check "saves kept after removal" "$([ -d "$datadir" ] && echo 1 || echo 0)" "$datadir"
fi

echo "linux smoke failures: $fails" | tee -a "$report"
exit $(( fails > 0 ))
