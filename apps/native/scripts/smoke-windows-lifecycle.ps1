# Install, upgrade, play, buy and uninstall a desktop build on a Windows CI
# runner, the way a player would, and record what happened.
#
#   smoke-windows-lifecycle.ps1 -OldSetup <direct 1.x setup.exe> -NewSetup <direct setup.exe>
#                               [-PreviewSetup <preview setup.exe>] -Out <dir>
#
# The app is driven through WebView2's remote debugging port
# (WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS), so the build under test is exactly
# the one shipped. Clicks come from desktop-smoke.mjs. Writes
# <Out>/lifecycle.json and screenshots, and exits non-zero if any check failed.
#
#   smoke-windows-lifecycle.ps1 -BlurPid <pid> -Out <dir>
#   smoke-windows-lifecycle.ps1 -FocusPid <pid> -Out <dir>
#
# Helpers used by the checkout step. Blur screenshots the desktop (the browser
# should be in front) and minimises the app; Focus restores it and brings it to
# the front, so the game sees the player come back to its window.
param(
  [string]$OldSetup,
  [string]$NewSetup,
  [string]$PreviewSetup,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$BlurPid = 0,
  [int]$FocusPid = 0
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$Out = (Resolve-Path $Out).Path
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MovWin {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
}
"@

function Save-Desktop([string]$Name) {
  $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bmp.Size)
  $path = Join-Path $Out "$Name.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "screenshot $path"
}

if ($BlurPid -ne 0) {
  Save-Desktop 'checkout-desktop-browser'
  [MovWin]::ShowWindow((Get-Process -Id $BlurPid).MainWindowHandle, 6) | Out-Null   # minimise: the page goes hidden
  Write-Host 'app minimised'
  exit 0
}
if ($FocusPid -ne 0) {
  $h = (Get-Process -Id $FocusPid).MainWindowHandle
  [MovWin]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)   # Alt down/up lets a background process take the foreground
  [MovWin]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
  [MovWin]::ShowWindow($h, 9) | Out-Null          # restore
  [MovWin]::ShowWindow($h, 3) | Out-Null          # maximise again
  $fg = [MovWin]::SetForegroundWindow($h)
  Write-Host "app restored; foreground=$fg isForeground=$([MovWin]::GetForegroundWindow() -eq $h)"
  exit 0
}

$driver = Join-Path $PSScriptRoot 'desktop-smoke.mjs'
$self = $PSCommandPath
$cdpPort = 9222
$results = [ordered]@{}
$failed = 0
function Check([string]$Name, $Ok, $Detail) {
  $ok = [bool]$Ok
  $results[$Name] = [ordered]@{ ok = $ok; detail = "$Detail" }
  if (-not $ok) { $script:failed++ }
  Write-Host ("{0} {1}: {2}" -f $(if ($ok) { 'PASS' } else { 'FAIL' }), $Name, $Detail)
}

function Note([string]$Name, $Detail) {
  $results[$Name] = [ordered]@{ note = "$Detail" }
  Write-Host "NOTE ${Name}: $Detail"
}

$uninstallRoot = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$desktopDir = [Environment]::GetFolderPath('Desktop')

function Get-Install([string]$Product) {
  $key = Join-Path $uninstallRoot $Product
  if (-not (Test-Path $key)) { return $null }
  $p = Get-ItemProperty $key
  $dir = if ($p.InstallLocation) { $p.InstallLocation.Trim('"') } else { Join-Path $env:LOCALAPPDATA $Product }
  $exe = Get-ChildItem -Path $dir -Filter *.exe -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch '^uninstall' } | Select-Object -First 1
  [pscustomobject]@{ Version = $p.DisplayVersion; Dir = $dir; Exe = $exe.FullName; Uninstall = $p.UninstallString; Publisher = $p.Publisher }
}

function Install([string]$Setup, [string]$Label) {
  $t = Get-Date
  $p = Start-Process -FilePath $Setup -ArgumentList '/S' -PassThru -Wait
  $secs = [int]((Get-Date) - $t).TotalSeconds
  Check "$Label installer exit code" ($p.ExitCode -eq 0) "exit $($p.ExitCode) after ${secs}s"
}

function Uninstall([string]$Product, [string]$Label) {
  $inst = Get-Install $Product
  if (-not $inst) { Check "$Label uninstall" $false 'not installed'; return }
  $cmd = $inst.Uninstall.Trim('"')
  Start-Process -FilePath $cmd -ArgumentList '/S' -Wait | Out-Null
  # The NSIS uninstaller copies itself to %TEMP% and returns early; wait for the files to go.
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline -and ((Test-Path $inst.Exe) -or (Test-Path (Join-Path $uninstallRoot $Product)))) { Start-Sleep -Seconds 2 }
  Check "$Label program files removed" (-not (Test-Path $inst.Exe)) $inst.Dir
  Check "$Label uninstall entry removed" (-not (Test-Path (Join-Path $uninstallRoot $Product))) $Product
  Check "$Label Start menu shortcut removed" (-not (Test-Path (Join-Path $startMenu "$Product.lnk"))) "$Product.lnk"
  Note "$Label desktop shortcut after uninstall" "present: $(Test-Path (Join-Path $desktopDir "$Product.lnk"))"
}

function Launch([string]$Exe, [string]$Label) {
  $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=$cdpPort"
  $p = Start-Process -FilePath $Exe -PassThru
  Remove-Item Env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
  $deadline = (Get-Date).AddSeconds(60)
  $cdp = $false
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    $p.Refresh()
    if ($p.HasExited) { break }
    try { Invoke-RestMethod "http://127.0.0.1:$cdpPort/json/version" -TimeoutSec 3 | Out-Null; $cdp = $true } catch { }
    if ($cdp -and $p.MainWindowHandle -ne [IntPtr]::Zero) { break }
  }
  $alive = -not $p.HasExited
  Check "$Label launched with a window" ($alive -and $p.MainWindowHandle -ne [IntPtr]::Zero) "title='$($p.MainWindowTitle)'"
  Check "$Label debugging port open" $cdp "port $cdpPort"
  if ($alive) {
    [MovWin]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
    [MovWin]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
    Start-Sleep -Seconds 4
  }
  return $p
}

function Close-App($p, [string]$Label) {
  if ($p.HasExited) { Check "$Label closed normally" $false 'already exited'; return }
  # Close the window the way a player does, so web storage is flushed.
  $p.CloseMainWindow() | Out-Null
  $clean = $p.WaitForExit(30000)
  if (-not $clean) { Stop-Process -Id $p.Id -Force }
  Check "$Label closed normally" $clean "exit code $(if ($clean) { $p.ExitCode } else { 'killed' })"
  # Let WebView2's helper processes release the profile.
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline -and (Get-Process -Name msedgewebview2 -ErrorAction SilentlyContinue)) { Start-Sleep -Seconds 1 }
}

function Drive([string]$Step, [string]$Label, [string[]]$Extra = @()) {
  $dir = Join-Path $Out $Label
  & node $driver $Step --cdp "http://127.0.0.1:$cdpPort" --out $dir @Extra 2>&1 | ForEach-Object { Write-Host $_ }
  $code = $LASTEXITCODE
  $resultFile = Join-Path $dir "$Step-result.json"
  $detail = if (Test-Path $resultFile) { (Get-Content $resultFile -Raw | ConvertFrom-Json).checks | ConvertTo-Json -Compress -Depth 5 } else { 'no result file' }
  Check "$Label $Step" ($code -eq 0) $detail
}

$direct = 'Margin of Victory'
$directData = Join-Path $env:LOCALAPPDATA 'com.lakesidegames.electioneer'
$preview = 'Margin of Victory Preview'
$previewData = Join-Path $env:LOCALAPPDATA 'com.lakesidegames.electioneer.preview'

try {
  # 1. Older release, installed silently, played to week two.
  Install $OldSetup 'old'
  $old = Get-Install $direct
  Check 'old installed' ($old -and (Test-Path $old.Exe)) "version $($old.Version) at $($old.Exe)"
  Check 'old Start menu shortcut' (Test-Path (Join-Path $startMenu "$direct.lnk")) ''
  Note 'old desktop shortcut' "present: $(Test-Path (Join-Path $desktopDir "$direct.lnk"))"
  $p = Launch $old.Exe 'old'
  Drive 'play' 'old'
  Save-Desktop 'old-week-two-desktop'
  Close-App $p 'old'
  Check 'save folder after old run' (Test-Path (Join-Path $directData 'EBWebView')) $directData

  # 2. Upgrade in place with the new installer.
  Install $NewSetup 'upgrade'
  $new = Get-Install $direct
  $fileVersion = (Get-Item $new.Exe).VersionInfo.ProductVersion
  Check 'upgraded' ($new.Version -ne $old.Version -and $new.Dir -eq $old.Dir) "uninstall entry $($old.Version) -> $($new.Version), exe ProductVersion $fileVersion, same folder $($new.Dir), publisher '$($new.Publisher)'"

  # 3. New version: the save from before the upgrade, then checkout.
  $p = Launch $new.Exe 'new'
  Drive 'resume' 'new'
  Save-Desktop 'new-resumed-desktop'
  $edgeBefore = @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Select-Object -ExpandProperty ProcessId)
  Drive 'checkout' 'new' @('--blur-cmd', "& '$self' -BlurPid $($p.Id) -Out '$Out'", '--focus-cmd', "& '$self' -FocusPid $($p.Id) -Out '$Out'")
  $edge = @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -match 'lakesidegames\.net/account/checkout' })
  $edgeLine = if ($edge) { $edge[0].CommandLine } else { "no msedge.exe with the checkout URL (msedge before: $($edgeBefore.Count))" }
  Check 'system browser opened the checkout URL' ($edge.Count -gt 0) $edgeLine
  Drive 'scope' 'new'
  Save-Desktop 'new-after-checkout-desktop'
  Get-Process -Name msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Close-App $p 'new'

  # 4. Uninstall: program gone, saves kept (the silent uninstaller never ticks "Delete the application data").
  Uninstall $direct 'direct'
  Check 'saves kept after uninstall' (Test-Path (Join-Path $directData 'EBWebView')) $directData

  # 5. Reinstall: the campaign is still there.
  Install $NewSetup 'reinstall'
  $re = Get-Install $direct
  $p = Launch $re.Exe 'reinstall'
  Drive 'resume' 'reinstall'
  Close-App $p 'reinstall'

  # 6. Preview build next to the real one.
  if ($PreviewSetup) {
    Install $PreviewSetup 'preview'
    $pv = Get-Install $preview
    Check 'preview installed alongside' ($pv -and (Test-Path $pv.Exe) -and (Test-Path (Get-Install $direct).Exe)) "$($pv.Dir) next to $((Get-Install $direct).Dir)"
    $p = Launch $pv.Exe 'preview'
    Drive 'paid' 'preview'
    Save-Desktop 'preview-week-two-desktop'
    Close-App $p 'preview'
    Check 'preview keeps its own save folder' (Test-Path (Join-Path $previewData 'EBWebView')) $previewData
    Uninstall $preview 'preview'
  }
  Uninstall $direct 'final'
  Check 'saves kept after final uninstall' (Test-Path (Join-Path $directData 'EBWebView')) $directData
} catch {
  Check 'script error' $false $_.Exception.Message
  Save-Desktop 'error-desktop'
}

$results | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $Out 'lifecycle.json') -Encoding utf8
Write-Host "lifecycle checks failed: $failed"
if ($failed -gt 0) { exit 1 }
exit 0
