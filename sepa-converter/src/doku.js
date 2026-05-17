'use strict';

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDt(iso) {
  try { return new Date(iso).toLocaleString('de-AT'); } catch { return esc(iso); }
}

function fmtAmt(n) {
  if (n == null || isNaN(n)) return '–';
  return new Intl.NumberFormat('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' EUR';
}

const FIELD_MAPPINGS = [
  // GrpHdr
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/MsgId',           dst: 'GrpHdr/MsgId',                       change: 'direkt',   note: 'Nachrichten-ID, unveränderter Wert' },
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/CreDtTm',         dst: 'GrpHdr/CreDtTm',                     change: 'direkt',   note: 'Erstellungszeitpunkt ISO 8601' },
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/NbOfTxs',         dst: 'GrpHdr/NbOfTxs',                     change: 'direkt',   note: 'Gesamtzahl Transaktionen' },
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/CtrlSum',         dst: 'GrpHdr/CtrlSum',                     change: 'direkt',   note: 'Gesamtsumme in EUR' },
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/Grpg',            dst: '(entfällt)',                          change: 'entfernt', note: 'Nicht in pain.008.001.08 vorhanden' },
  { group: 'GrpHdr – Nachrichtenkopf', src: 'GrpHdr/InitgPty/Nm',     dst: 'GrpHdr/InitgPty/Nm',                 change: 'direkt',   note: 'Name des Auftraggebers' },
  // PmtInf
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/PmtInfId',       dst: 'PmtInf/PmtInfId',                  change: 'direkt',   note: 'Zahlungsanweisungs-ID' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/PmtMtd',         dst: 'PmtInf/PmtMtd',                    change: 'direkt',   note: 'Zahlungsart (Wert: DD)' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/NbOfTxs',        dst: 'PmtInf/NbOfTxs',                   change: 'direkt',   note: 'Anzahl Transaktionen in dieser Gruppe' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/CtrlSum',        dst: 'PmtInf/CtrlSum',                   change: 'direkt',   note: 'Summe dieser Gruppe' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/PmtTpInf/SvcLvl/Cd',     dst: 'PmtInf/PmtTpInf/SvcLvl/Cd',       change: 'direkt', note: 'Servicelevel (Wert: SEPA)' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/PmtTpInf/LclInstrm/Cd',  dst: 'PmtInf/PmtTpInf/LclInstrm/Cd',   change: 'direkt', note: 'Lokales Instrument (CORE/B2B)' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/PmtTpInf/SeqTp',          dst: 'PmtInf/PmtTpInf/SeqTp',           change: 'direkt', note: 'Sequenztyp (FRST/RCUR/FNAL/OOFF)' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/ReqdColltnDt',   dst: 'PmtInf/ReqdColltnDt',               change: 'direkt',   note: 'Fälligkeitsdatum YYYY-MM-DD' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/Cdtr/Nm',        dst: 'PmtInf/Cdtr/Nm',                   change: 'direkt',   note: 'Name des Gläubigers' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/CdtrAcct/Id/IBAN', dst: 'PmtInf/CdtrAcct/Id/IBAN',       change: 'direkt',   note: 'IBAN des Gläubigers' },
  { group: 'PmtInf – Zahlungsanweisung', src: 'PmtInf/CdtrAgt/FinInstnId/<b>BIC</b>',  dst: 'PmtInf/CdtrAgt/FinInstnId/<b>BICFI</b>',  change: 'umbenannt', note: 'Gläubiger-Bank: BIC → BICFI' },
  // DrctDbtTxInf
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'PmtId/EndToEndId',            dst: 'PmtId/EndToEndId',              change: 'direkt',   note: 'End-to-End Referenz' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'InstdAmt @Ccy',               dst: 'InstdAmt @Ccy',                 change: 'direkt',   note: 'Betrag mit Währungsattribut' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DrctDbtTx/MndtRltdInf/MndtId',     dst: 'DrctDbtTx/MndtRltdInf/MndtId',   change: 'direkt', note: 'Mandatsreferenz' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DrctDbtTx/MndtRltdInf/DtOfSgntr',  dst: 'DrctDbtTx/MndtRltdInf/DtOfSgntr', change: 'direkt', note: 'Datum der Mandatsunterzeichnung' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DrctDbtTx/MndtRltdInf/AmdmntInd', dst: 'DrctDbtTx/MndtRltdInf/AmdmntInd', change: 'direkt', note: 'Änderungskennzeichen (optional)' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DrctDbtTx/CdtrSchmeId/…/PrvtId/<b>OthrId/Id</b>',   dst: 'DrctDbtTx/CdtrSchmeId/…/PrvtId/<b>Othr/Id</b>',              change: 'umstrukturiert', note: 'Gläubiger-ID: OthrId → Othr' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DrctDbtTx/CdtrSchmeId/…/PrvtId/<b>OthrId/IdTp</b>', dst: 'DrctDbtTx/CdtrSchmeId/…/PrvtId/<b>Othr/SchmeNm/Prtry</b>',  change: 'umstrukturiert', note: 'Schema-Name: IdTp → SchmeNm/Prtry' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DbtrAgt/FinInstnId/<b>BIC</b>',    dst: 'DbtrAgt/FinInstnId/<b>BICFI</b>',  change: 'umbenannt', note: 'Schuldner-Bank: BIC → BICFI' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'Dbtr/Nm',                     dst: 'Dbtr/Nm',                       change: 'direkt',   note: 'Name des Schuldners' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'DbtrAcct/Id/IBAN',            dst: 'DbtrAcct/Id/IBAN',              change: 'direkt',   note: 'IBAN des Schuldners' },
  { group: 'DrctDbtTxInf – Einzeltransaktion', src: 'RmtInf/Ustrd',                dst: 'RmtInf/Ustrd',                  change: 'direkt',   note: 'Verwendungszweck (unstrukturiert)' },
];

const CHANGE_BADGE = {
  direkt:          '<span class="badge b-ok">direkt</span>',
  entfernt:        '<span class="badge b-del">entfernt</span>',
  umbenannt:       '<span class="badge b-ren">umbenannt</span>',
  umstrukturiert:  '<span class="badge b-rst">umstrukturiert</span>',
};

function buildMappingTable() {
  let lastGroup = '';
  return FIELD_MAPPINGS.map(m => {
    const isNew = m.group !== lastGroup;
    lastGroup = m.group;
    const groupCell = isNew
      ? `<td class="grp-cell" rowspan="${FIELD_MAPPINGS.filter(x => x.group === m.group).length}">${esc(m.group)}</td>`
      : '';
    return `<tr${isNew ? ' class="group-first"' : ''}>
      ${groupCell}
      <td class="mono sm">${m.src}</td>
      <td class="arr">→</td>
      <td class="mono sm">${m.dst}</td>
      <td>${CHANGE_BADGE[m.change] || m.change}</td>
      <td class="note">${m.note}</td>
    </tr>`;
  }).join('');
}

function buildLogRows(results) {
  if (!results || results.length === 0) {
    return '<tr><td colspan="7" class="empty">Noch keine Konvertierungen durchgeführt</td></tr>';
  }
  return [...results].reverse().map((r, i) => {
    const isOk  = r.status === 'ok';
    const sum   = r.validation && r.validation.summary;
    const wCnt  = r.validation ? r.validation.warnings.length : 0;
    const eCnt  = r.validation ? r.validation.errors.length   : 0;

    const statusCell = isOk
      ? `<span class="badge b-ok">✓ OK${wCnt > 0 ? ` (${wCnt} Warn.)` : ''}</span>`
      : `<span class="badge b-del">✗ Fehler</span>`;

    const txCell = sum
      ? (sum.txCountMatch
          ? `<span class="badge b-ok">${sum.txCount}</span>`
          : `<span class="badge b-del">${sum.txCount}/${sum.expectedTxCount}</span>`)
      : '<span class="na">–</span>';

    const csCell = sum
      ? (sum.ctrlSumMatch
          ? `<span class="badge b-ok">${fmtAmt(sum.ctrlSum)}</span>`
          : `<span class="badge b-del">${fmtAmt(sum.ctrlSum)} ≠ ${fmtAmt(sum.expectedCtrlSum)}</span>`)
      : '<span class="na">–</span>';

    const issues = [];
    if (r.error && !r.validation) issues.push(`<div class="log-err">⚠ ${esc(r.error)}</div>`);
    if (r.validation) {
      r.validation.errors.slice(0, 3).forEach(e =>
        issues.push(`<div class="log-err">✗ ${esc(e.field)}: ${esc(e.message)}</div>`));
      r.validation.warnings.slice(0, 2).forEach(w =>
        issues.push(`<div class="log-warn">⚠ ${esc(w.field)}: ${esc(w.message)}</div>`));
      if (eCnt > 3) issues.push(`<div class="log-err">… +${eCnt - 3} weitere Fehler</div>`);
    }

    const fname  = esc(r.filename || (r.inputFile || '').split(/[/\\]/).pop());
    const outname = isOk ? fname.replace(/\.xml$/i, '.08.xml') : '–';

    return `<tr class="${isOk ? 'log-ok' : 'log-fail'}">
      <td class="mono sm">${fmtDt(r.timestamp)}</td>
      <td>${statusCell}</td>
      <td class="fn" title="${esc(r.inputFile)}">${fname}</td>
      <td class="fn mono sm">${outname}</td>
      <td>${txCell}</td>
      <td>${csCell}</td>
      <td>${issues.join('') || '<span class="na">–</span>'}</td>
    </tr>`;
  }).join('');
}

function generateDoku(results, generatedAt) {
  const ts    = generatedAt || new Date().toISOString();
  const total = results.length;
  const ok    = results.filter(r => r.status === 'ok').length;
  const err   = total - ok;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SEPA Konvertierer – Dokumentation &amp; Log</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f0f2f5;--surface:#fff;--border:#e5e7eb;--text:#111827;
  --muted:#6b7280;--code-bg:#1e293b;--code-fg:#e2e8f0;
  --ok:#16a34a;--ok-bg:#dcfce7;--del:#dc2626;--del-bg:#fee2e2;
  --ren:#d97706;--ren-bg:#fef3c7;--rst:#7c3aed;--rst-bg:#ede9fe;
  --accent:#2563eb;
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;font-size:15px}

/* ── NAV ── */
nav{background:var(--code-bg);color:#f8fafc;padding:14px 32px;display:flex;align-items:center;gap:24px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.3)}
nav .logo{font-weight:800;font-size:1.1rem;letter-spacing:-.02em}
nav a{color:#94a3b8;text-decoration:none;font-size:.85rem;transition:color .15s}
nav a:hover{color:#f8fafc}
.nav-badge{background:#334155;color:#94a3b8;padding:2px 8px;border-radius:99px;font-size:.72rem;margin-left:auto}

/* ── LAYOUT ── */
.container{max-width:1200px;margin:0 auto;padding:40px 24px}
section{margin-bottom:48px}
h2{font-size:1.3rem;font-weight:700;color:var(--text);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--border);display:flex;align-items:center;gap:8px}
h3{font-size:1rem;font-weight:600;color:var(--text);margin:20px 0 10px}
p{color:var(--muted);margin-bottom:12px;font-size:.9rem}

/* ── CARDS ── */
.card{background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.card+.card{margin-top:16px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.info-card{background:var(--surface);border-radius:10px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06);border-left:4px solid var(--accent)}
.info-card.gr{border-color:var(--ok)}.info-card.rd{border-color:var(--del)}.info-card.yl{border-color:var(--ren)}.info-card.pu{border-color:var(--rst)}
.info-card .num{font-size:2rem;font-weight:800;color:var(--accent)}
.info-card.gr .num{color:var(--ok)}.info-card.rd .num{color:var(--del)}.info-card.yl .num{color:var(--ren)}.info-card.pu .num{color:var(--rst)}
.info-card .lbl{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}

/* ── NS BOXES ── */
.ns-box{border-radius:8px;padding:14px 16px;font-family:monospace;font-size:.78rem;word-break:break-all;line-height:1.7}
.ns-01{background:#fef3c7;border:1px solid #f59e0b;color:#78350f}
.ns-08{background:#dcfce7;border:1px solid #22c55e;color:#14532d}
.ns-label{font-family:-apple-system,sans-serif;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;opacity:.7}

/* ── CHANGES LIST ── */
.change-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.change-list li{background:var(--surface);border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.06);display:flex;gap:12px;align-items:flex-start}
.change-list li .icon{font-size:1.1rem;margin-top:1px;flex-shrink:0}
.change-list li .body{flex:1}
.change-list li .title{font-weight:600;font-size:.88rem;margin-bottom:4px}
.change-list li .desc{font-size:.82rem;color:var(--muted)}

/* ── XML EXAMPLE ── */
.xml-compare{display:grid;grid-template-columns:1fr 1fr;gap:1px;border-radius:10px;overflow:hidden;border:1px solid var(--border)}
.xml-pane{background:var(--code-bg);padding:16px}
.xml-pane .xml-title{color:#64748b;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.xml-pane pre{color:var(--code-fg);font-size:.75rem;line-height:1.7;overflow-x:auto;white-space:pre}
.hl-tag{color:#7dd3fc}.hl-attr{color:#a5f3fc}.hl-val{color:#86efac}.hl-cmt{color:#64748b;font-style:italic}
.hl-del{color:#fca5a5;background:rgba(239,68,68,.15);border-radius:3px;padding:1px 4px}
.hl-add{color:#86efac;background:rgba(34,197,94,.15);border-radius:3px;padding:1px 4px}

/* ── MAPPING TABLE ── */
.wrap{background:var(--surface);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:.82rem}
th{background:var(--code-bg);color:#f8fafc;text-align:left;padding:10px 12px;font-weight:600;font-size:.75rem;letter-spacing:.04em;white-space:nowrap}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.grp-cell{background:#f8fafc;font-weight:600;font-size:.78rem;color:#374151;border-right:2px solid var(--border);white-space:nowrap;vertical-align:top}
tr.group-first td,.grp-cell{border-top:2px solid var(--border)}
.arr{color:var(--muted);font-weight:700;text-align:center;padding:0 4px}
.mono{font-family:monospace}.sm{font-size:.78rem}
.note{color:var(--muted);font-size:.78rem;max-width:280px}
.fn{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.na{color:#9ca3af;font-size:.82rem}

/* ── BADGES ── */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700;white-space:nowrap}
.b-ok{background:var(--ok-bg);color:var(--ok)}
.b-del{background:var(--del-bg);color:var(--del)}
.b-ren{background:var(--ren-bg);color:var(--ren)}
.b-rst{background:var(--rst-bg);color:var(--rst)}

/* ── LOG ── */
.log-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.log-counter{display:flex;gap:8px}
.pulse{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.log-ok td{background:#f0fdf4}.log-fail td{background:#fef2f2}
.log-fail td:first-child{border-left:3px solid var(--del)}
.log-ok  td:first-child{border-left:3px solid var(--ok)}
.log-err{font-size:.72rem;color:var(--del)}.log-warn{font-size:.72rem;color:var(--ren)}
.empty{text-align:center;padding:48px;color:var(--muted);font-size:.9rem}
.ts{font-size:.77rem;color:var(--muted)}

/* ── FOOTER ── */
footer{text-align:center;color:var(--muted);font-size:.75rem;padding:24px;border-top:1px solid var(--border);margin-top:24px}
@media(max-width:700px){.two-col,.xml-compare{grid-template-columns:1fr}nav a:not(.logo){display:none}}
</style>
</head>
<body>

<nav>
  <span class="logo">⚡ SEPA Konvertierer</span>
  <a href="#uebersicht">Übersicht</a>
  <a href="#aenderungen">Änderungen</a>
  <a href="#felder">Feldmapping</a>
  <a href="#beispiel">XML-Beispiel</a>
  <a href="#log">Live-Log</a>
  <span class="nav-badge">pain.008.001.01 → pain.008.001.08</span>
</nav>

<div class="container">

<!-- ══════════════════════════════ ÜBERSICHT ══════════════════════════════ -->
<section id="uebersicht">
<h2>📋 Übersicht</h2>
<p>Dieses Tool konvertiert SEPA Direct Debit XML-Dateien vom <strong>österreichischen STUZZA-Format</strong> (pain.008.001.01) in das <strong>EU-Pflichtformat</strong> pain.008.001.08, das seit März 2024 für alle SEPA-Lastschriften vorgeschrieben ist.</p>

<div class="info-grid">
  <div class="info-card gr"><div class="num">${ok}</div><div class="lbl">Erfolgreich konvertiert</div></div>
  <div class="info-card rd"><div class="num">${err}</div><div class="lbl">Fehlgeschlagen</div></div>
  <div class="info-card yl"><div class="num">4</div><div class="lbl">Strukturelle Änderungen</div></div>
  <div class="info-card pu"><div class="num">${FIELD_MAPPINGS.length}</div><div class="lbl">Gemappte Felder</div></div>
</div>

<h3>Namespaces</h3>
<div class="two-col">
  <div>
    <div class="ns-box ns-01">
      <div class="ns-label">pain.008.001.01 (Eingang – STUZZA)</div>
      APC:STUZZA:payments:ISO:pain:008:001:01:austrian:002
    </div>
  </div>
  <div>
    <div class="ns-box ns-08">
      <div class="ns-label">pain.008.001.08 (Ausgang – ISO 20022)</div>
      urn:iso:std:iso:20022:tech:xsd:pain.008.001.08
    </div>
  </div>
</div>

<h3 style="margin-top:24px">Verarbeitungsablauf</h3>
<div class="card">
  <div style="display:flex;gap:0;align-items:stretch;flex-wrap:wrap">
    ${[
      ['📥','0.1/', 'Eingangsordner','XML-Datei wird erkannt (Chokidar-Watcher, depth:0, 1500ms Stabilität)','#dbeafe','#1e40af'],
      ['⚙️','Konvertierung','Transformation','fast-xml-parser parst 01-Format, xmlbuilder2 baut 08-Format auf','#f3e8ff','#6b21a8'],
      ['✅','Validierung','Strukturprüfung','Pflichtfelder, IBAN-Format, BIC-Format, NbOfTxs, CtrlSum-Abgleich','#dcfce7','#14532d'],
      ['📤','0.8/','Ausgabe','Konvertierte Datei als <original>.08.xml gespeichert','#dcfce7','#14532d'],
      ['🗄️','0.1/archiv/','Archiv','Original wird archiviert (mit Timestamp bei Namenskonflikt)','#f0f9ff','#0c4a6e'],
    ].map(([icon,label,title,desc,bg,col],i,arr) => `
    <div style="flex:1;min-width:140px;padding:16px;background:${bg};border-right:${i<arr.length-1?'1px solid rgba(0,0,0,.08)':'none'}">
      <div style="font-size:1.4rem;margin-bottom:6px">${icon}</div>
      <div style="font-family:monospace;font-size:.75rem;color:${col};font-weight:700;margin-bottom:4px">${label}</div>
      <div style="font-weight:600;font-size:.82rem;margin-bottom:4px">${title}</div>
      <div style="font-size:.75rem;color:#4b5563">${desc}</div>
    </div>`).join('<div style="font-size:1.2rem;display:flex;align-items:center;padding:0 4px;color:#9ca3af">›</div>')}
  </div>
</div>
</section>

<!-- ══════════════════════════════ ÄNDERUNGEN ══════════════════════════════ -->
<section id="aenderungen">
<h2>🔄 Strukturelle Änderungen im Detail</h2>
<p>Diese vier Transformationen unterscheiden pain.008.001.08 vom österreichischen STUZZA-Format. Alle anderen Felder werden direkt übernommen.</p>

<ul class="change-list">
  <li>
    <span class="icon">🗑️</span>
    <div class="body">
      <div class="title">&lt;Grpg&gt; entfernt <span class="badge b-del">entfernt</span></div>
      <div class="desc">Das Element <code>GrpHdr/Grpg</code> (Wert z.B. "MIXD") existiert in pain.008.001.08 nicht mehr. Es wird beim Aufbau der Ausgabe einfach weggelassen. Alle anderen GrpHdr-Felder bleiben unverändert.</div>
    </div>
  </li>
  <li>
    <span class="icon">🏦</span>
    <div class="body">
      <div class="title">BIC → BICFI <span class="badge b-ren">umbenannt</span></div>
      <div class="desc">In pain.008.001.08 heißt das BIC-Element <code>&lt;BICFI&gt;</code> statt <code>&lt;BIC&gt;</code>. Dies betrifft <strong>zwei Stellen</strong>: die Gläubiger-Bank (<code>CdtrAgt/FinInstnId</code>) und die Schuldner-Bank (<code>DbtrAgt/FinInstnId</code>) in jeder Transaktion. Der Wert (z.B. "BKAUATWW") bleibt unverändert.</div>
    </div>
  </li>
  <li>
    <span class="icon">🆔</span>
    <div class="body">
      <div class="title">CdtrSchmeId: OthrId → Othr <span class="badge b-rst">umstrukturiert</span></div>
      <div class="desc">Die Gläubiger-ID (österr. AT-Creditor-Identifier) wird umstrukturiert. Im STUZZA-Format liegt sie unter <code>PrvtId/OthrId/Id</code> mit Typ in <code>OthrId/IdTp</code>. In pain.008.001.08 wird sie zu <code>PrvtId/Othr/Id</code> mit dem Schema-Namen unter <code>Othr/SchmeNm/Prtry</code>. Diese Umstrukturierung erfolgt <strong>pro Transaktion</strong> (CdtrSchmeId liegt in DrctDbtTxInf, nicht auf PmtInf-Ebene).</div>
    </div>
  </li>
  <li>
    <span class="icon">📄</span>
    <div class="body">
      <div class="title">Root-Element und Namespace <span class="badge b-rst">umstrukturiert</span></div>
      <div class="desc">Das Root-Element wechselt von <code>&lt;pain.008.001.01&gt;</code> zu <code>&lt;Document&gt;&lt;CstmrDrctDbtInitn&gt;</code>. Der Namespace ändert sich vom STUZZA-spezifischen Wert auf den ISO-20022-Standard-Namespace. Die innere Struktur (GrpHdr, PmtInf, DrctDbtTxInf) bleibt gleich.</div>
    </div>
  </li>
</ul>
</section>

<!-- ══════════════════════════════ XML-BEISPIEL ══════════════════════════════ -->
<section id="beispiel">
<h2>📝 XML-Beispiel: Vorher / Nachher</h2>
<p>Ausschnitt der kritischen Transformationspunkte in der CdtrSchmeId und den BIC-Feldern.</p>

<h3>1. Root-Element &amp; Namespace</h3>
<div class="xml-compare">
  <div class="xml-pane">
    <div class="xml-title">Eingang – pain.008.001.01 (STUZZA)</div>
    <pre><span class="hl-cmt">&lt;!-- Namespace: STUZZA-spezifisch --&gt;</span>
<span class="hl-tag">&lt;pain.008.001.01</span>
  <span class="hl-attr">xmlns</span>=<span class="hl-val">"APC:STUZZA:payments:ISO:</span>
<span class="hl-val">  pain:008:001:01:austrian:002"</span><span class="hl-tag">&gt;</span>
  <span class="hl-tag">&lt;GrpHdr&gt;</span>
    <span class="hl-tag">&lt;MsgId&gt;</span>MSG-001<span class="hl-tag">&lt;/MsgId&gt;</span>
    <span class="hl-del">&lt;Grpg&gt;MIXD&lt;/Grpg&gt;</span>
  <span class="hl-tag">&lt;/GrpHdr&gt;</span>
<span class="hl-tag">&lt;/pain.008.001.01&gt;</span></pre>
  </div>
  <div class="xml-pane">
    <div class="xml-title">Ausgang – pain.008.001.08 (ISO 20022)</div>
    <pre><span class="hl-cmt">&lt;!-- Namespace: ISO 20022 Standard --&gt;</span>
<span class="hl-tag">&lt;Document</span>
  <span class="hl-attr">xmlns</span>=<span class="hl-val">"urn:iso:std:iso:20022:</span>
<span class="hl-val">  tech:xsd:pain.008.001.08"</span><span class="hl-tag">&gt;</span>
<span class="hl-tag"> &lt;CstmrDrctDbtInitn&gt;</span>
  <span class="hl-tag">&lt;GrpHdr&gt;</span>
    <span class="hl-tag">&lt;MsgId&gt;</span>MSG-001<span class="hl-tag">&lt;/MsgId&gt;</span>
    <span class="hl-add">&lt;!-- Grpg entfernt --&gt;</span>
  <span class="hl-tag">&lt;/GrpHdr&gt;</span>
 <span class="hl-tag">&lt;/CstmrDrctDbtInitn&gt;</span>
<span class="hl-tag">&lt;/Document&gt;</span></pre>
  </div>
</div>

<h3 style="margin-top:20px">2. BIC → BICFI (Bankkennung)</h3>
<div class="xml-compare">
  <div class="xml-pane">
    <div class="xml-title">Eingang – pain.008.001.01</div>
    <pre><span class="hl-tag">&lt;CdtrAgt&gt;</span>
  <span class="hl-tag">&lt;FinInstnId&gt;</span>
    <span class="hl-del">&lt;BIC&gt;</span>BKAUATWW<span class="hl-del">&lt;/BIC&gt;</span>
  <span class="hl-tag">&lt;/FinInstnId&gt;</span>
<span class="hl-tag">&lt;/CdtrAgt&gt;</span>

<span class="hl-tag">&lt;DbtrAgt&gt;</span>
  <span class="hl-tag">&lt;FinInstnId&gt;</span>
    <span class="hl-del">&lt;BIC&gt;</span>RVVGAT2B<span class="hl-del">&lt;/BIC&gt;</span>
  <span class="hl-tag">&lt;/FinInstnId&gt;</span>
<span class="hl-tag">&lt;/DbtrAgt&gt;</span></pre>
  </div>
  <div class="xml-pane">
    <div class="xml-title">Ausgang – pain.008.001.08</div>
    <pre><span class="hl-tag">&lt;CdtrAgt&gt;</span>
  <span class="hl-tag">&lt;FinInstnId&gt;</span>
    <span class="hl-add">&lt;BICFI&gt;</span>BKAUATWW<span class="hl-add">&lt;/BICFI&gt;</span>
  <span class="hl-tag">&lt;/FinInstnId&gt;</span>
<span class="hl-tag">&lt;/CdtrAgt&gt;</span>

<span class="hl-tag">&lt;DbtrAgt&gt;</span>
  <span class="hl-tag">&lt;FinInstnId&gt;</span>
    <span class="hl-add">&lt;BICFI&gt;</span>RVVGAT2B<span class="hl-add">&lt;/BICFI&gt;</span>
  <span class="hl-tag">&lt;/FinInstnId&gt;</span>
<span class="hl-tag">&lt;/DbtrAgt&gt;</span></pre>
  </div>
</div>

<h3 style="margin-top:20px">3. CdtrSchmeId – Gläubiger-ID Umstrukturierung</h3>
<div class="xml-compare">
  <div class="xml-pane">
    <div class="xml-title">Eingang – pain.008.001.01 (STUZZA)</div>
    <pre><span class="hl-tag">&lt;DrctDbtTx&gt;</span>
  <span class="hl-tag">&lt;CdtrSchmeId&gt;</span>
    <span class="hl-tag">&lt;Id&gt;</span>
      <span class="hl-tag">&lt;PrvtId&gt;</span>
        <span class="hl-del">&lt;OthrId&gt;</span>
          <span class="hl-tag">&lt;Id&gt;</span>AT7ZZZ12345<span class="hl-tag">&lt;/Id&gt;</span>
          <span class="hl-del">&lt;IdTp&gt;</span>SEPA<span class="hl-del">&lt;/IdTp&gt;</span>
        <span class="hl-del">&lt;/OthrId&gt;</span>
      <span class="hl-tag">&lt;/PrvtId&gt;</span>
    <span class="hl-tag">&lt;/Id&gt;</span>
  <span class="hl-tag">&lt;/CdtrSchmeId&gt;</span>
<span class="hl-tag">&lt;/DrctDbtTx&gt;</span></pre>
  </div>
  <div class="xml-pane">
    <div class="xml-title">Ausgang – pain.008.001.08</div>
    <pre><span class="hl-tag">&lt;DrctDbtTx&gt;</span>
  <span class="hl-tag">&lt;CdtrSchmeId&gt;</span>
    <span class="hl-tag">&lt;Id&gt;</span>
      <span class="hl-tag">&lt;PrvtId&gt;</span>
        <span class="hl-add">&lt;Othr&gt;</span>
          <span class="hl-tag">&lt;Id&gt;</span>AT7ZZZ12345<span class="hl-tag">&lt;/Id&gt;</span>
          <span class="hl-add">&lt;SchmeNm&gt;</span>
            <span class="hl-add">&lt;Prtry&gt;</span>SEPA<span class="hl-add">&lt;/Prtry&gt;</span>
          <span class="hl-add">&lt;/SchmeNm&gt;</span>
        <span class="hl-add">&lt;/Othr&gt;</span>
      <span class="hl-tag">&lt;/PrvtId&gt;</span>
    <span class="hl-tag">&lt;/Id&gt;</span>
  <span class="hl-tag">&lt;/CdtrSchmeId&gt;</span>
<span class="hl-tag">&lt;/DrctDbtTx&gt;</span></pre>
  </div>
</div>
</section>

<!-- ══════════════════════════════ FELDMAPPING ══════════════════════════════ -->
<section id="felder">
<h2>🗺️ Vollständiges Feldmapping</h2>
<p>Alle ${FIELD_MAPPINGS.length} gemappten Felder von pain.008.001.01 nach pain.008.001.08. Legende: <span class="badge b-ok">direkt</span> = Wert 1:1 übernommen &nbsp; <span class="badge b-del">entfernt</span> = Feld existiert nicht mehr &nbsp; <span class="badge b-ren">umbenannt</span> = Elementname geändert &nbsp; <span class="badge b-rst">umstrukturiert</span> = Struktur geändert</p>
<div class="wrap">
<table>
<thead><tr>
  <th>Gruppe</th>
  <th>Quellfeld (pain.008.001.01)</th>
  <th></th>
  <th>Zielfeld (pain.008.001.08)</th>
  <th>Änderung</th>
  <th>Hinweis</th>
</tr></thead>
<tbody>
${buildMappingTable()}
</tbody>
</table>
</div>
</section>

<!-- ══════════════════════════════ VALIDIERUNG ══════════════════════════════ -->
<section id="validierung">
<h2>✅ Validierungsregeln</h2>
<div class="two-col">
  <div class="card">
    <h3>Pflichtfelder</h3>
    <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;margin-top:8px">
      ${[
        ['GrpHdr','MsgId, CreDtTm, NbOfTxs, CtrlSum, InitgPty/Nm'],
        ['PmtInf','PmtInfId, PmtMtd, NbOfTxs, CtrlSum, PmtTpInf, ReqdColltnDt, Cdtr/Nm, CdtrAcct, CdtrAgt'],
        ['DrctDbtTxInf','PmtId/EndToEndId, InstdAmt, MndtRltdInf, CdtrSchmeId, DbtrAgt, Dbtr/Nm, DbtrAcct'],
      ].map(([g,f]) => `<li style="font-size:.82rem"><strong>${g}:</strong> <span style="color:var(--muted)">${f}</span></li>`).join('')}
    </ul>
  </div>
  <div class="card">
    <h3>Format-Validierung</h3>
    <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;margin-top:8px">
      ${[
        ['IBAN','[A-Z]{2}[0-9]{2}[A-Z0-9]{11–30}'],
        ['BIC(FI)','[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?'],
        ['CtrlSum','Summe aller InstdAmt ±0.005 EUR Toleranz'],
        ['NbOfTxs','Anzahl DrctDbtTxInf-Elemente muss übereinstimmen'],
        ['Datum','ISO 8601 (YYYY-MM-DD)'],
        ['Betrag','Positiv, max. 2 Dezimalstellen'],
      ].map(([l,v]) => `<li style="font-size:.82rem"><strong>${l}:</strong> <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:.75rem">${v}</code></li>`).join('')}
    </ul>
  </div>
</div>
</section>

<!-- ══════════════════════════════ LOG ══════════════════════════════ -->
<section id="log">
<div class="log-header">
  <h2 style="border:none;margin:0;padding:0">📊 Konvertierungs-Log</h2>
  <div style="display:flex;align-items:center;gap:6px;margin-left:auto">
    <div class="pulse"></div>
    <span style="font-size:.8rem;color:var(--muted)">Seite neu laden für aktuellen Stand</span>
  </div>
  <div class="log-counter">
    <span class="badge b-ok">${ok} OK</span>
    <span class="badge b-del">${err} Fehler</span>
  </div>
</div>
<p>Neueste Einträge zuerst. Erstellt: ${fmtDt(ts)}</p>
<div class="wrap">
<table>
<thead><tr>
  <th>Zeitpunkt</th><th>Status</th><th>Quelldatei</th><th>Ausgabedatei</th>
  <th>Buchungen</th><th>Kontrollsumme</th><th>Meldungen</th>
</tr></thead>
<tbody>
${buildLogRows(results)}
</tbody>
</table>
</div>
</section>

</div><!-- /container -->

<footer>
  SEPA pain.008 Konvertierer &nbsp;·&nbsp; pain.008.001.01 (STUZZA) → pain.008.001.08 (ISO 20022) &nbsp;·&nbsp;
  Erstellt: ${fmtDt(ts)} &nbsp;·&nbsp; ${total} Konvertierung${total !== 1 ? 'en' : ''} gesamt
</footer>

</body>
</html>`;
}

module.exports = { generateDoku };
