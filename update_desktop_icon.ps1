$DesktopPath = [Environment]::GetFolderPath('Desktop')
$WorkingDir = "F:\AI Angentic\Airobiz Supersonic Clone"
$ElectronExe = Join-Path $WorkingDir "node_modules\electron\dist\electron.exe"
$MainScript = "electron\main.cjs"
$IconFile = Join-Path $WorkingDir "public\game_icon.ico"
$ShortcutPath = Join-Path $DesktopPath "Airobiz Supersonic.lnk"

# 1. Clean up any existing / older versions of the game shortcut on Desktop
Get-ChildItem -Path $DesktopPath -Filter "*Airobiz*" | ForEach-Object {
    Write-Host "Removing old shortcut: $($_.FullName)"
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
}
Get-ChildItem -Path $DesktopPath -Filter "*Aerobiz*" | ForEach-Object {
    Write-Host "Removing old shortcut: $($_.FullName)"
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
}

# 2. Create the standalone desktop application shortcut (Direct GUI executable, zero browser tabs!)
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ElectronExe
$Shortcut.Arguments = $MainScript
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.Description = "Airobiz Supersonic - Standalone Desktop Game Application"
if (Test-Path $IconFile) {
    $Shortcut.IconLocation = "$IconFile, 0"
}
$Shortcut.Save()

Write-Host "Dedicated Standalone Desktop App shortcut successfully created at: $ShortcutPath"
