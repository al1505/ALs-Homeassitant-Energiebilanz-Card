'use strict';

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const INPUT_DIR  = 'Eingabe-pain.008.001.01';
const OUTPUT_DIR = 'Konvertiert-pain.008.001.08';

const DOC_MAPPINGS = [
  { von: 'pain.008.001.01 (STUZZA)',    nach: 'CstmrDrctDbtInitn',              typ: 'umbenennung', notiz: 'Root-Element' },
  { von: 'GrpHdr/Grpg',                nach: '(entfernt)',                      typ: 'entfernt',    notiz: 'Nicht in .08 vorhanden' },
  { von: 'CdtrAgt/FinInstnId/BIC',     nach: 'CdtrAgt/FinInstnId/BICFI',       typ: 'umbenennung', notiz: '' },
  { von: 'DbtrAgt/FinInstnId/BIC',     nach: 'DbtrAgt/FinInstnId/BICFI',       typ: 'umbenennung', notiz: '' },
  { von: 'DrctDbtTx/CdtrSchmeId',      nach: 'PmtInf/CdtrSchmeId',             typ: 'verschoben',  notiz: 'Von Transaktionsebene auf PmtInf-Ebene' },
  { von: 'CdtrSchmeId/OthrId/Id',      nach: 'CdtrSchmeId/Othr/Id',            typ: 'umbenennung', notiz: 'OthrId → Othr' },
  { von: 'CdtrSchmeId/OthrId/IdTp',   nach: 'CdtrSchmeId/Othr/SchmeNm/Prtry', typ: 'umbenennung', notiz: 'Umstrukturierung' },
  { von: 'Dbtr/PstlAdr (alle Felder)', nach: 'Dbtr/PstlAdr (alle Felder)',     typ: 'unveraendert', notiz: 'XSD-Reihenfolge beachten' },
  { von: 'GrpHdr/MsgId',               nach: 'GrpHdr/MsgId',                   typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/CreDtTm',             nach: 'GrpHdr/CreDtTm',                 typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/NbOfTxs',             nach: 'GrpHdr/NbOfTxs',                 typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/CtrlSum',             nach: 'GrpHdr/CtrlSum',                 typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/InitgPty/Nm',         nach: 'GrpHdr/InitgPty/Nm',             typ: 'unveraendert', notiz: '' },
  { von: 'PmtInf/PmtInfId',            nach: 'PmtInf/PmtInfId',                typ: 'unveraendert', notiz: '' },
  { von: 'PmtInf/PmtMtd',              nach: 'PmtInf/PmtMtd',                  typ: 'unveraendert', notiz: 'Wert: "DD"' },
  { von: 'PmtTpInf/LclInstrm/Cd',      nach: 'PmtTpInf/LclInstrm/Cd',          typ: 'unveraendert', notiz: '"CORE" oder "B2B"' },
  { von: 'PmtTpInf/SeqTp',             nach: 'PmtTpInf/SeqTp',                 typ: 'unveraendert', notiz: '"FRST"/"RCUR"/"OOFF"/"FNAL"' },
  { von: 'ReqdColltnDt',               nach: 'ReqdColltnDt',                   typ: 'unveraendert', notiz: 'ISO-Datum YYYY-MM-DD' },
  { von: 'Cdtr/Nm',                    nach: 'Cdtr/Nm',                        typ: 'unveraendert', notiz: '' },
  { von: 'CdtrAcct/Id/IBAN',           nach: 'CdtrAcct/Id/IBAN',               typ: 'unveraendert', notiz: '' },
  { von: 'DrctDbtTx/MndtRltdInf/MndtId',    nach: 'DrctDbtTx/MndtRltdInf/MndtId',    typ: 'unveraendert', notiz: '' },
  { von: 'DrctDbtTx/MndtRltdInf/DtOfSgntr', nach: 'DrctDbtTx/MndtRltdInf/DtOfSgntr', typ: 'unveraendert', notiz: '' },
  { von: 'Dbtr/Nm',                    nach: 'Dbtr/Nm',                        typ: 'unveraendert', notiz: '' },
  { von: 'DbtrAcct/Id/IBAN',           nach: 'DbtrAcct/Id/IBAN',               typ: 'unveraendert', notiz: '' },
  { von: 'RmtInf/Ustrd',               nach: 'RmtInf/Ustrd',                   typ: 'unveraendert', notiz: 'Verwendungszweck' },
];

function generateDashboard(results, generatedAt) {
  const convData = results.map(r => ({
    filename:   r.filename,
    timestamp:  r.timestamp,
    status:     r.status,
    error:      r.error || null,
    validation: r.validation ? {
      valid:    r.validation.valid,
      errors:   r.validation.errors   || [],
      warnings: r.validation.warnings || [],
      summary:  r.validation.summary  || null,
    } : null,
    comparison: r.comparison || [],
  }));

  const dataJson  = JSON.stringify(convData);
  const okCount   = results.filter(r => r.status === 'ok').length;
  const errCount  = results.filter(r => r.status !== 'ok').length;
  const warnCount = results.filter(r => r.status === 'ok' && r.validation && r.validation.warnings.length > 0).length;

  const mappingRows = DOC_MAPPINGS.map(m => {
    const badge = m.typ === 'entfernt'    ? `<span class="badge badge-red">entfernt</span>`
                : m.typ === 'umbenennung' ? `<span class="badge badge-orange">umbenannt</span>`
                : m.typ === 'verschoben'  ? `<span class="badge badge-blue">verschoben</span>`
                :                          `<span class="badge badge-gray">unverändert</span>`;
    return `<tr><td class="mono">${esc(m.von)}</td><td class="mono">${esc(m.nach)}</td><td>${badge}</td><td>${esc(m.notiz)}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SEPA Konvertierer — Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh}

/* ── Header ── */
.hdr{background:#161b22;border-bottom:1px solid #30363d;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.hdr-left h1{font-size:16px;font-weight:700;color:#e6edf3}
.hdr-left .sub{font-size:11px;color:#8b949e;margin-top:2px}
.hdr-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.stats{display:flex;gap:8px}
.stat{padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
.stat-ok{background:rgba(63,185,80,.15);color:#3fb950}
.stat-err{background:rgba(248,81,73,.15);color:#f85149}
.stat-warn{background:rgba(210,153,34,.15);color:#d29922}
.stat-total{background:rgba(88,166,255,.1);color:#58a6ff}

/* ── Auto-Refresh ── */
.rf-ctrl{display:flex;align-items:center;gap:6px;background:#21262d;border:1px solid #30363d;border-radius:8px;padding:5px 10px;font-size:12px;color:#8b949e}
.rf-ctrl label{cursor:pointer;display:flex;align-items:center;gap:5px;color:#c9d1d9;user-select:none}
.rf-ctrl input[type=checkbox]{width:14px;height:14px;cursor:pointer;accent-color:#58a6ff}
.rf-ctrl select{background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:2px 6px;font-size:12px;cursor:pointer}
.rf-ctrl select:focus{outline:none;border-color:#58a6ff}
#rfCountdown{font-size:11px;color:#58a6ff;min-width:32px;text-align:right}

/* ── Tabs ── */
.tabs{display:flex;background:#161b22;border-bottom:1px solid #30363d;padding:0 20px;overflow-x:auto}
.tab{padding:10px 16px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;color:#8b949e;transition:all .15s;user-select:none;white-space:nowrap}
.tab:hover{color:#c9d1d9}
.tab.active{color:#58a6ff;border-bottom-color:#58a6ff}

/* ── Panels ── */
.panel{display:none;padding:18px 20px}
.panel.active{display:block}

/* ── Tables ── */
.conv-table{width:100%;border-collapse:collapse;font-size:13px}
.conv-table th{background:#161b22;padding:7px 12px;text-align:left;font-weight:600;color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #30363d;position:sticky;top:0}
.conv-table td{padding:7px 12px;border-bottom:1px solid #21262d;vertical-align:top}
.conv-table tr:hover td{background:rgba(255,255,255,.02)}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
.badge-green{background:rgba(63,185,80,.15);color:#3fb950}
.badge-red{background:rgba(248,81,73,.15);color:#f85149}
.badge-orange{background:rgba(210,153,34,.15);color:#d29922}
.badge-blue{background:rgba(88,166,255,.1);color:#58a6ff}
.badge-gray{background:#21262d;color:#8b949e}
.mono{font-family:'SF Mono',Consolas,monospace;font-size:12px}
.detail-btn{background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer}
.detail-btn:hover{background:#30363d}
.detail-row{display:none;background:#0d1117}
.detail-row.open{display:table-row}
.detail-cell{padding:10px 12px;font-size:12px}
.err-list{margin-top:6px;list-style:none}
.err-list li{padding:2px 0;color:#f85149}
.err-list li.warn{color:#d29922}
.summary-chips{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
.chip{background:#21262d;border-radius:4px;padding:3px 10px;font-size:12px;font-family:monospace}

/* ── Comparison ── */
.cmp-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.cmp-controls select{background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-size:13px}
.block-nav{display:flex;align-items:center;gap:8px;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:7px 12px;margin-bottom:12px}
.nav-btn{background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:5px;padding:4px 12px;font-size:13px;cursor:pointer}
.nav-btn:hover:not(:disabled){background:#30363d}
.nav-btn:disabled{opacity:.4;cursor:default}
.block-lbl{flex:1;text-align:center;font-size:14px;font-weight:600;color:#e6edf3}
.block-ctr{font-size:11px;color:#8b949e}
.cmp-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
.cmp-table col{width:33.33%}
.cmp-table thead th{background:#161b22;padding:8px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #30363d;border-right:1px solid #30363d;position:sticky;top:0}
.cmp-table thead th:last-child{border-right:none}
.th-01{color:#f85149}.th-08{color:#3fb950}.th-ref{color:#58a6ff}
.cmp-table td{padding:6px 12px;border-bottom:1px solid #21262d;border-right:1px solid #21262d;vertical-align:top}
.cmp-table td:last-child{border-right:none}
.fld-lbl{font-size:10px;color:#8b949e;font-family:monospace;margin-bottom:1px}
.fld-val{font-family:monospace;word-break:break-all;color:#c9d1d9}
.fld-val.null{color:#30363d;font-style:italic}
.row-changed td.td-08{background:rgba(63,185,80,.07)}
.row-removed{background:rgba(248,81,73,.05)}
.row-removed .fld-val{text-decoration:line-through;color:#f85149;opacity:.7}
.row-removed .fld-lbl{color:#f85149}
.rename-hint{font-size:9px;color:#d29922;font-family:monospace}
.bnk-ok{color:#3fb950;font-weight:700}
.bnk-fail{color:#f85149;font-weight:700}
.bnk-opt{color:#8b949e}
.bnk-lbl{font-size:10px;font-family:monospace;color:#6e7681;margin-top:2px}
.no-data{text-align:center;padding:40px;color:#8b949e;font-size:13px}

/* ── Tooltip ── */
.has-tip{cursor:help;position:relative}
.has-tip .tip{display:none;position:absolute;left:0;top:100%;margin-top:4px;z-index:200;background:#1c2333;color:#e6edf3;font-size:11px;font-family:sans-serif;line-height:1.5;padding:8px 12px;border-radius:6px;white-space:pre-line;min-width:220px;max-width:340px;box-shadow:0 6px 20px rgba(0,0,0,.6);border:1px solid #30363d;pointer-events:none}
.has-tip:hover .tip{display:block}

/* ── Legend ── */
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:#8b949e;margin-bottom:12px;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px}
.legend-item{display:flex;align-items:center;gap:5px;cursor:default}
.l-dot{width:10px;height:10px;border-radius:2px;flex-shrink:0}

/* ── Docs ── */
.doc-section{margin-bottom:26px}
.doc-section h2{font-size:15px;font-weight:700;color:#e6edf3;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #21262d}
.doc-section p,.doc-section li{font-size:13px;line-height:1.6;color:#8b949e}
.doc-section ul{margin-left:18px;margin-top:4px}
.ns-box{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.ns-item{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:10px 14px;flex:1;min-width:200px}
.ns-item .ns-ver{font-size:11px;color:#8b949e;margin-bottom:4px}
.ns-item .ns-val{font-family:monospace;font-size:12px;word-break:break-all}

/* ── User Guide (Tab 4) ── */
.guide{max-width:780px}
.guide h2{font-size:17px;font-weight:700;color:#e6edf3;margin:24px 0 12px;padding-bottom:6px;border-bottom:1px solid #21262d}
.guide h3{font-size:13px;font-weight:700;color:#c9d1d9;margin:14px 0 6px}
.guide p{font-size:13px;line-height:1.65;color:#8b949e;margin-bottom:8px}
.guide ul,.guide ol{margin:6px 0 10px 20px}
.guide li{font-size:13px;line-height:1.6;color:#8b949e;margin-bottom:3px}
.guide .callout{border-radius:6px;padding:10px 14px;margin:10px 0;font-size:13px}
.guide .callout-info{background:rgba(88,166,255,.07);border-left:3px solid #58a6ff;color:#c9d1d9}
.guide .callout-warn{background:rgba(210,153,34,.08);border-left:3px solid #d29922;color:#c9d1d9}
.guide .callout-ok{background:rgba(63,185,80,.07);border-left:3px solid #3fb950;color:#c9d1d9}
.guide .callout strong{font-weight:700;color:#e6edf3}
.guide .step{display:flex;gap:12px;margin-bottom:12px;align-items:flex-start}
.guide .step-num{flex-shrink:0;width:28px;height:28px;background:#58a6ff;color:#0d1117;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.guide .step-body h4{font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:3px}
.guide .step-body p{margin-bottom:0}
.guide .folder-tree{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:12px 16px;font-family:'SF Mono',Consolas,monospace;font-size:12px;line-height:1.9;margin:8px 0}
.guide .folder-tree .dir{color:#58a6ff;font-weight:600}
.guide .folder-tree .note{color:#6e7681;font-style:italic}
.guide .screen{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:14px;margin:8px 0;font-family:'SF Mono',Consolas,monospace;font-size:12px;color:#c9d1d9;line-height:1.7}
.guide .screen .ok{color:#3fb950}
.guide .screen .info{color:#8b949e}
.guide .screen .prompt{color:#58a6ff}
.guide .ftable{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
.guide .ftable th{background:#161b22;padding:6px 10px;text-align:left;font-weight:600;border:1px solid #30363d;color:#8b949e;font-size:11px;text-transform:uppercase}
.guide .ftable td{padding:5px 10px;border:1px solid #21262d;vertical-align:top;color:#8b949e}
.guide .ftable tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.guide code{font-family:'SF Mono',Consolas,monospace;font-size:12px;background:#21262d;padding:1px 5px;border-radius:3px;color:#c9d1d9}
.guide .print-btn{display:inline-block;background:#58a6ff;color:#0d1117;border:none;border-radius:6px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;margin-top:6px}
.guide .print-btn:hover{background:#79b8ff}
@media print{.hdr,.tabs,.rf-ctrl,.no-print{display:none!important}.guide{max-width:none}}
</style>
</head>
<body>

<!-- Header -->
<div class="hdr">
  <div class="hdr-left">
    <h1>SEPA Konvertierer — Dashboard</h1>
    <div class="sub">pain.008.001.01 → pain.008.001.08 &nbsp;·&nbsp; Stand: ${esc(generatedAt)}</div>
  </div>
  <div class="hdr-right">
    <div class="stats">
      <span class="stat stat-total">${results.length} Gesamt</span>
      <span class="stat stat-ok">✓ ${okCount}</span>
      ${errCount  > 0 ? `<span class="stat stat-err">✗ ${errCount}</span>` : ''}
      ${warnCount > 0 ? `<span class="stat stat-warn">⚠ ${warnCount}</span>` : ''}
    </div>
    <div class="rf-ctrl no-print">
      <label><input type="checkbox" id="rfToggle" checked onchange="onRfToggle(this.checked)"> Auto-Refresh alle</label>
      <select id="rfSel" onchange="onRfChange()">
        <option value="5" selected>5 Sek.</option>
        <option value="10">10 Sek.</option>
        <option value="30">30 Sek.</option>
        <option value="60">1 Min.</option>
        <option value="120">2 Min.</option>
      </select>
      <span id="rfCountdown"></span>
    </div>
  </div>
</div>

<!-- Tabs -->
<div class="tabs no-print">
  <div class="tab active" onclick="showTab('konv',this)">📋 Konvertierungen</div>
  <div class="tab" onclick="showTab('vergl',this)">🔍 Feldvergleich</div>
  <div class="tab" onclick="showTab('doku',this)">📖 Dokumentation</div>
  <div class="tab" onclick="showTab('guide',this)">❓ Benutzerhandbuch</div>
</div>

<!-- ═══ TAB 1: Konvertierungen ═══ -->
<div id="tab-konv" class="panel active">
  ${results.length === 0
    ? `<div class="no-data">Noch keine Konvertierungen.<br>XML-Datei in Ordner <strong>${INPUT_DIR}</strong> legen.</div>`
    : `<table class="conv-table">
    <thead><tr>
      <th>Status</th><th>Datei</th><th>Zeitpunkt</th>
      <th>Buchungen</th><th>Kontrollsumme</th><th>Meldungen</th><th></th>
    </tr></thead>
    <tbody id="convBody"></tbody>
  </table>`}
</div>

<!-- ═══ TAB 2: Feldvergleich ═══ -->
<div id="tab-vergl" class="panel">
  <div class="cmp-controls">
    <label for="fileSelect" style="font-size:13px;color:#8b949e">Datei:</label>
    <select id="fileSelect" onchange="selectConv(this.value)"></select>
    <span id="statusBadge"></span>
  </div>
  <div class="block-nav">
    <button class="nav-btn" id="btnPrev" onclick="navBlock(-1)">◀</button>
    <span class="block-lbl" id="blockLbl">—</span>
    <span class="block-ctr" id="blockCtr"></span>
    <button class="nav-btn" id="btnNext" onclick="navBlock(1)">▶</button>
  </div>
  <div class="legend">
    <div class="legend-item has-tip">
      <div class="l-dot" style="background:rgba(63,185,80,.4)"></div>
      <span>Feld geändert/transformiert</span>
      <div class="tip">Der Wert oder die Feldstruktur wurde bei der Konvertierung von .01 auf .08 geändert.</div>
    </div>
    <div class="legend-item has-tip">
      <span style="color:#d29922;font-family:monospace;font-size:11px">↑ umbenannt</span>
      <span>(oranger Text)</span>
      <div class="tip">Der Feldname wurde umbenannt, z.B. BIC → BICFI oder CdtrSchmeId wurde auf PmtInf-Ebene verschoben. Der Wert selbst bleibt meist unverändert.</div>
    </div>
    <div class="legend-item has-tip">
      <div class="l-dot" style="background:rgba(248,81,73,.4)"></div>
      <span style="color:#f85149">Feld entfernt (rot, durchgestrichen)</span>
      <div class="tip">Dieses Feld existiert im Format pain.008.001.08 nicht mehr und wurde bei der Konvertierung weggelassen (z.B. Grpg).</div>
    </div>
    <div class="legend-item has-tip">
      <span class="bnk-ok">✓</span><span>Pflichtfeld vorhanden</span>
      <div class="tip">Dieses Feld ist laut Bank-Standard (pain.008.001.08) ein Pflichtfeld und ist korrekt befüllt.</div>
    </div>
    <div class="legend-item has-tip">
      <span class="bnk-fail">✗</span><span>Pflichtfeld fehlt</span>
      <div class="tip">Dieses Feld ist laut Bank-Standard ein Pflichtfeld, ist aber im konvertierten Dokument leer oder fehlt.</div>
    </div>
    <div class="legend-item has-tip">
      <span class="bnk-opt">—</span><span>Optional</span>
      <div class="tip">Dieses Feld ist im Bank-Standard optional.</div>
    </div>
  </div>
  <table class="cmp-table">
    <colgroup><col><col><col></colgroup>
    <thead><tr>
      <th class="th-01">Eingabe — pain.008.001.01</th>
      <th class="th-08">Konvertiert — pain.008.001.08</th>
      <th class="th-ref">Bank-Konformität</th>
    </tr></thead>
    <tbody id="cmpBody"></tbody>
  </table>
</div>

<!-- ═══ TAB 3: Dokumentation ═══ -->
<div id="tab-doku" class="panel">
  <div class="doc-section">
    <h2>Namespaces</h2>
    <div class="ns-box">
      <div class="ns-item"><div class="ns-ver">Eingang (pain.008.001.01)</div><div class="ns-val" style="color:#f85149">APC:STUZZA:payments:ISO:pain:008:001:01:austrian:002</div></div>
      <div class="ns-item"><div class="ns-ver">Ausgang (pain.008.001.08)</div><div class="ns-val" style="color:#3fb950">urn:iso:std:iso:20022:tech:xsd:pain.008.001.08</div></div>
    </div>
  </div>
  <div class="doc-section">
    <h2>Strukturelle Änderungen</h2>
    <table class="conv-table">
      <thead><tr><th>Quellfeld (.01)</th><th>Zielfeld (.08)</th><th>Typ</th><th>Hinweis</th></tr></thead>
      <tbody>${mappingRows}</tbody>
    </table>
  </div>
  <div class="doc-section">
    <h2>Verarbeitungsablauf</h2>
    <ul>
      <li>XML-Datei in Ordner <code style="font-family:monospace;background:#21262d;padding:1px 5px;border-radius:3px">${INPUT_DIR}</code> legen</li>
      <li>Konvertierer erkennt die Datei automatisch (max. 2 Sekunden)</li>
      <li>Konvertierung pain.008.001.01 → pain.008.001.08 wird durchgeführt</li>
      <li>Ergebnis wird gegen pain.008.001.08-Schema validiert</li>
      <li>Bei Erfolg: Ausgabe in <code style="font-family:monospace;background:#21262d;padding:1px 5px;border-radius:3px">${OUTPUT_DIR}/dateiname.08.xml</code></li>
      <li>Original wird in <code style="font-family:monospace;background:#21262d;padding:1px 5px;border-radius:3px">${INPUT_DIR}/archiv/</code> archiviert</li>
      <li>Bei Fehler: Original und konvertierte Datei in <code style="font-family:monospace;background:#21262d;padding:1px 5px;border-radius:3px">fehler/</code></li>
      <li>Dashboard (diese Seite) wird nach jeder Verarbeitung aktualisiert</li>
    </ul>
  </div>
  <div class="doc-section">
    <h2>Validierungsregeln (.08)</h2>
    <ul>
      <li>GrpHdr: MsgId (max. 35 Zeichen), CreDtTm (ISO-Datetime), NbOfTxs, CtrlSum, InitgPty/Nm</li>
      <li>PmtInf: PmtMtd muss "DD" sein; ReqdColltnDt im Format YYYY-MM-DD</li>
      <li>PmtInf: CdtrSchmeId/Othr/Id (Gläubiger-ID) auf PmtInf-Ebene (nicht in DrctDbtTx)</li>
      <li>CdtrAgt + DbtrAgt: BICFI-Format <code style="font-family:monospace;background:#21262d;padding:1px 5px;border-radius:3px">[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?</code></li>
      <li>IBAN: 2 Buchstaben + 2 Ziffern + 11–30 alphanumerische Zeichen</li>
      <li>DrctDbtTx: EndToEndId, MndtId, DtOfSgntr, Dbtr/Nm, DbtrAcct/Id/IBAN Pflichtfelder</li>
      <li>NbOfTxs und CtrlSum werden gegen tatsächliche Transaktionen abgeglichen</li>
    </ul>
  </div>
</div>

<!-- ═══ TAB 4: Benutzerhandbuch ═══ -->
<div id="tab-guide" class="panel">
<div class="guide">
  <button class="print-btn no-print" onclick="window.print()">🖨 Als PDF drucken</button>

  <h2>1. Was macht dieses Programm?</h2>
  <p>Das <strong>SEPA-Konvertierer</strong>-Programm wandelt SEPA-Lastschrift-XML-Dateien automatisch vom <strong>alten Format (pain.008.001.01)</strong> in das <strong>neue, bankpflichtige Format (pain.008.001.08)</strong> um.</p>
  <div class="callout callout-info">
    <strong>Warum ist das nötig?</strong><br>
    Seit März 2024 akzeptieren österreichische Banken (und alle EU-Banken) nur noch das Format pain.008.001.08. Ältere Buchhaltungssysteme erstellen oft noch das alte Format. Dieses Tool erledigt die Umwandlung vollautomatisch.
  </div>
  <p>Das Programm überwacht einen Eingangsordner. Sobald eine XML-Datei dort abgelegt wird, wird sie automatisch konvertiert, validiert und das Ergebnis im Ausgabeordner gespeichert.</p>

  <h2>2. Installation (einmalig)</h2>
  <div class="callout callout-warn">
    <strong>Voraussetzung:</strong> Windows 10 oder Windows 11. Keine weitere Software erforderlich.
  </div>
  <div class="step"><div class="step-num">1</div><div class="step-body">
    <h4>ZIP-Datei herunterladen</h4>
    <p>Auf GitHub das Repository <strong>ALs-Bankkonvertierer</strong> öffnen und auf den grünen Button <strong>„Code" → „Download ZIP"</strong> klicken.</p>
  </div></div>
  <div class="step"><div class="step-num">2</div><div class="step-body">
    <h4>ZIP entpacken</h4>
    <p>Die heruntergeladene ZIP-Datei mit Rechtsklick → <strong>„Alle extrahieren"</strong> entpacken. Den Ordner an einen festen Speicherort verschieben, z.B. <code>C:\\SEPA-Konvertierer\\</code>.</p>
  </div></div>
  <div class="step"><div class="step-num">3</div><div class="step-body">
    <h4>Erste Ausführung</h4>
    <p>Doppelklick auf <strong>Bankkonvertierer-starten.bat</strong>. Beim ersten Start wird die EXE-Datei automatisch zusammengesetzt. Danach startet das Programm sofort.</p>
  </div></div>
  <div class="callout callout-ok">
    <strong>Erfolgreich gestartet?</strong> Es erscheint ein schwarzes Fenster mit „SEPA Konvertierer gestartet" und „Überwachung aktiv...".
  </div>

  <h2>3. Programm starten</h2>
  <p>Für jeden weiteren Start genügt ein Doppelklick auf <strong>Bankkonvertierer-starten.bat</strong>.</p>
  <div class="screen">
    <div class="ok">🚀 SEPA Konvertierer gestartet</div>
    <div class="info">   Eingabe:  ...\\${INPUT_DIR}</div>
    <div class="info">   Ausgabe:  ...\\${OUTPUT_DIR}</div>
    <div class="info">   Fehler:   ...\\fehler</div>
    <div class="info">   Dashboard: ...\\dashboard.html</div>
    <div class="ok">👀 Überwachung aktiv... (Strg+C zum Beenden)</div>
  </div>
  <div class="callout callout-warn">
    <strong>Wichtig:</strong> Das schwarze Fenster muss während der Arbeit geöffnet bleiben.
  </div>

  <h2>4. Eine XML-Datei konvertieren</h2>
  <div class="step"><div class="step-num">1</div><div class="step-body">
    <h4>XML-Datei in den Eingangsordner kopieren</h4>
    <p>Die pain.008.001.01-Datei in den Ordner <code>${INPUT_DIR}</code> kopieren.</p>
  </div></div>
  <div class="step"><div class="step-num">2</div><div class="step-body">
    <h4>Automatische Verarbeitung abwarten</h4>
    <p>Das Programm erkennt die Datei innerhalb von 1–2 Sekunden und verarbeitet sie sofort.</p>
  </div></div>
  <div class="screen">
    <div class="info">📄 Verarbeite: meine-datei.xml</div>
    <div class="ok">  ✓ Konvertierung erfolgreich</div>
    <div class="ok">  ✓ Buchungen: 5 — OK</div>
    <div class="ok">  ✓ Kontrollsumme: 1250.00 EUR — OK</div>
    <div class="info">  → Ausgabe: ${OUTPUT_DIR}/meine-datei.08.xml</div>
    <div class="info">  → Archiviert: ${INPUT_DIR}/archiv/meine-datei.xml</div>
    <div class="info">  📊 Dashboard aktualisiert: dashboard.html</div>
  </div>
  <div class="step"><div class="step-num">3</div><div class="step-body">
    <h4>Konvertierte Datei abholen</h4>
    <p>Die fertige .08-Datei liegt im Ordner <code>${OUTPUT_DIR}</code> unter dem Namen <code>dateiname.08.xml</code>.</p>
  </div></div>

  <h2>5. Dashboard verwenden</h2>
  <p>Nach jeder Konvertierung wird die Datei <strong>dashboard.html</strong> (diese Seite) aktualisiert. Im Browser öffnen oder mit <strong>Strg+R</strong> neu laden.</p>
  <h3>Auto-Refresh aktivieren:</h3>
  <p>Oben rechts das Häkchen bei <strong>„Auto-Refresh"</strong> setzen und das gewünschte Intervall wählen (5 Sek. bis 2 Min.). Die Seite lädt sich dann automatisch neu.</p>
  <h3>Die vier Tabs:</h3>
  <ul>
    <li><strong>📋 Konvertierungen</strong> — Liste aller Läufe mit Status. „Details" klicken für Fehler/Warnungen.</li>
    <li><strong>🔍 Feldvergleich</strong> — Feld-für-Feld-Vergleich: links Original (.01), Mitte konvertiert (.08), rechts Bank-Konformität. Navigation mit ◀ ▶.</li>
    <li><strong>📖 Dokumentation</strong> — Alle Feldänderungen, Namespaces, Validierungsregeln.</li>
    <li><strong>❓ Benutzerhandbuch</strong> — Diese Anleitung (auch als PDF druckbar).</li>
  </ul>

  <h2>6. Ordnerstruktur</h2>
  <div class="folder-tree">
    <div><span class="dir">SEPA-Konvertierer\\</span></div>
    <div>&nbsp;&nbsp;<span class="dir">${INPUT_DIR}\\</span> <span class="note">← XML-Dateien hier ablegen</span></div>
    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span class="dir">archiv\\</span> <span class="note">← Erfolgreich verarbeitete Originale</span></div>
    <div>&nbsp;&nbsp;<span class="dir">${OUTPUT_DIR}\\</span> <span class="note">← Fertige .08.xml-Dateien</span></div>
    <div>&nbsp;&nbsp;<span class="dir">fehler\\</span> <span class="note">← Fehlerhafte Dateien zur Überprüfung</span></div>
    <div>&nbsp;&nbsp;<span class="dir">dist\\</span> <span class="note">← Programm-Teile (nicht öffnen)</span></div>
    <div>&nbsp;&nbsp;<span class="note">Bankkonvertierer-starten.bat ← Startdatei</span></div>
    <div>&nbsp;&nbsp;<span class="note">Bankconvertierer.exe ← Hauptprogramm</span></div>
    <div>&nbsp;&nbsp;<span class="note">dashboard.html ← Diese Seite</span></div>
  </div>

  <h2>7. Was wird konvertiert?</h2>
  <p>Die Datenwerte (Beträge, IBANs, Namen, Mandatsreferenzen) bleiben unverändert — nur die XML-Struktur wird angepasst:</p>
  <table class="ftable">
    <thead><tr><th>Änderung</th><th>Alt (.01)</th><th>Neu (.08)</th></tr></thead>
    <tbody>
      <tr><td>XML-Namespace</td><td>APC:STUZZA:...001:01...</td><td>urn:iso:std:iso:20022...</td></tr>
      <tr><td>Root-Element</td><td>&lt;pain.008.001.01&gt;</td><td>&lt;CstmrDrctDbtInitn&gt;</td></tr>
      <tr><td>Grpg-Element</td><td>&lt;Grpg&gt;MIXD&lt;/Grpg&gt;</td><td>(entfernt)</td></tr>
      <tr><td>Bank-BIC</td><td>FinInstnId/BIC</td><td>FinInstnId/BICFI</td></tr>
      <tr><td>Gläubiger-ID</td><td>innerhalb DrctDbtTx/OthrId</td><td>PmtInf-Ebene/Othr</td></tr>
    </tbody>
  </table>

  <h2>8. Fehlerbehandlung</h2>
  <p>Wenn eine Datei nicht konvertiert werden kann, landet sie im Ordner <code>fehler\\</code>.</p>
  <h3>Was tun?</h3>
  <p>Im Dashboard unter <strong>„📋 Konvertierungen"</strong> auf <strong>„Details"</strong> klicken, um den genauen Fehler zu sehen.</p>
  <table class="ftable">
    <thead><tr><th>Fehlermeldung</th><th>Lösung</th></tr></thead>
    <tbody>
      <tr><td>Kein &lt;pain.008.001.01&gt;-Element gefunden</td><td>Nur .01-Dateien konvertieren</td></tr>
      <tr><td>Mandats-ID fehlt</td><td>Datei in Quellsystem prüfen</td></tr>
      <tr><td>Gläubiger-Bank-BICFI fehlt</td><td>BIC in der Quelldatei ergänzen</td></tr>
      <tr><td>EXE startet nicht</td><td>ZIP neu herunterladen und entpacken</td></tr>
    </tbody>
  </table>
</div>
</div>

<script>
const DATA = ${dataJson};

/* ── Tab switching ── */
const TAB_IDS = ['konv','vergl','doku','guide'];
let activeTab = 'konv';

function showTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const idx = TAB_IDS.indexOf(id);
    const tabs = document.querySelectorAll('.tab');
    if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');
  }
  document.getElementById('tab-' + id).classList.add('active');
  activeTab = id;
  localStorage.setItem('activeTab', id);
  if (id === 'vergl') initCmp();
  updateRfStatus();
}

/* ── Auto-Refresh ── */
let rfTimer = null, rfSecs = 5, rfRemain = 5;

function initRefresh() {
  // Defaults: ON, 5s — only override if user has explicitly saved a setting
  const enabled = localStorage.getItem('rfEnabled') !== '0';
  const secs    = parseInt(localStorage.getItem('rfSecs') || '5');
  const sel     = document.getElementById('rfSel');
  if (sel) { sel.value = secs; if (!sel.value) sel.value = '5'; }
  document.getElementById('rfToggle').checked = enabled;
  if (enabled) startRefresh(secs);
}

function onRfToggle(checked) {
  localStorage.setItem('rfEnabled', checked ? '1' : '0');
  checked ? startRefresh(parseInt(document.getElementById('rfSel').value)) : stopRefresh();
}

function onRfChange() {
  const secs = parseInt(document.getElementById('rfSel').value);
  localStorage.setItem('rfSecs', secs);
  if (document.getElementById('rfToggle').checked) startRefresh(secs);
}

function startRefresh(secs) {
  stopRefresh();
  rfSecs = rfRemain = secs;
  rfTimer = setInterval(() => {
    // Only count down and reload when on Konvertierungen tab
    if (activeTab !== 'konv') {
      rfRemain = rfSecs; // reset countdown silently
      const el = document.getElementById('rfCountdown');
      if (el) { el.textContent = '⏸'; el.title = 'Pausiert — nur auf Tab Konvertierungen aktiv'; }
      return;
    }
    rfRemain--;
    const el = document.getElementById('rfCountdown');
    if (el) { el.textContent = rfRemain > 0 ? rfRemain + 's' : ''; el.title = ''; }
    if (rfRemain <= 0) location.reload();
  }, 1000);
}

function stopRefresh() {
  if (rfTimer) { clearInterval(rfTimer); rfTimer = null; }
  const el = document.getElementById('rfCountdown');
  if (el) { el.textContent = ''; el.title = ''; }
}

function updateRfStatus() {
  const el = document.getElementById('rfCountdown');
  if (!el || !document.getElementById('rfToggle').checked) return;
  if (activeTab !== 'konv') {
    el.textContent = '⏸'; el.title = 'Pausiert — nur auf Tab Konvertierungen aktiv';
  } else {
    el.title = '';
  }
}

/* ── Konvertierungen Tab ── */
function initConv() {
  const tbody = document.getElementById('convBody');
  if (!tbody) return;
  tbody.innerHTML = DATA.map((c, i) => {
    const s    = c.validation && c.validation.summary;
    const errs = c.validation ? c.validation.errors.length   : 0;
    const wrns = c.validation ? c.validation.warnings.length : 0;
    const ts   = c.timestamp  ? new Date(c.timestamp).toLocaleString('de-AT') : '—';
    return \`<tr>
      <td>\${c.status==='ok'?'<span class="badge badge-green">✓ OK</span>':'<span class="badge badge-red">✗ Fehler</span>'}</td>
      <td class="mono">\${esc(c.filename)}</td>
      <td style="white-space:nowrap;color:#8b949e;font-size:12px">\${esc(ts)}</td>
      <td style="text-align:right">\${s?s.txCount:'—'}</td>
      <td style="text-align:right">\${s?s.ctrlSum.toFixed(2)+' EUR':'—'}</td>
      <td>\${errs>0?'<span class="badge badge-red">'+errs+' Fehler</span> ':''}\${wrns>0?'<span class="badge badge-orange">'+wrns+' Warnungen</span>':errs===0?'<span style="color:#8b949e;font-size:11px">—</span>':''}</td>
      <td><button class="detail-btn" onclick="toggleDetail(\${i})">Details</button></td>
    </tr>
    <tr class="detail-row" id="dr-\${i}">
      <td class="detail-cell" colspan="7">\${buildDetail(c)}</td>
    </tr>\`;
  }).join('');
}

function buildDetail(c) {
  let html = '';
  if (c.error) html += \`<div style="color:#f85149">✗ \${esc(c.error)}</div>\`;
  if (c.validation && c.validation.summary) {
    const s = c.validation.summary;
    html += \`<div class="summary-chips">
      <span class="chip">MsgId: \${esc(s.msgId)}</span>
      <span class="chip">Buchungen: \${s.txCount} \${s.txCountMatch?'✓':'⚠'}</span>
      <span class="chip">CtrlSum: \${s.ctrlSum!=null?s.ctrlSum.toFixed(2):'?'} EUR \${s.ctrlSumMatch?'✓':'⚠'}</span>
      <span class="chip">Auftraggeber: \${esc(s.initiatingParty||'—')}</span>
    </div>\`;
  }
  if (c.validation && c.validation.errors.length)
    html += '<ul class="err-list">' + c.validation.errors.map(e => \`<li>✗ [\${esc(e.field)}] \${esc(e.message)}</li>\`).join('') + '</ul>';
  if (c.validation && c.validation.warnings.length)
    html += '<ul class="err-list">' + c.validation.warnings.map(w => \`<li class="warn">⚠ [\${esc(w.field)}] \${esc(w.message)}</li>\`).join('') + '</ul>';
  return html || '<span style="color:#8b949e">Keine Details verfügbar</span>';
}

function toggleDetail(i) { document.getElementById('dr-' + i).classList.toggle('open'); }

/* ── Feldvergleich Tab ── */
let curConv = 0, curBlock = 0, cmpInited = false;

function initCmp() {
  if (cmpInited) return;
  cmpInited = true;
  const sel = document.getElementById('fileSelect');
  if (!DATA || !DATA.length) {
    document.getElementById('cmpBody').innerHTML = '<tr><td colspan="3" class="no-data">Keine Konvertierungen</td></tr>';
    return;
  }
  DATA.forEach((c, i) => {
    const opt = document.createElement('option');
    const ts  = c.timestamp ? new Date(c.timestamp).toLocaleString('de-AT') : '';
    opt.value = i;
    opt.text  = (c.status==='ok'?'✓ ':'✗ ') + c.filename + (ts?' · '+ts:'');
    sel.appendChild(opt);
  });
  selectConv(0);
}

function selectConv(idx) {
  curConv = parseInt(idx);
  curBlock = 0;
  document.getElementById('fileSelect').value = idx;
  const c = DATA[curConv];
  document.getElementById('statusBadge').innerHTML = c.status==='ok'
    ? '<span class="badge badge-green">✓ Gültig</span>'
    : '<span class="badge badge-red">✗ Fehler</span>';
  renderBlock();
}

function navBlock(dir) {
  const blocks = DATA[curConv].comparison || [];
  curBlock = Math.max(0, Math.min(blocks.length - 1, curBlock + dir));
  renderBlock();
}

function renderBlock() {
  const blocks = (DATA[curConv] && DATA[curConv].comparison) || [];
  if (!blocks.length) {
    document.getElementById('cmpBody').innerHTML = '<tr><td colspan="3" class="no-data">Kein Vergleich verfügbar</td></tr>';
    document.getElementById('blockLbl').textContent = '—';
    document.getElementById('blockCtr').textContent = '';
    return;
  }
  const block = blocks[curBlock];
  document.getElementById('blockLbl').textContent = block.label || block.id;
  document.getElementById('blockCtr').textContent = (curBlock+1) + ' / ' + blocks.length;
  document.getElementById('btnPrev').disabled = curBlock === 0;
  document.getElementById('btnNext').disabled = curBlock === blocks.length - 1;

  document.getElementById('cmpBody').innerHTML = (block.rows || []).map(row => {
    const removed = !!row.removedIn08;
    const changed = row.changed && !removed;
    const renamed = row.renamed || (!removed && row.label01 && row.label08 && row.label01 !== row.label08);
    const cls     = [removed?'row-removed':'', changed?'row-changed':''].filter(Boolean).join(' ');

    // Tooltip text for first cell
    let tip = '';
    if (removed) {
      tip = 'Dieses Feld wurde entfernt.\\nIn pain.008.001.08 existiert es nicht mehr.';
    } else if (renamed && row.label01 !== row.label08) {
      tip = \`Feldname umbenannt:\\n"\${row.label01}" → "\${row.label08}"\`;
      if (row.val01 !== row.val08 && row.val01 != null && row.val08 != null)
        tip += \`\\nWert: "\${row.val01}" → "\${row.val08}"\`;
      else tip += '\\nWert unverändert.';
    } else if (changed && row.val01 != null && row.val08 != null && row.val01 !== row.val08) {
      tip = \`Wert konvertiert:\\nVorher: "\${row.val01}"\\nNachher: "\${row.val08}"\`;
    }

    const tipAttr = tip ? \` title="\${tip.replace(/"/g,'&quot;')}"\` : '';

    const c1 = \`<td class="has-tip"\${tipAttr}>\${tip?'<span class="tip">'+esc(tip)+'</span>':''}<div class="fld-lbl">\${esc(row.label01||row.label08||'')}</div><div class="fld-val\${row.val01==null?' null':''}">\${row.val01!=null?esc(row.val01):'(leer)'}</div></td>\`;

    let l08 = removed ? '(entfernt in .08)' : esc(row.label08||'');
    let renHint = (renamed && row.label01 && row.label08 && row.label01!==row.label08)
      ? \`<div class="rename-hint">↑ war: \${esc(row.label01)}</div>\` : '';
    const c2 = \`<td class="td-08"><div class="fld-lbl">\${l08}\${renHint}</div><div class="fld-val\${row.val08==null?' null':''}">\${row.val08!=null?esc(row.val08):removed?'':'(leer)'}</div></td>\`;

    const c3html = removed
      ? '<span class="bnk-opt">Nicht in .08</span>'
      : row.bankRequired
        ? (row.bankOk ? '<span class="bnk-ok">✓ Pflichtfeld</span>' : '<span class="bnk-fail">✗ Fehlt!</span>')
        : '<span class="bnk-opt">— Optional</span>';
    const c3 = \`<td><div>\${c3html}</div>\${(!removed&&row.bankRequired)?'<div class="bnk-lbl">'+esc(row.label08||'')+'</div>':''}</td>\`;

    return \`<tr class="\${cls}">\${c1}\${c2}\${c3}</tr>\`;
  }).join('');
}

function esc(s){if(s==null)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

initConv();
initRefresh();

// Restore last active tab (so reload doesn't jump back to Konvertierungen)
const _saved = localStorage.getItem('activeTab') || 'konv';
if (_saved !== 'konv') {
  const _idx  = TAB_IDS.indexOf(_saved);
  const _tabs = document.querySelectorAll('.tab');
  if (_idx >= 0 && _tabs[_idx]) showTab(_saved, _tabs[_idx]);
}
</script>
</body>
</html>`;
}

module.exports = { generateDashboard };
