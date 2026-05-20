#Requires -Version 5.1
<#
.SYNOPSIS
    Installiert den ALs Bankkonvertierer v01->v08 in das Projektverzeichnis.
.DESCRIPTION
    Legt die vollstaendige Arbeitsverzeichnis-Struktur unter
    D:\ALs\Claude\projects\ALs-Bankkonvertierer_v01_v08\ an,
    setzt die Exe aus den Teildateien zusammen und erstellt
    optional eine Desktop-Verknuepfung.
#>

$ErrorActionPreference = "Stop"

$ProjectPath = "D:\ALs\Claude\projects\ALs-Bankkonvertierer_v01_v08"
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ALs Bankkonvertierer v01->v08  |  Setup  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verzeichnisstruktur anlegen ─────────────────────────────────────────
Write-Host "  [1/4] Erstelle Projektverzeichnis ..." -ForegroundColor Yellow

$dirs = @(
    $ProjectPath,
    "$ProjectPath\Eingabe-pain.008.001.01",
    "$ProjectPath\Konvertiert-pain.008.001.08",
    "$ProjectPath\Fehler"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

Write-Host "        $ProjectPath" -ForegroundColor DarkGray
Write-Host "        +-- Eingabe-pain.008.001.01\" -ForegroundColor DarkGray
Write-Host "        +-- Konvertiert-pain.008.001.08\" -ForegroundColor DarkGray
Write-Host "        +-- Fehler\" -ForegroundColor DarkGray
Write-Host "  [1/4] OK" -ForegroundColor Green

# ── 2. Exe zusammensetzen ──────────────────────────────────────────────────
Write-Host "  [2/4] Bankkonvertierer.exe erstellen ..." -ForegroundColor Yellow

$exeDest = Join-Path $ProjectPath "Bankkonvertierer.exe"
$partaa  = Join-Path $ScriptDir "dist\partaa"
$partab  = Join-Path $ScriptDir "dist\partab"
$partac  = Join-Path $ScriptDir "dist\partac"

if ((Test-Path $partaa) -and (Test-Path $partab) -and (Test-Path $partac)) {

    $copyCmd = "copy /b `"$partaa`"+`"$partab`"+`"$partac`" `"$exeDest`""
    cmd /c $copyCmd | Out-Null

    if (Test-Path $exeDest) {
        $sizeMB = [Math]::Round((Get-Item $exeDest).Length / 1MB, 1)
        Write-Host "  [2/4] OK  ($sizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "  [2/4] FEHLER: Exe konnte nicht erstellt werden." -ForegroundColor Red
        Write-Host "        Bitte manuell pruefen und erneut versuchen." -ForegroundColor Red
        Read-Host "  Beliebige Taste zum Beenden"
        exit 1
    }

} elseif (Test-Path (Join-Path $ScriptDir "Bankkonvertierer.exe")) {

    Copy-Item (Join-Path $ScriptDir "Bankkonvertierer.exe") $exeDest -Force
    $sizeMB = [Math]::Round((Get-Item $exeDest).Length / 1MB, 1)
    Write-Host "  [2/4] OK  (Exe direkt kopiert, $sizeMB MB)" -ForegroundColor Green

} else {
    Write-Host "  [2/4] WARNUNG: Keine Exe-Quelldatei gefunden." -ForegroundColor Yellow
    Write-Host "        Bankkonvertierer.exe bitte manuell in folgendes Verzeichnis" -ForegroundColor Yellow
    Write-Host "        kopieren: $ProjectPath" -ForegroundColor Yellow
}

# ── 3. Desktop-Verknuepfung anlegen ───────────────────────────────────────
Write-Host "  [3/4] Desktop-Verknuepfung erstellen ..." -ForegroundColor Yellow

try {
    $desktop  = [Environment]::GetFolderPath("Desktop")
    $lnkPath  = Join-Path $desktop "ALs Bankkonvertierer.lnk"
    $shell    = New-Object -ComObject WScript.Shell
    $lnk      = $shell.CreateShortcut($lnkPath)
    $lnk.TargetPath       = $exeDest
    $lnk.WorkingDirectory = $ProjectPath
    $lnk.Description      = "ALs SEPA Bankkonvertierer pain.008.001.01 -> pain.008.001.08"
    $lnk.Save()
    Write-Host "  [3/4] OK  (Desktop: ALs Bankkonvertierer.lnk)" -ForegroundColor Green
} catch {
    Write-Host "  [3/4] Verknuepfung konnte nicht angelegt werden: $_" -ForegroundColor Yellow
}

# ── 4. Zusammenfassung ─────────────────────────────────────────────────────
Write-Host "  [4/4] Setup abgeschlossen." -ForegroundColor Green
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Projektverzeichnis:" -ForegroundColor Cyan
Write-Host "  $ProjectPath" -ForegroundColor White
Write-Host ""
Write-Host "  Verwendung:" -ForegroundColor Cyan
Write-Host "  1. XML-Dateien in 'Eingabe-pain.008.001.01' ablegen" -ForegroundColor White
Write-Host "  2. Bankkonvertierer.exe starten (oder Desktop-Verknuepfung)" -ForegroundColor White
Write-Host "  3. dashboard.html per Doppelklick oeffnen" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$start = Read-Host "  Bankkonvertierer jetzt starten? (J/N)"
if ($start -match "^[Jj]$") {
    if (Test-Path $exeDest) {
        Start-Process $exeDest -WorkingDirectory $ProjectPath
    } else {
        Write-Host "  Exe nicht gefunden. Bitte zuerst manuell ablegen." -ForegroundColor Red
    }
}
