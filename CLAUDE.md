# ALs Bankkonvertierer v01→v08

SEPA Direct Debit XML-Konvertierer: pain.008.001.01 (STUZZA Austrian) → pain.008.001.08

---

## Lokaler Deployment-Pfad

```
D:\ALs\Claude\projects\ALs-Bankkonvertierer_v01_v08\
```

Arbeitsverzeichnis-Struktur nach Setup:

```
ALs-Bankkonvertierer_v01_v08\
├── Bankkonvertierer.exe              ← direkt startbar
├── Eingabe-pain.008.001.01\          ← XML-Eingabedateien hier ablegen
├── Konvertiert-pain.008.001.08\      ← konvertierte Ausgaben
├── Fehler\                           ← fehlerhafte Eingaben (mit Großbuchstabe F)
└── dashboard.html                    ← wird beim ersten Lauf automatisch generiert
```

---

## Repository-Struktur

| Zweck         | Repository                                        | Branch                            |
|---------------|---------------------------------------------------|-----------------------------------|
| Quellcode     | `al1505/ALs-Homeassitant-Energiebilanz-Card`      | `claude/sepa-format-converter-49eqs` |
| Distribution  | `al1505/ALs-Bankkonvertierer` (privat)            | `main`                            |

---

## Wichtige Quelldateien

```
sepa-converter/
├── index.js                    ← Einstiegspunkt (chokidar Watcher-Start)
├── setup.ps1                   ← Windows-Installer für Projektverzeichnis
├── package.json                ← npm-Abhängigkeiten + build:win Skript
└── src/
    ├── converter.js            ← Kern-Konvertierungslogik (01 → 08)
    ├── validator.js            ← XSD-Konformitätsprüfung pain.008.001.08
    ├── comparator.js           ← Feldvergleich 01 ↔ 08 (für Dashboard)
    ├── dashboard.js            ← HTML-Dashboard Generator (4 Tabs)
    ├── watcher.js              ← Datei-Watcher (chokidar, depth 0)
    ├── fieldMappings.js        ← Mapping-Tabelle der Felder
    └── helpers.js              ← Hilfsfunktionen (BIC, Adresse)
```

---

## Build-Workflow (Quellcode → Windows-Exe)

```bash
cd sepa-converter
npm install
npm run build:win                          # erzeugt dist/Bankkonvertierer.exe (~61 MB)

# Exe in 3 Teile splitten (GitHub API Limit ~30 MB pro Blob)
cd dist
split -b 31457280 Bankkonvertierer.exe part   # → partaa, partab, partac
```

Danach via Python-Skript (GitHub REST API mit PAT) in `al1505/ALs-Bankkonvertierer` pushen.
PAT wird nur in der Session verwendet, nicht im Code gespeichert.

---

## Namespace-Konvertierung

| Format          | Namespace                                              |
|-----------------|--------------------------------------------------------|
| pain.008.001.01 | `APC:STUZZA:payments:ISO:pain:008:001:01:austrian:002` |
| pain.008.001.08 | `urn:iso:std:iso:20022:tech:xsd:pain.008.001.08`       |

---

## Kritische Transformationen

| Feld / Element          | Änderung                                                      |
|-------------------------|---------------------------------------------------------------|
| `GrpHdr/Grpg`           | **entfernt** (nicht in .08 vorhanden)                        |
| `BIC`                   | → `BICFI` (CdtrAgt + DbtrAgt)                                |
| `DrctDbtTx/CdtrSchmeId` | **verschoben** → `PmtInf/CdtrSchmeId` (Ebene höher)         |
| `OthrId/Id`             | → `Othr/Id`                                                  |
| `OthrId/IdTp`           | → `Othr/SchmeNm/Prtry`                                       |

---

## localStorage-Keys (Dashboard Browser)

Seit v2 werden versionierte Keys verwendet um Konflikte mit alten Werten zu vermeiden:

| Zweck            | Key           |
|------------------|---------------|
| Auto-Refresh AN  | `rfEnabled_v2` (default: ON) |
| Refresh-Intervall| `rfSecs_v2` (default: 5s)   |
| Aktiver Tab      | `activeTab_v2`               |
