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
  return new Intl.NumberFormat('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' EUR';
}

function generateReport(results, generatedAt) {
  const total      = results.length;
  const successful = results.filter(r => r.status === 'ok').length;
  const failed     = results.filter(r => r.status === 'fehler').length;
  const withWarns  = results.filter(r => r.status === 'ok' && r.validation && r.validation.warnings.length > 0).length;

  const rows = results.map((r, i) => {
    const isOk = r.status === 'ok';
    const sum  = r.validation && r.validation.summary;

    const txOk  = sum && sum.txCountMatch;
    const csOk  = sum && sum.ctrlSumMatch;
    const wCnt  = r.validation ? r.validation.warnings.length : 0;
    const eCnt  = r.validation ? r.validation.errors.length   : 0;

    const statusBadge = isOk
      ? `<span class="badge ok">&#10003; Konvertiert${wCnt > 0 ? ` (${wCnt} Warnungen)` : ''}</span>`
      : `<span class="badge err">&#10007; Fehler</span>`;

    const txBadge = !sum ? '<span class="na">–</span>'
      : txOk
        ? `<span class="badge ok">&#10003; ${sum.txCount}</span>`
        : `<span class="badge err">&#10007; ${sum.txCount}/${sum.expectedTxCount}</span>`;

    const csBadge = !sum ? '<span class="na">–</span>'
      : csOk
        ? `<span class="badge ok">&#10003; ${fmtAmt(sum.ctrlSum)}</span>`
        : `<span class="badge err">&#10007; ${fmtAmt(sum.ctrlSum)} &ne; ${fmtAmt(sum.expectedCtrlSum)}</span>`;

    const issueItems = [];
    if (r.error && !r.validation) {
      issueItems.push(`<li class="ie">&#9888; ${esc(r.error)}</li>`);
    }
    if (r.validation) {
      r.validation.errors.forEach(e =>
        issueItems.push(`<li class="ie"><strong>${esc(e.field)}:</strong> ${esc(e.message)}</li>`));
      r.validation.warnings.forEach(w =>
        issueItems.push(`<li class="iw"><strong>${esc(w.field)}:</strong> ${esc(w.message)}</li>`));
    }

    const detId   = `d${i}`;
    const issHtml = issueItems.length > 0
      ? `<button class="btn" onclick="tog('${detId}')">Details (${issueItems.length})</button>
         <ul class="issues" id="${detId}" hidden>${issueItems.join('')}</ul>`
      : `<span class="na">Keine Probleme</span>`;

    const msgId = sum ? esc(sum.msgId)            : '–';
    const party = sum ? esc(sum.initiatingParty)   : '–';
    const fname = esc(r.filename || r.inputFile.split('/').pop());
    const fpath = esc(r.inputFile);

    return `
    <tr class="${isOk ? 'ro' : 're'}">
      <td>${statusBadge}</td>
      <td class="fn" title="${fpath}">${fname}</td>
      <td>${party}</td>
      <td class="mono">${msgId}</td>
      <td>${txBadge}</td>
      <td>${csBadge}</td>
      <td>${issHtml}</td>
    </tr>`;
  }).join('');

  const ts = generatedAt || new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SEPA Konvertierungs-Bericht</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;color:#111827;min-height:100vh;padding:28px 24px}
h1{font-size:1.55rem;font-weight:800;letter-spacing:-.02em;margin-bottom:3px}
.sub{color:#6b7280;font-size:.83rem;margin-bottom:26px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:30px}
.card{background:#fff;border-radius:12px;padding:18px 22px;box-shadow:0 1px 3px rgba(0,0,0,.08);border-left:4px solid}
.card.bl{border-color:#3b82f6}.card.gr{border-color:#22c55e}.card.rd{border-color:#ef4444}.card.yl{border-color:#f59e0b}
.num{font-size:2.6rem;font-weight:800;line-height:1}
.card.bl .num{color:#2563eb}.card.gr .num{color:#16a34a}.card.rd .num{color:#dc2626}.card.yl .num{color:#d97706}
.lbl{font-size:.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.wrap{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:.855rem}
th{background:#1e293b;color:#f8fafc;text-align:left;padding:11px 14px;font-weight:600;white-space:nowrap;font-size:.8rem;letter-spacing:.03em}
td{padding:11px 14px;border-bottom:1px solid #f1f5f9;vertical-align:top}
tr.ro:hover td{background:#f0fdf4}tr.re:hover td{background:#fef2f2}
tr.re td:first-child{border-left:3px solid #ef4444}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:.73rem;font-weight:700}
.badge.ok{background:#dcfce7;color:#15803d}.badge.err{background:#fee2e2;color:#b91c1c}
.fn{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}
.mono{font-family:monospace;font-size:.8rem}
.na{color:#9ca3af;font-size:.82rem}
.btn{background:none;border:1px solid #d1d5db;border-radius:6px;padding:3px 8px;font-size:.73rem;cursor:pointer;color:#374151}
.btn:hover{background:#f9fafb}
.issues{list-style:none;margin-top:7px;padding:8px 12px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb}
.issues li{font-size:.78rem;padding:2px 0;line-height:1.4}
.ie{color:#b91c1c}.iw{color:#92400e}
.footer{margin-top:22px;text-align:center;font-size:.73rem;color:#9ca3af}
@media(max-width:700px){.grid{grid-template-columns:repeat(2,1fr)}table{font-size:.78rem}th,td{padding:9px 10px}}
</style>
</head>
<body>
<h1>SEPA Konvertierungs-Bericht</h1>
<p class="sub">Erstellt: ${fmtDt(ts)}&ensp;&middot;&ensp;pain.008.001.01 (STUZZA&nbsp;&rarr;&nbsp;pain.008.001.08)</p>

<div class="grid">
  <div class="card bl"><div class="num">${total}</div><div class="lbl">Dateien gesamt</div></div>
  <div class="card gr"><div class="num">${successful}</div><div class="lbl">Erfolgreich</div></div>
  <div class="card rd"><div class="num">${failed}</div><div class="lbl">Fehlgeschlagen</div></div>
  <div class="card yl"><div class="num">${withWarns}</div><div class="lbl">Mit Warnungen</div></div>
</div>

<div class="wrap">
<table>
<thead><tr>
  <th>Status</th><th>Quelldatei</th><th>Auftraggeber</th>
  <th>MsgId</th><th>Buchungen</th><th>Kontrollsumme</th><th>Pr&uuml;fung</th>
</tr></thead>
<tbody>
${rows || '<tr><td colspan="7" style="text-align:center;padding:36px;color:#9ca3af;font-size:.9rem">Noch keine Dateien verarbeitet</td></tr>'}
</tbody>
</table>
</div>

<div class="footer">SEPA pain.008 Konvertierer &middot; ${total} Datei${total !== 1 ? 'en' : ''} verarbeitet</div>

<script>
function tog(id){const e=document.getElementById(id);if(e)e.hidden=!e.hidden}
</script>
</body>
</html>`;
}

module.exports = { generateReport };
