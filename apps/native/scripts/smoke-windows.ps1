# Launch a built desktop .exe, check it stays up with a visible window, and
# save a screenshot of the whole desktop. Exits non-zero when the app is not
# running or has no window after the wait.
param(
  [Parameter(Mandatory = $true)][string]$Exe,
  [Parameter(Mandatory = $true)][string]$Shot,
  [int]$WaitSeconds = 30
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MovWin {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@

Write-Host "Launching $Exe"
$p = Start-Process -FilePath $Exe -PassThru
$deadline = (Get-Date).AddSeconds($WaitSeconds)
$handle = [IntPtr]::Zero
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 2
  $p.Refresh()
  if ($p.HasExited) { break }
  if ($p.MainWindowHandle -ne [IntPtr]::Zero) { $handle = $p.MainWindowHandle }
}
# Let the web view finish its first paint after the window appears.
if (-not $p.HasExited -and $handle -ne [IntPtr]::Zero) {
  [void][MovWin]::ShowWindow($handle, 3)   # maximize
  [void][MovWin]::SetForegroundWindow($handle)
  Start-Sleep -Seconds 8
  $p.Refresh()
}

$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bmp.Size)
$bmp.Save($Shot, [System.Drawing.Imaging.ImageFormat]::Png)

# A rough blank check: count distinct colours on a coarse grid.
$colours = @{}
for ($x = 0; $x -lt $bmp.Width; $x += 16) {
  for ($y = 0; $y -lt $bmp.Height; $y += 16) { $colours[$bmp.GetPixel($x, $y).ToArgb()] = 1 }
}
$g.Dispose(); $bmp.Dispose()

$webviews = @(Get-Process -Name msedgewebview2 -ErrorAction SilentlyContinue).Count
$alive = -not $p.HasExited
Write-Host "alive=$alive window=$($handle -ne [IntPtr]::Zero) title='$($p.MainWindowTitle)' webview2Processes=$webviews distinctColours=$($colours.Count) screen=$($bounds.Width)x$($bounds.Height)"
if (-not $alive) { Write-Host "App exited with code $($p.ExitCode)" }

if ($alive) { Stop-Process -Id $p.Id -Force }
if (-not $alive -or $handle -eq [IntPtr]::Zero) { exit 1 }
exit 0
