$WorkingDir = $PSScriptRoot
if (-not $WorkingDir) {
    $WorkingDir = (Get-Location).Path
}

$ElectronExe = Join-Path $WorkingDir "node_modules\electron\dist\electron.exe"
$MainScript = Join-Path $WorkingDir "electron\main.cjs"
$IconFile = Join-Path $WorkingDir "public\game_icon.ico"
$ShortcutName = "Airobiz Supersonic.lnk"

# Target desktop locations to inspect and clean
$DesktopLocations = @(
    [Environment]::GetFolderPath('Desktop'),
    [Environment]::GetFolderPath('CommonDesktopDirectory'),
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\OneDrive\Desktop"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

# 1. Clean up any existing / older versions of the game shortcut across all desktop paths
$Patterns = @("*Airobiz*", "*Aerobiz*", "*Supersonic*")
foreach ($dPath in $DesktopLocations) {
    foreach ($pattern in $Patterns) {
        Get-ChildItem -Path $dPath -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "Removing old shortcut: $($_.FullName)"
            Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Determine primary Desktop Path for creating the new single shortcut
$PrimaryDesktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $PrimaryDesktop)) {
    $PrimaryDesktop = $DesktopLocations[0]
}

$ShortcutPath = Join-Path $PrimaryDesktop $ShortcutName

# 3. Create the standalone desktop application shortcut (Direct GUI executable, zero browser tabs!)
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ElectronExe
$Shortcut.Arguments = "`"$MainScript`""
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.Description = "Airobiz Supersonic - Standalone Desktop Game Application"
if (Test-Path $IconFile) {
    $Shortcut.IconLocation = "$IconFile,0"
}
$Shortcut.Save()

Write-Host "Dedicated Standalone Desktop App shortcut successfully created at: $ShortcutPath"
