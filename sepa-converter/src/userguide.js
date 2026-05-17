'use strict';

function generateUserGuide(generatedAt) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SEPA Konvertierer — Benutzerhandbuch</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#fff;color:#1a1a2e;line-height:1.6;font-size:14px}
@media print{
  .no-print{display:none!important}
  body{font-size:12px}
  h1{font-size:20px}
  h2{font-size:15px;page-break-after:avoid}
  .step{page-break-inside:avoid}
  .cover{page-break-after:always}
}

/* Cover */
.cover{background:linear-gradient(135deg,#1a1f3c 0%,#0d1117 100%);color:#fff;padding:60px 40px;min-height:280px;display:flex;flex-direction:column;justify-content:center}
.cover h1{font-size:28px;font-weight:700;margin-bottom:8px}
.cover .sub{font-size:15px;opacity:.75;margin-bottom:24px}
.cover .meta{font-size:12px;opacity:.5}
.cover .version{display:inline-block;background:rgba(88,166,255,.2);color:#58a6ff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px}

/* Layout */
.content{max-width:860px;margin:0 auto;padding:32px 24px}
.print-btn{position:fixed;bottom:24px;right:24px;background:#1a1f3c;color:#fff;border:none;border-radius:8px;padding:12px 20px;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.print-btn:hover{background:#2a3060}

/* TOC */
.toc{background:#f6f8fa;border:1px solid #e1e4e8;border-radius:8px;padding:20px 24px;margin-bottom:32px}
.toc h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#586069;margin-bottom:12px}
.toc ol{margin-left:20px}
.toc li{margin-bottom:4px}
.toc a{color:#0366d6;text-decoration:none;font-size:13px}
.toc a:hover{text-decoration:underline}

/* Sections */
h2{font-size:18px;font-weight:700;color:#1a1a2e;margin:32px 0 16px;padding-bottom:8px;border-bottom:2px solid #e1e4e8}
h3{font-size:14px;font-weight:700;color:#24292f;margin:18px 0 8px}
p{margin-bottom:10px;color:#444d56}
ul,ol{margin:8px 0 12px 20px}
li{margin-bottom:4px;color:#444d56}

/* Steps */
.step{display:flex;gap:16px;margin-bottom:16px;align-items:flex-start}
.step-num{flex-shrink:0;width:32px;height:32px;background:#1a1f3c;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.step-body h4{font-size:13px;font-weight:700;margin-bottom:4px}
.step-body p{margin-bottom:0;font-size:13px}

/* Callouts */
.callout{border-radius:6px;padding:12px 16px;margin:12px 0;font-size:13px}
.callout-info{background:#e8f4fd;border-left:4px solid #0366d6;color:#24292f}
.callout-warn{background:#fff8e1;border-left:4px solid #e36209;color:#24292f}
.callout-ok{background:#e6ffed;border-left:4px solid #28a745;color:#24292f}
.callout strong{font-weight:700}

/* Folder diagram */
.folder-tree{background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:14px 18px;font-family:'SF Mono',Consolas,monospace;font-size:12px;line-height:1.8;margin:10px 0}
.folder-tree .dir{color:#0366d6;font-weight:600}
.folder-tree .file{color:#444d56}
.folder-tree .note{color:#959da5;font-style:italic}

/* Field table */
.field-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
.field-table th{background:#f6f8fa;padding:7px 10px;text-align:left;font-weight:600;border:1px solid #e1e4e8;color:#586069;font-size:11px;text-transform:uppercase}
.field-table td{padding:6px 10px;border:1px solid #e1e4e8;vertical-align:top}
.field-table tr:nth-child(even) td{background:#fafbfc}
.badge-chg{display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600}
.bg-red{background:#ffeef0;color:#cb2431}
.bg-orange{background:#fff3cd;color:#b54800}
.bg-blue{background:#e8f4fd;color:#0366d6}
.bg-gray{background:#f6f8fa;color:#586069}

/* Screens (placeholder diagrams) */
.screen{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:20px;margin:12px 0;font-family:monospace;font-size:12px;color:#c9d1d9}
.screen .prompt{color:#58a6ff}
.screen .ok{color:#3fb950}
.screen .err{color:#f85149}
.screen .info{color:#8b949e}

footer{background:#f6f8fa;border-top:1px solid #e1e4e8;padding:16px 24px;text-align:center;font-size:11px;color:#959da5;margin-top:40px}
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <div class="version">Version 1.0</div>
  <h1>SEPA Konvertierer</h1>
  <div class="sub">Benutzerhandbuch — Schritt für Schritt</div>
  <div class="sub" style="font-size:13px;margin-top:4px">pain.008.001.01 → pain.008.001.08 · Österreich (STUZZA-Format)</div>
  <div class="meta" style="margin-top:24px">Erstellt: ${generatedAt}</div>
</div>

<div class="content">

  <!-- TOC -->
  <div class="toc">
    <h3>Inhaltsverzeichnis</h3>
    <ol>
      <li><a href="#s1">Was macht dieses Programm?</a></li>
      <li><a href="#s2">Installation (einmalig)</a></li>
      <li><a href="#s3">Programm starten</a></li>
      <li><a href="#s4">Eine XML-Datei konvertieren</a></li>
      <li><a href="#s5">Ergebnisse prüfen — Dashboard</a></li>
      <li><a href="#s6">Ordnerstruktur verstehen</a></li>
      <li><a href="#s7">Was wird beim Konvertieren geändert?</a></li>
      <li><a href="#s8">Fehlerbehandlung</a></li>
      <li><a href="#s9">Häufige Fragen (FAQ)</a></li>
    </ol>
  </div>

  <!-- 1 -->
  <h2 id="s1">1. Was macht dieses Programm?</h2>
  <p>Das <strong>SEPA-Konvertierer</strong>-Programm wandelt SEPA-Lastschrift-XML-Dateien automatisch vom <strong>alten Format (pain.008.001.01)</strong> in das <strong>neue, bankpflichtige Format (pain.008.001.08)</strong> um.</p>
  <div class="callout callout-info">
    <strong>Warum ist das nötig?</strong><br>
    Seit März 2024 akzeptieren österreichische Banken (und alle EU-Banken) nur noch das neue Format pain.008.001.08. Ältere Buchhaltungssysteme erstellen oft noch das alte Format. Dieses Tool erledigt die Umwandlung vollautomatisch.
  </div>
  <p>Das Programm überwacht einen Eingangsordner (<code>0.1</code>). Sobald eine XML-Datei dort abgelegt wird, wird sie automatisch konvertiert, validiert und das Ergebnis in den Ausgabeordner (<code>0.8</code>) gespeichert.</p>

  <!-- 2 -->
  <h2 id="s2">2. Installation (einmalig)</h2>
  <div class="callout callout-warn">
    <strong>Voraussetzung:</strong> Windows 10 oder Windows 11. Keine weitere Software erforderlich — kein Node.js, kein Java, nichts.
  </div>

  <h3>Schritt für Schritt:</h3>
  <div class="step"><div class="step-num">1</div><div class="step-body">
    <h4>ZIP-Datei herunterladen</h4>
    <p>Auf GitHub das Repository <strong>ALs-Bankkonvertierer</strong> öffnen und auf den grünen Button <strong>„Code" → „Download ZIP"</strong> klicken.</p>
  </div></div>

  <div class="step"><div class="step-num">2</div><div class="step-body">
    <h4>ZIP entpacken</h4>
    <p>Die heruntergeladene ZIP-Datei mit Rechtsklick → <strong>„Alle extrahieren"</strong> entpacken. Den entpackten Ordner an einen festen Speicherort verschieben, z.B. <code>C:\\SEPA-Konvertierer\\</code>.</p>
  </div></div>

  <div class="step"><div class="step-num">3</div><div class="step-body">
    <h4>Erste Ausführung</h4>
    <p>Doppelklick auf <strong>Bankkonvertierer-starten.bat</strong>. Beim ersten Start wird die EXE-Datei automatisch zusammengesetzt (dauert ca. 3 Sekunden). Danach startet das Programm sofort.</p>
  </div></div>

  <div class="callout callout-ok">
    <strong>Erfolgreich gestartet?</strong> Es erscheint ein schwarzes Fenster mit der Meldung „SEPA Konvertierer gestartet" und „Überwachung aktiv...". Das Programm läuft jetzt im Hintergrund.
  </div>

  <!-- 3 -->
  <h2 id="s3">3. Programm starten</h2>
  <p>Für jeden weiteren Start genügt ein Doppelklick auf <strong>Bankkonvertierer-starten.bat</strong>.</p>

  <div class="screen">
    <div><span class="prompt">C:\\SEPA-Konvertierer&gt;</span> Bankkonvertierer-starten.bat</div>
    <div class="ok">SEPA Konvertierer wird gestartet...</div>
    <div>&nbsp;</div>
    <div class="ok">🚀 SEPA Konvertierer gestartet</div>
    <div class="info">   Eingabe:  C:\\SEPA-Konvertierer\\0.1</div>
    <div class="info">   Ausgabe:  C:\\SEPA-Konvertierer\\0.8</div>
    <div class="info">   Fehler:   C:\\SEPA-Konvertierer\\fehler</div>
    <div class="info">   Bericht:  C:\\SEPA-Konvertierer\\dashboard.html</div>
    <div>&nbsp;</div>
    <div class="ok">👀 Überwachung aktiv... (Strg+C zum Beenden)</div>
  </div>

  <div class="callout callout-warn">
    <strong>Wichtig:</strong> Das schwarze Fenster muss während der Arbeit geöffnet bleiben. Beim Schließen des Fensters wird die Überwachung beendet.
  </div>

  <!-- 4 -->
  <h2 id="s4">4. Eine XML-Datei konvertieren</h2>

  <div class="step"><div class="step-num">1</div><div class="step-body">
    <h4>XML-Datei in den Eingangsordner kopieren</h4>
    <p>Die zu konvertierende pain.008.001.01-Datei in den Ordner <code>0.1</code> kopieren oder verschieben.</p>
  </div></div>

  <div class="step"><div class="step-num">2</div><div class="step-body">
    <h4>Automatische Verarbeitung abwarten</h4>
    <p>Das Programm erkennt die Datei innerhalb von 1–2 Sekunden und beginnt sofort mit der Konvertierung. Im schwarzen Fenster erscheinen Meldungen.</p>
  </div></div>

  <div class="screen">
    <div class="info">📄 Verarbeite: meine-datei.xml</div>
    <div class="ok">  ✓ Konvertierung erfolgreich</div>
    <div class="ok">  ✓ Buchungen: 5 — OK</div>
    <div class="ok">  ✓ Kontrollsumme: 1250.00 EUR — OK</div>
    <div class="info">  → Ausgabe: 0.8/meine-datei.08.xml</div>
    <div class="info">  → Archiviert: 0.1/archiv/meine-datei.xml</div>
    <div class="info">  📊 Bericht aktualisiert: dashboard.html</div>
  </div>

  <div class="step"><div class="step-num">3</div><div class="step-body">
    <h4>Konvertierte Datei abholen</h4>
    <p>Die fertige .08-Datei liegt im Ordner <code>0.8</code> unter dem Namen <code>dateiname.08.xml</code>.</p>
  </div></div>

  <!-- 5 -->
  <h2 id="s5">5. Ergebnisse prüfen — Dashboard</h2>
  <p>Im Programmordner wird nach jeder Konvertierung die Datei <strong>dashboard.html</strong> aktualisiert. Diese im Browser öffnen (Doppelklick) um alle Details zu sehen.</p>

  <h3>Die drei Bereiche des Dashboards:</h3>
  <ul>
    <li><strong>📋 Konvertierungen</strong> — Liste aller Konvertierungen mit Status, Datum und Buchungsanzahl. Klick auf „Details" zeigt Fehler und Warnungen.</li>
    <li><strong>🔍 Feldvergleich</strong> — Zeigt für jede Konvertierung ein Feld-für-Feld-Vergleich: links das Original (.01), mittig das konvertierte Format (.08), rechts die Bank-Konformitätsprüfung. Grün = korrekt umgewandelt.</li>
    <li><strong>📖 Dokumentation</strong> — Übersicht aller Feldänderungen, Namespace-Informationen und Validierungsregeln.</li>
  </ul>

  <div class="callout callout-info">
    <strong>Seite aktualisieren:</strong> Nach neuen Konvertierungen einfach im Browser <strong>Strg+R</strong> drücken um die neuesten Ergebnisse zu sehen.
  </div>

  <!-- 6 -->
  <h2 id="s6">6. Ordnerstruktur verstehen</h2>
  <div class="folder-tree">
    <div><span class="dir">SEPA-Konvertierer\\</span></div>
    <div>&nbsp;&nbsp;<span class="dir">0.1\\</span> <span class="note">← Eingang: Hier XML-Dateien ablegen</span></div>
    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="dir">archiv\\</span> <span class="note">← Erfolgreich verarbeitete Originaldateien</span></div>
    <div>&nbsp;&nbsp;<span class="dir">0.8\\</span> <span class="note">← Ausgang: Fertige .08.xml-Dateien</span></div>
    <div>&nbsp;&nbsp;<span class="dir">fehler\\</span> <span class="note">← Fehlerhafte Dateien zur Überprüfung</span></div>
    <div>&nbsp;&nbsp;<span class="dir">dist\\</span> <span class="note">← Programm-Teile (nicht öffnen)</span></div>
    <div>&nbsp;&nbsp;<span class="file">Bankkonvertierer-starten.bat</span> <span class="note">← Startdatei</span></div>
    <div>&nbsp;&nbsp;<span class="file">Bankconvertierer.exe</span> <span class="note">← Hauptprogramm (wird automatisch erstellt)</span></div>
    <div>&nbsp;&nbsp;<span class="file">dashboard.html</span> <span class="note">← Auswertung im Browser öffnen</span></div>
    <div>&nbsp;&nbsp;<span class="file">userguide.html</span> <span class="note">← Dieses Handbuch</span></div>
  </div>

  <!-- 7 -->
  <h2 id="s7">7. Was wird beim Konvertieren geändert?</h2>
  <p>Das Programm nimmt das alte österreichische STUZZA-Format und passt es an den aktuellen ISO-20022-Standard an. Die Daten (Beträge, IBANs, Namen, Mandatsreferenzen) bleiben unverändert — nur die XML-Struktur wird angepasst.</p>

  <table class="field-table">
    <thead><tr><th>Was ändert sich</th><th>Alt (.01)</th><th>Neu (.08)</th><th>Art</th></tr></thead>
    <tbody>
      <tr><td>XML-Namespace</td><td>APC:STUZZA:...001:01...</td><td>urn:iso:std:iso:20022...</td><td><span class="badge-chg bg-orange">geändert</span></td></tr>
      <tr><td>Root-Element</td><td>&lt;pain.008.001.01&gt;</td><td>&lt;CstmrDrctDbtInitn&gt;</td><td><span class="badge-chg bg-orange">umbenannt</span></td></tr>
      <tr><td>Grpg-Element</td><td>&lt;Grpg&gt;MIXD&lt;/Grpg&gt;</td><td>(entfernt)</td><td><span class="badge-chg bg-red">entfernt</span></td></tr>
      <tr><td>Bank-BIC (Gläubiger)</td><td>FinInstnId/BIC</td><td>FinInstnId/BICFI</td><td><span class="badge-chg bg-orange">umbenannt</span></td></tr>
      <tr><td>Bank-BIC (Schuldner)</td><td>FinInstnId/BIC</td><td>FinInstnId/BICFI</td><td><span class="badge-chg bg-orange">umbenannt</span></td></tr>
      <tr><td>Gläubiger-ID (Position)</td><td>innerhalb DrctDbtTx</td><td>auf PmtInf-Ebene</td><td><span class="badge-chg bg-blue">verschoben</span></td></tr>
      <tr><td>Gläubiger-ID (Struktur)</td><td>OthrId/Id + OthrId/IdTp</td><td>Othr/Id + Othr/SchmeNm/Prtry</td><td><span class="badge-chg bg-orange">umstrukturiert</span></td></tr>
      <tr><td>Alle anderen Felder</td><td colspan="2">Identisch übernommen</td><td><span class="badge-chg bg-gray">unverändert</span></td></tr>
    </tbody>
  </table>

  <!-- 8 -->
  <h2 id="s8">8. Fehlerbehandlung</h2>
  <h3>Datei im Ordner „fehler" gelandet?</h3>
  <p>Wenn eine Datei nicht korrekt konvertiert werden kann, landet sie im Ordner <code>fehler\\</code>. Das kann folgende Ursachen haben:</p>
  <ul>
    <li>Die Datei ist keine gültige XML-Datei (z.B. beschädigt oder falsches Format)</li>
    <li>Es fehlen Pflichtfelder wie Mandats-ID, IBAN oder BIC</li>
    <li>Die Datei ist kein pain.008.001.01-Format (z.B. schon im .08-Format)</li>
  </ul>
  <div class="callout callout-warn">
    <strong>Was tun?</strong> Im Dashboard unter „Konvertierungen" auf „Details" klicken, um den genauen Fehler zu sehen. Die Beschreibung zeigt welches Feld fehlt oder falsch ist.
  </div>

  <h3>Bekannte Fehlermeldungen:</h3>
  <table class="field-table">
    <thead><tr><th>Fehlermeldung</th><th>Bedeutung</th><th>Lösung</th></tr></thead>
    <tbody>
      <tr><td>Kein &lt;pain.008.001.01&gt;-Element gefunden</td><td>Falsches Eingabeformat</td><td>Nur .01-Dateien konvertieren</td></tr>
      <tr><td>Mandats-ID fehlt</td><td>Kein MndtId vorhanden</td><td>Datei in Quellsystem prüfen</td></tr>
      <tr><td>Gläubiger-Bank-BICFI fehlt</td><td>BIC des Gläubigers fehlt</td><td>BIC in der Quelldatei ergänzen</td></tr>
      <tr><td>Transaktionsanzahl: erwartet X, tatsächlich Y</td><td>NbOfTxs stimmt nicht</td><td>Quelldatei prüfen</td></tr>
    </tbody>
  </table>

  <!-- 9 -->
  <h2 id="s9">9. Häufige Fragen (FAQ)</h2>

  <h3>Muss ich Node.js installieren?</h3>
  <p>Nein. Das Programm ist eine eigenständige .exe-Datei und benötigt keine zusätzliche Software.</p>

  <h3>Kann ich mehrere Dateien gleichzeitig konvertieren?</h3>
  <p>Ja. Alle XML-Dateien, die im Ordner <code>0.1</code> liegen, werden nacheinander automatisch verarbeitet.</p>

  <h3>Wo finde ich die fertige Datei?</h3>
  <p>Im Ordner <code>0.8</code> unter dem Namen <code>originalname.08.xml</code>.</p>

  <h3>Was passiert mit der Originaldatei?</h3>
  <p>Bei erfolgreicher Konvertierung wird die Originaldatei in den Ordner <code>0.1\\archiv\\</code> verschoben. Bei einem Fehler kommt sie in den Ordner <code>fehler\\</code>.</p>

  <h3>Wie beende ich das Programm?</h3>
  <p>Das schwarze Fenster schließen oder darin <strong>Strg+C</strong> drücken. Das Programm zeigt dann eine kurze Zusammenfassung aller Konvertierungen.</p>

  <h3>Das Programm startet nicht (EXE-Fehler)?</h3>
  <p>Den Ordner <code>ALs-Bankkonvertierer-main</code> löschen und die ZIP-Datei neu von GitHub herunterladen und entpacken. Dann <code>Bankkonvertierer-starten.bat</code> erneut starten.</p>

</div>

<button class="print-btn no-print" onclick="window.print()">🖨 Als PDF speichern</button>

<footer>
  SEPA Konvertierer · pain.008.001.01 → pain.008.001.08 · Österreich (STUZZA) · ${generatedAt}
</footer>

</body>
</html>`;
}

module.exports = { generateUserGuide };
