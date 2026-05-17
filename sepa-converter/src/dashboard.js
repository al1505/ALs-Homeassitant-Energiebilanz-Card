'use strict';

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const DOC_MAPPINGS = [
  { von: 'pain.008.001.01 (STUZZA)',    nach: 'CstmrDrctDbtInitn',          typ: 'umbenennung', notiz: 'Root-Element' },
  { von: 'GrpHdr/Grpg',                nach: '(entfernt)',                  typ: 'entfernt',    notiz: 'Nicht in .08 vorhanden' },
  { von: 'CdtrAgt/FinInstnId/BIC',     nach: 'CdtrAgt/FinInstnId/BICFI',   typ: 'umbenennung', notiz: '' },
  { von: 'DbtrAgt/FinInstnId/BIC',     nach: 'DbtrAgt/FinInstnId/BICFI',   typ: 'umbenennung', notiz: '' },
  { von: 'DrctDbtTx/CdtrSchmeId',      nach: 'PmtInf/CdtrSchmeId',         typ: 'verschoben',  notiz: 'Von Transaktionsebene auf PmtInf-Ebene' },
  { von: 'CdtrSchmeId/OthrId/Id',      nach: 'CdtrSchmeId/Othr/Id',        typ: 'umbenennung', notiz: 'OthrId → Othr' },
  { von: 'CdtrSchmeId/OthrId/IdTp',   nach: 'CdtrSchmeId/Othr/SchmeNm/Prtry', typ: 'umbenennung', notiz: 'Umstrukturierung' },
  { von: 'Dbtr/PstlAdr (alle Felder)', nach: 'Dbtr/PstlAdr (alle Felder)', typ: 'unveraendert', notiz: 'XSD-Reihenfolge beachten' },
  { von: 'GrpHdr/MsgId',               nach: 'GrpHdr/MsgId',               typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/CreDtTm',             nach: 'GrpHdr/CreDtTm',             typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/NbOfTxs',             nach: 'GrpHdr/NbOfTxs',             typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/CtrlSum',             nach: 'GrpHdr/CtrlSum',             typ: 'unveraendert', notiz: '' },
  { von: 'GrpHdr/InitgPty/Nm',         nach: 'GrpHdr/InitgPty/Nm',         typ: 'unveraendert', notiz: '' },
  { von: 'PmtInf/PmtInfId',            nach: 'PmtInf/PmtInfId',            typ: 'unveraendert', notiz: '' },
  { von: 'PmtInf/PmtMtd',              nach: 'PmtInf/PmtMtd',              typ: 'unveraendert', notiz: 'Wert: "DD"' },
  { von: 'PmtTpInf/LclInstrm/Cd',      nach: 'PmtTpInf/LclInstrm/Cd',      typ: 'unveraendert', notiz: '"CORE" oder "B2B"' },
  { von: 'PmtTpInf/SeqTp',             nach: 'PmtTpInf/SeqTp',             typ: 'unveraendert', notiz: '"FRST"/"RCUR"/"OOFF"/"FNAL"' },
  { von: 'ReqdColltnDt',               nach: 'ReqdColltnDt',               typ: 'unveraendert', notiz: 'ISO-Datum YYYY-MM-DD' },
  { von: 'Cdtr/Nm',                    nach: 'Cdtr/Nm',                    typ: 'unveraendert', notiz: '' },
  { von: 'CdtrAcct/Id/IBAN',           nach: 'CdtrAcct/Id/IBAN',           typ: 'unveraendert', notiz: '' },
  { von: 'DrctDbtTx/MndtRltdInf/MndtId',    nach: 'DrctDbtTx/MndtRltdInf/MndtId',    typ: 'unveraendert', notiz: '' },
  { von: 'DrctDbtTx/MndtRltdInf/DtOfSgntr', nach: 'DrctDbtTx/MndtRltdInf/DtOfSgntr', typ: 'unveraendert', notiz: '' },
  { von: 'Dbtr/Nm',                    nach: 'Dbtr/Nm',                    typ: 'unveraendert', notiz: '' },
  { von: 'DbtrAcct/Id/IBAN',           nach: 'DbtrAcct/Id/IBAN',           typ: 'unveraendert', notiz: '' },
  { von: 'RmtInf/Ustrd',               nach: 'RmtInf/Ustrd',               typ: 'unveraendert', notiz: 'Verwendungszweck' },
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

  const dataJson = JSON.stringify(convData);
  const okCount  = results.filter(r => r.status === 'ok').length;
  const errCount = results.filter(r => r.status !== 'ok').length;
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
a{color:#58a6ff}

/* ── Header ── */
.hdr{background:#161b22;border-bottom:1px solid #30363d;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.hdr-title{font-size:16px;font-weight:700;color:#e6edf3}
.hdr-sub{font-size:11px;color:#8b949e;margin-top:2px}
.stats{display:flex;gap:12px;font-size:13px}
.stat{padding:4px 10px;border-radius:20px;font-weight:600}
.stat-ok{background:rgba(63,185,80,.15);color:#3fb950}
.stat-err{background:rgba(248,81,73,.15);color:#f85149}
.stat-warn{background:rgba(210,153,34,.15);color:#d29922}
.stat-total{background:rgba(88,166,255,.1);color:#58a6ff}

/* ── Tabs ── */
.tabs{display:flex;background:#161b22;border-bottom:1px solid #30363d;padding:0 24px}
.tab{padding:10px 18px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;color:#8b949e;transition:all .15s;user-select:none}
.tab:hover{color:#c9d1d9}
.tab.active{color:#58a6ff;border-bottom-color:#58a6ff}

/* ── Panels ── */
.panel{display:none;padding:20px 24px}
.panel.active{display:block}

/* ── Conversion table ── */
.conv-table{width:100%;border-collapse:collapse;font-size:13px}
.conv-table th{background:#161b22;padding:8px 12px;text-align:left;font-weight:600;color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #30363d;position:sticky;top:0}
.conv-table td{padding:8px 12px;border-bottom:1px solid #21262d;vertical-align:top}
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
.err-list li{padding:3px 0;color:#f85149}
.err-list li.warn{color:#d29922}
.summary-chips{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
.chip{background:#21262d;border-radius:4px;padding:3px 10px;font-size:12px;font-family:monospace}

/* ── Comparison ── */
.cmp-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.cmp-controls select{background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-size:13px}
.block-nav{display:flex;align-items:center;gap:8px;background:#161b22;border:1px solid #30363d;border-radius:8px;padding:8px 14px;margin-bottom:14px}
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
.row-changed td.td-08{background:rgba(63,185,80,.06)}
.row-removed{background:rgba(248,81,73,.04)}
.row-removed .fld-val{text-decoration:line-through;color:#f85149;opacity:.7}
.row-removed .fld-lbl{color:#f85149}
.rename-hint{font-size:9px;color:#d29922;font-family:monospace}
.bnk-ok{color:#3fb950;font-weight:700}
.bnk-fail{color:#f85149;font-weight:700}
.bnk-opt{color:#8b949e}
.bnk-lbl{font-size:10px;font-family:monospace;color:#6e7681;margin-top:2px}
.no-data{text-align:center;padding:40px;color:#8b949e;font-size:13px}

/* ── Docs ── */
.doc-section{margin-bottom:28px}
.doc-section h2{font-size:15px;font-weight:700;color:#e6edf3;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #21262d}
.doc-section h3{font-size:13px;font-weight:600;color:#c9d1d9;margin:10px 0 6px}
.doc-section p,.doc-section li{font-size:13px;line-height:1.6;color:#8b949e}
.doc-section ul{margin-left:18px}
.ns-box{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}
.ns-item{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:10px 14px;flex:1;min-width:200px}
.ns-item .ns-ver{font-size:11px;color:#8b949e;margin-bottom:4px}
.ns-item .ns-val{font-family:monospace;font-size:12px;word-break:break-all}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:#8b949e;margin-bottom:14px}
.legend-item{display:flex;align-items:center;gap:5px}
.l-dot{width:10px;height:10px;border-radius:2px}

/* ── refresh hint ── */
.refresh{font-size:11px;color:#8b949e;padding:6px 24px;background:#161b22;border-top:1px solid #21262d;text-align:right}
</style>
</head>
<body>

<div class="hdr">
  <div>
    <div class="hdr-title">SEPA Konvertierer — Dashboard</div>
    <div class="hdr-sub">pain.008.001.01 (STUZZA) → pain.008.001.08 &nbsp;·&nbsp; Stand: <span id="genAt">${esc(generatedAt)}</span></div>
  </div>
  <div class="stats">
    <span class="stat stat-total">Gesamt: ${results.length}</span>
    <span class="stat stat-ok">✓ ${okCount} OK</span>
    ${errCount  > 0 ? `<span class="stat stat-err">✗ ${errCount} Fehler</span>` : ''}
    ${warnCount > 0 ? `<span class="stat stat-warn">⚠ ${warnCount} Warnungen</span>` : ''}
  </div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('konv',this)">📋 Konvertierungen</div>
  <div class="tab" onclick="showTab('vergl',this)">🔍 Feldvergleich</div>
  <div class="tab" onclick="showTab('doku',this)">📖 Dokumentation</div>
</div>

<!-- ═══ TAB 1: Konvertierungen ═══ -->
<div id="tab-konv" class="panel active">
  ${results.length === 0
    ? `<div class="no-data">Noch keine Konvertierungen.<br>XML-Datei in Ordner <strong>0.1</strong> legen um zu starten.</div>`
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
    <div class="legend-item"><div class="l-dot" style="background:rgba(63,185,80,.3)"></div>Geändert/Umbenannt</div>
    <div class="legend-item"><div class="l-dot" style="background:rgba(248,81,73,.2)"></div>Entfernt in .08</div>
    <div class="legend-item"><span class="bnk-ok">✓</span>&nbsp;Pflichtfeld vorhanden</div>
    <div class="legend-item"><span class="bnk-fail">✗</span>&nbsp;Pflichtfeld fehlt</div>
    <div class="legend-item"><span class="bnk-opt">—</span>&nbsp;Optional</div>
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
      <li>XML-Datei in Ordner <code>0.1</code> legen</li>
      <li>Konvertierer erkennt die Datei automatisch (Chokidar-Watcher)</li>
      <li>Konvertierung pain.008.001.01 → pain.008.001.08 wird durchgeführt</li>
      <li>Ergebnis wird gegen pain.008.001.08-Schema validiert</li>
      <li>Bei Erfolg: Ausgabe in <code>0.8/dateiname.08.xml</code>, Original in <code>0.1/archiv/</code></li>
      <li>Bei Fehler: Original und konvertierte Datei in <code>fehler/</code></li>
      <li>Dashboard (<code>dashboard.html</code>) wird aktualisiert</li>
    </ul>
  </div>
  <div class="doc-section">
    <h2>Validierungsregeln (.08)</h2>
    <ul>
      <li>GrpHdr: MsgId (max 35 Zeichen), CreDtTm (ISO-Datetime), NbOfTxs, CtrlSum, InitgPty/Nm</li>
      <li>PmtInf: PmtMtd muss "DD" sein; ReqdColltnDt im Format YYYY-MM-DD</li>
      <li>PmtInf: CdtrSchmeId/Othr/Id (Gläubiger-ID) auf PmtInf-Ebene (nicht in DrctDbtTx)</li>
      <li>CdtrAgt + DbtrAgt: BICFI-Format <code>[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?</code></li>
      <li>IBAN-Format: 2 Buchstaben + 2 Ziffern + 11-30 alphanumerische Zeichen</li>
      <li>DrctDbtTx: EndToEndId, MndtId, DtOfSgntr, Dbtr/Nm, DbtrAcct/Id/IBAN Pflichtfelder</li>
      <li>NbOfTxs und CtrlSum werden gegen tatsächliche Transaktionen abgeglichen</li>
    </ul>
  </div>
</div>

<div class="refresh">Seite neu laden um aktuelle Daten zu sehen &nbsp;·&nbsp; Strg+R</div>

<script>
const DATA = ${dataJson};

function showTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
  if (id === 'vergl') initCmp();
}

/* ── Konvertierungen Tab ── */
function initConv() {
  const tbody = document.getElementById('convBody');
  if (!tbody) return;
  tbody.innerHTML = DATA.map((c, i) => {
    const s = c.validation && c.validation.summary;
    const errs = c.validation ? c.validation.errors.length : 0;
    const wrns = c.validation ? c.validation.warnings.length : 0;
    const ts = c.timestamp ? new Date(c.timestamp).toLocaleString('de-AT') : '—';
    return \`<tr>
      <td>\${c.status==='ok'?'<span class="badge badge-green">✓ OK</span>':'<span class="badge badge-red">✗ Fehler</span>'}</td>
      <td class="mono">\${esc(c.filename)}</td>
      <td style="white-space:nowrap;color:#8b949e;font-size:12px">\${esc(ts)}</td>
      <td style="text-align:right">\${s ? s.txCount : '—'}</td>
      <td style="text-align:right">\${s ? s.ctrlSum.toFixed(2)+' EUR' : '—'}</td>
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
  if (c.validation) {
    if (c.validation.summary) {
      const s = c.validation.summary;
      html += \`<div class="summary-chips">
        <span class="chip">MsgId: \${esc(s.msgId)}</span>
        <span class="chip">Buchungen: \${s.txCount} \${s.txCountMatch?'✓':'⚠'}</span>
        <span class="chip">CtrlSum: \${s.ctrlSum!=null?s.ctrlSum.toFixed(2):'?'} EUR \${s.ctrlSumMatch?'✓':'⚠'}</span>
        <span class="chip">Auftraggeber: \${esc(s.initiatingParty||'—')}</span>
      </div>\`;
    }
    if (c.validation.errors.length > 0) {
      html += '<ul class="err-list">' + c.validation.errors.map(e => \`<li>✗ [\${esc(e.field)}] \${esc(e.message)}</li>\`).join('') + '</ul>';
    }
    if (c.validation.warnings.length > 0) {
      html += '<ul class="err-list">' + c.validation.warnings.map(w => \`<li class="warn">⚠ [\${esc(w.field)}] \${esc(w.message)}</li>\`).join('') + '</ul>';
    }
  }
  return html || '<span style="color:#8b949e">Keine Details verfügbar</span>';
}

function toggleDetail(i) {
  const row = document.getElementById('dr-' + i);
  row.classList.toggle('open');
}

/* ── Feldvergleich Tab ── */
let curConv = 0, curBlock = 0, cmpInited = false;

function initCmp() {
  if (cmpInited) return;
  cmpInited = true;
  const sel = document.getElementById('fileSelect');
  if (!DATA || DATA.length === 0) {
    document.getElementById('cmpBody').innerHTML = '<tr><td colspan="3" class="no-data">Keine Konvertierungen vorhanden</td></tr>';
    return;
  }
  DATA.forEach((c, i) => {
    const opt = document.createElement('option');
    const ts = c.timestamp ? new Date(c.timestamp).toLocaleString('de-AT') : '';
    opt.value = i;
    opt.text = (c.status==='ok'?'✓ ':'✗ ') + c.filename + (ts?' · '+ts:'');
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
  const conv   = DATA[curConv];
  const blocks = conv.comparison || [];
  if (!blocks.length) {
    document.getElementById('cmpBody').innerHTML = '<tr><td colspan="3" class="no-data">Kein Vergleich verfügbar</td></tr>';
    document.getElementById('blockLbl').textContent = '—';
    document.getElementById('blockCtr').textContent = '';
    return;
  }
  const block = blocks[curBlock];
  document.getElementById('blockLbl').textContent  = block.label || block.id;
  document.getElementById('blockCtr').textContent  = (curBlock+1) + ' / ' + blocks.length;
  document.getElementById('btnPrev').disabled = curBlock === 0;
  document.getElementById('btnNext').disabled = curBlock === blocks.length - 1;

  document.getElementById('cmpBody').innerHTML = (block.rows || []).map(row => {
    const removed = !!row.removedIn08;
    const changed = row.changed && !removed;
    const renamed = row.renamed || (row.label01 !== row.label08 && !removed && row.label08 !== null);
    const cls = [removed?'row-removed':'', changed?'row-changed':''].filter(Boolean).join(' ');

    const c1 = \`<td><div class="fld-lbl">\${esc(row.label01||row.label08||'')}</div>
      <div class="fld-val\${row.val01==null?' null':''}">\${row.val01!=null?esc(row.val01):'(leer)'}</div></td>\`;

    let l08 = removed ? '(entfernt in .08)' : esc(row.label08||'');
    let renHint = renamed && row.label01 && row.label08 && row.label01!==row.label08
      ? \`<div class="rename-hint">↑ \${esc(row.label01)}</div>\` : '';
    const c2 = \`<td class="td-08"><div class="fld-lbl">\${l08}\${renHint}</div>
      <div class="fld-val\${row.val08==null?' null':''}">\${row.val08!=null?esc(row.val08):removed?'':  '(leer)'}</div></td>\`;

    let c3html = removed
      ? '<span class="bnk-opt">Nicht in .08</span>'
      : row.bankRequired
        ? (row.bankOk ? '<span class="bnk-ok">✓ Pflichtfeld</span>' : '<span class="bnk-fail">✗ Fehlt!</span>')
        : '<span class="bnk-opt">— Optional</span>';
    const c3lbl = !removed && row.bankRequired ? \`<div class="bnk-lbl">\${esc(row.label08||'')}</div>\` : '';
    const c3 = \`<td><div>\${c3html}</div>\${c3lbl}</td>\`;

    return \`<tr class="\${cls}">\${c1}\${c2}\${c3}</tr>\`;
  }).join('');
}

function esc(s){if(s==null)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

initConv();
</script>
</body>
</html>`;
}

module.exports = { generateDashboard };
