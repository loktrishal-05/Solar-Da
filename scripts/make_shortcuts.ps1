# Creates "Start Solarda" and "Stop Solarda" shortcuts on the Desktop.
$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$sh = New-Object -ComObject WScript.Shell
foreach ($p in @(@('Start Solarda', 'go_live.ps1'), @('Stop Solarda', 'stop_live.ps1'))) {
    $lnk = $sh.CreateShortcut((Join-Path $desktop "$($p[0]).lnk"))
    $lnk.TargetPath = 'powershell.exe'
    $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $root "scripts\$($p[1])")`""
    $lnk.WorkingDirectory = $root
    $lnk.Save()
    Write-Host "Created $($lnk.FullName)"
}
