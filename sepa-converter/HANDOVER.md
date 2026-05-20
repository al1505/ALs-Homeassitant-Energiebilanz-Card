# Handover-Dokument — ALs Bankkonvertierer v01→v08

**Erstellt:** 2026-05-20  
**Projekt:** SEPA Direct Debit XML-Konvertierer  
**Auftraggeber:** Andreas Steiner (IT-Leiter, Barmherzige Brüder)  
**Status:** Produktionsbereit, letzte Bugfixes deployed

---

## 1. Was dieses Tool tut

Konvertiert SEPA-Lastschrift-XML-Dateien vom österreichischen STUZZA-Format
`pain.008.001.01` in das seit März 2024 EU-weit verpflichtende Format `pain.008.001.08`.

**Eingabe:** XML-Datei im Format `APC:STUZZA:payments:ISO:pain:008:001:01:austrian:002`  
**Ausgabe:** XML-Datei im Format `urn:iso:std:iso:20022:tech:xsd:pain.008.001.08`

Das Tool läuft als **Windows-Standalone-Exe** (kein Node.js, keine Installation nötig).
Es überwacht einen Eingabeordner und konvertiert automatisch jede abgelegte XML-Datei.

---

## 2. Repositories

| Zweck        | Repository                                          | Branch                               |
|--------------|-----------------------------------------------------|--------------------------------------|
| Quellcode    | `al1505/ALs-Homeassitant-Energiebilanz-Card`        | `claude/sepa-format-converter-49eqs` |
| Distribution | `al1505/ALs-Bankkonvertierer` (privat)              | `main`                               |

---

## 3. Lokales Arbeitsverzeichnis (Windows)

```
D:\ALs\Claude\projects\ALs-Bankkonvertierer_v01_v08\
├── Bankkonvertierer.exe              ← Standalone-Exe (~61 MB)
├── Eingabe-pain.008.001.01\          ← XML-Dateien hier ablegen
│   └── archiv\                       ← verarbeitete Eingaben
├── Konvertiert-pain.008.001.08\      ← erfolgreiche Ausgaben
├── Fehler\                           ← fehlerhafte Dateien (mit Großbuchstabe F)
└── dashboard.html                    ← interaktives Dashboard (per Doppelklick öffnen)
```

**Ersteinrichtung:** `setup.ps1` aus dem ALs-Bankkonvertierer-Repo ausführen.

---

## 4. Quelldateien (sepa-converter/src/)

| Datei             | Zweck                                                    |
|-------------------|----------------------------------------------------------|
| `converter.js`    | Kern-Konvertierungslogik 01 → 08                         |
| `validator.js`    | Prüft die konvertierte Datei auf pain.008.001.08-Konformität |
| `comparator.js`   | Erstellt Feldvergleich 01 ↔ 08 für das Dashboard         |
| `dashboard.js`    | Generiert das HTML-Dashboard (4 Tabs)                    |
| `watcher.js`      | Datei-Watcher (chokidar, depth 0, überwacht Eingabeordner) |
| `fieldMappings.js`| Mapping-Tabelle aller Felder                             |
| `helpers.js`      | BIC/Adress-Hilfsfunktionen                               |

---

## 5. Kritische Transformationen (01 → 08)

| Element / Feld          | Änderung                                              |
|-------------------------|-------------------------------------------------------|
| `GrpHdr/Grpg`           | **entfernt** — existiert in .08 nicht                |
| `BIC`                   | → `BICFI` (in CdtrAgt und DbtrAgt)                   |
| `DrctDbtTx/CdtrSchmeId` | **verschoben** → `PmtInf/CdtrSchmeId` (Ebene höher)  |
| `OthrId/Id`             | → `Othr/Id`                                          |
| `OthrId/IdTp`           | → `Othr/SchmeNm/Prtry`                               |
| Root-Element            | `pain.008.001.01` → `CstmrDrctDbtInitn`              |
| Namespace               | STUZZA → `urn:iso:std:iso:20022:tech:xsd:pain.008.001.08` |

---

## 6. Dashboard (dashboard.html)

4 Tabs, wird automatisch nach jeder Konvertierung neu geschrieben:

| Tab               | Inhalt                                                       |
|-------------------|--------------------------------------------------------------|
| Konvertierungen   | Tabelle aller verarbeiteten Dateien mit Status, Fehlern, Warnungen |
| Feldvergleich     | 3-Spalten-Vergleich: Original 01 / Konvertiert 08 / Bankkonformität |
| Dokumentation     | Mapping-Tabelle aller Transformationen mit Badges             |
| Benutzerhandbuch  | Schritt-für-Schritt-Anleitung für Endanwender                |

**Auto-Refresh:** Standard AN, 5 Sekunden, pausiert automatisch auf anderen Tabs.  
**localStorage-Keys:** `rfEnabled_v2`, `rfSecs_v2`, `activeTab_v2`  
(Versionsuffix `_v2` verhindert Konflikte mit gespeicherten Werten älterer Versionen.)

---

## 7. Build-Workflow (Quellcode → Windows-Exe)

```bash
# 1. Abhängigkeiten installieren
cd sepa-converter && npm install

# 2. Exe bauen (~2 Minuten, erzeugt dist/Bankkonvertierer.exe, ~61 MB)
npm run build:win

# 3. Exe splitten (GitHub-API-Limit ~30 MB pro Blob)
cd dist
split -b 31457280 Bankkonvertierer.exe part
# → partaa (~30 MB), partab (~30 MB), partac (~500 KB)

# 4. In ALs-Bankkonvertierer pushen (via Python + GitHub REST API mit PAT)
# PAT: wird nur in der Session übergeben, nie im Code gespeichert
# Dateien: dist/partaa, dist/partab, dist/partac, src/watcher.js, src/dashboard.js
```

**Build-Tool:** `@yao-pkg/pkg` v6.19.0, Target `node22-win-x64`, Flag `--public`  
**pkg-Config in package.json:** `scripts: []` (verhindert Build-Fehler bei chokidar)

---

## 8. Zuletzt durchgeführte Änderungen (2026-05-20)

### Bugfixes (Commit `834dab4`)
- **`Fehler`-Ordner:** `watcher.js` verwendete `'fehler'` (Kleinschreibung) →
  korrigiert auf `'Fehler'` (Windows-konforme Großschreibung)
- **Auto-Refresh standardmäßig AN:** localStorage-Keys von `rfEnabled` / `rfSecs` /
  `activeTab` auf `rfEnabled_v2` / `rfSecs_v2` / `activeTab_v2` umbenannt,
  damit gespeicherte Altwerte (`rfEnabled=0`) aus früheren Versionen nicht mehr
  den Default (ON) überschreiben
- **Tab-aware Refresh:** Reload wird unterdrückt solange Feldvergleich, Dokumentation
  oder Benutzerhandbuch aktiv ist — springt nicht mehr zurück auf Konvertierungen-Tab

### Neue Dateien (Commit `0a04a23`)
- `CLAUDE.md`: Projektdokumentation für zukünftige Claude-Sitzungen
- `sepa-converter/setup.ps1`: Windows-Installer für lokales Projektverzeichnis

---

## 9. Offene Punkte / Nächste Schritte

- [ ] **Bankvalidierung:** Testdateien durch Konvertierer führen und Ergebnis mit
      RLBOÖ in deren Testumgebung validieren (Angebot von Hr. Fekete Zoltán liegt vor)
- [ ] **Rückmeldung der Bank** zu konvertierten Test-Files abwarten und ggf.
      Anpassungen im `converter.js` oder `validator.js` vornehmen
- [ ] Bei Änderungen: Build-Workflow (Schritt 7) wiederholen und neuen Deploy
      in `ALs-Bankkonvertierer` durchführen

---

## 10. Wichtige Hinweise für die nächste Session

- Das Repository für die **Quellcode-Arbeit** ist `al1505/ALs-Homeassitant-Energiebilanz-Card`,
  Branch `claude/sepa-format-converter-49eqs` — alle Änderungen dorthin pushen
- Das Repository `al1505/ALs-Bankkonvertierer` ist **privat** und nur über die
  GitHub REST API (Python + PAT) beschreibbar — **nicht** über `git push`
- Die Session-Proxy-Umgebung erlaubt `git push` nur auf das erste Repository
- Der PAT für ALs-Bankkonvertierer wird vom Nutzer in der Session mitgeteilt —
  nie im Code oder in Commits speichern
- `.gitignore` enthält `sepa-converter/dist/` — die Exe und Parts werden nie
  direkt in den Quellcode-Repo committet

---

*Dieses Dokument wurde automatisch aus dem Projektverlauf erstellt.*  
*Bei Fragen: Andreas Steiner, IT-Leiter Barmherzige Brüder*
