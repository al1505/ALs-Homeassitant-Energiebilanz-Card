'use strict';

const { XMLParser } = require('fast-xml-parser');

const TARGET_NS  = 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.08';
const VALID_SEQ  = new Set(['FRST', 'RCUR', 'OOFF', 'FNAL']);
const VALID_LCLI = new Set(['CORE', 'B2B']);
const IBAN_RE    = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
const BIC_RE     = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const DATE_RE    = /^\d{4}-\d{2}-\d{2}$/;
const DTTM_RE    = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function g(obj, ...keys) {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function s(val) {
  return val == null ? '' : String(val).trim();
}

function toArr(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function validatePain008(xmlString) {
  const errors   = [];
  const warnings = [];

  const err  = (field, msg) => errors.push({ field, message: msg });
  const warn = (field, msg) => warnings.push({ field, message: msg });

  if (!xmlString.includes(TARGET_NS)) {
    warn('Document/@xmlns', `Namespace "${TARGET_NS}" nicht im Dokument gefunden`);
  }

  const parser = new XMLParser({
    ignoreAttributes:    false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    parseTagValue:       false,
    trimValues:          true,
    isArray: (name) => ['DrctDbtTxInf', 'PmtInf', 'AdrLine'].includes(name),
  });

  let parsed;
  try {
    parsed = parser.parse(xmlString);
  } catch (e) {
    return { valid: false, errors: [{ field: 'XML', message: `XML-Parsefehler: ${e.message}` }], warnings: [], summary: null };
  }

  const docNode = parsed['Document'];
  if (!docNode) {
    err('Document', 'Kein <Document>-Wurzelelement gefunden');
    return { valid: false, errors, warnings, summary: null };
  }

  const root = docNode['CstmrDrctDbtInitn'];
  if (!root) {
    err('CstmrDrctDbtInitn', 'Kein <CstmrDrctDbtInitn>-Element — falsche Dokumentstruktur');
    return { valid: false, errors, warnings, summary: null };
  }

  // --- GrpHdr ---
  const grpHdr = root['GrpHdr'];
  if (!grpHdr) {
    err('GrpHdr', 'Kein <GrpHdr>-Element');
    return { valid: false, errors, warnings, summary: null };
  }

  const msgId = s(grpHdr['MsgId']);
  if (!msgId)           err('GrpHdr/MsgId', 'MsgId fehlt');
  else if (msgId.length > 35) err('GrpHdr/MsgId', `MsgId zu lang (${msgId.length}/35 Zeichen)`);

  const creDtTm = s(grpHdr['CreDtTm']);
  if (!creDtTm)              err('GrpHdr/CreDtTm', 'CreDtTm fehlt');
  else if (!DTTM_RE.test(creDtTm)) err('GrpHdr/CreDtTm', `Ungültiges Datums-/Zeitformat: "${creDtTm}"`);

  if (grpHdr['Grpg']) warn('GrpHdr/Grpg', '<Grpg>-Element vorhanden — existiert nicht in pain.008.001.08');

  const expectedNbOfTxs = parseInt(s(grpHdr['NbOfTxs']), 10);
  if (isNaN(expectedNbOfTxs) || expectedNbOfTxs <= 0) {
    err('GrpHdr/NbOfTxs', `Ungültige Transaktionsanzahl: "${s(grpHdr['NbOfTxs'])}"`);
  }

  const expectedCtrlSum = parseFloat(s(grpHdr['CtrlSum']));
  if (isNaN(expectedCtrlSum) || expectedCtrlSum <= 0) {
    err('GrpHdr/CtrlSum', `Ungültige Kontrollsumme: "${s(grpHdr['CtrlSum'])}"`);
  }

  const initgPtyNm = s(g(grpHdr, 'InitgPty', 'Nm'));
  if (!initgPtyNm) warn('GrpHdr/InitgPty/Nm', 'Auftraggeber-Name ist leer');

  // --- PmtInf ---
  const pmtInfs = toArr(root['PmtInf']);
  if (pmtInfs.length === 0) {
    err('PmtInf', 'Kein <PmtInf>-Block gefunden');
    return { valid: false, errors, warnings, summary: null };
  }

  let totalTxCount = 0;
  let totalCtrlSum = 0;

  for (let pi = 0; pi < pmtInfs.length; pi++) {
    const pmtInf = pmtInfs[pi];
    const pfx    = `PmtInf[${pi + 1}]`;

    if (!pmtInf['PmtInfId']) err(`${pfx}/PmtInfId`, 'PmtInfId fehlt');
    if (s(pmtInf['PmtMtd']) !== 'DD') {
      err(`${pfx}/PmtMtd`, `PmtMtd muss "DD" sein, ist: "${s(pmtInf['PmtMtd'])}"`);
    }

    const seqTp = s(g(pmtInf, 'PmtTpInf', 'SeqTp'));
    if (!VALID_SEQ.has(seqTp)) {
      warn(`${pfx}/PmtTpInf/SeqTp`, `Unbekannter SeqTp: "${seqTp}" (erwartet: FRST/RCUR/OOFF/FNAL)`);
    }

    const lclInstrm = s(g(pmtInf, 'PmtTpInf', 'LclInstrm', 'Cd'));
    if (!VALID_LCLI.has(lclInstrm)) {
      warn(`${pfx}/PmtTpInf/LclInstrm/Cd`, `Unbekannter LclInstrm: "${lclInstrm}" (erwartet: CORE/B2B)`);
    }

    const reqdDate = s(pmtInf['ReqdColltnDt']);
    if (!reqdDate)              err(`${pfx}/ReqdColltnDt`, 'ReqdColltnDt fehlt');
    else if (!DATE_RE.test(reqdDate)) err(`${pfx}/ReqdColltnDt`, `Ungültiges Datumsformat: "${reqdDate}"`);

    const cdtrNm = s(g(pmtInf, 'Cdtr', 'Nm'));
    if (!cdtrNm) warn(`${pfx}/Cdtr/Nm`, 'Gläubigername fehlt');

    const cdtrIban = s(g(pmtInf, 'CdtrAcct', 'Id', 'IBAN'));
    if (!cdtrIban)              err(`${pfx}/CdtrAcct/Id/IBAN`, 'Gläubiger-IBAN fehlt');
    else if (!IBAN_RE.test(cdtrIban)) warn(`${pfx}/CdtrAcct/Id/IBAN`, `IBAN-Format ungewöhnlich: "${cdtrIban}"`);

    const cdtrBic = s(g(pmtInf, 'CdtrAgt', 'FinInstnId', 'BICFI'));
    if (!cdtrBic)             err(`${pfx}/CdtrAgt/FinInstnId/BICFI`, 'Gläubiger-Bank-BICFI fehlt');
    else if (!BIC_RE.test(cdtrBic)) warn(`${pfx}/CdtrAgt/FinInstnId/BICFI`, `BIC-Format ungewöhnlich: "${cdtrBic}"`);

    // CdtrSchmeId liegt in pain.008.001.08 auf PmtInf-Ebene (nicht in DrctDbtTx)
    const credId = s(g(pmtInf, 'CdtrSchmeId', 'Id', 'PrvtId', 'Othr', 'Id'));
    if (!credId) err(`${pfx}/CdtrSchmeId`, 'Gläubiger-ID (Creditor Identifier) fehlt');

    const pmtInfNbOfTxs = parseInt(s(pmtInf['NbOfTxs']), 10);
    const pmtInfCtrlSum = parseFloat(s(pmtInf['CtrlSum']));

    const txs = toArr(pmtInf['DrctDbtTxInf']);
    if (txs.length === 0) err(`${pfx}`, 'Keine <DrctDbtTxInf>-Einträge');

    let pmtAmtSum = 0;

    for (let ti = 0; ti < txs.length; ti++) {
      const tx     = txs[ti];
      const txPfx  = `${pfx}/DrctDbtTxInf[${ti + 1}]`;

      const e2eId = s(g(tx, 'PmtId', 'EndToEndId'));
      if (!e2eId) err(`${txPfx}/PmtId/EndToEndId`, 'EndToEndId fehlt');

      const instdAmt = tx['InstdAmt'];
      let amtNum = NaN;
      if (instdAmt == null) {
        err(`${txPfx}/InstdAmt`, 'Betrag fehlt');
      } else {
        const amtStr = typeof instdAmt === 'object' ? s(instdAmt['#text']) : s(instdAmt);
        amtNum = parseFloat(amtStr);
        if (isNaN(amtNum) || amtNum <= 0) err(`${txPfx}/InstdAmt`, `Ungültiger Betrag: "${amtStr}"`);
        const ccy = typeof instdAmt === 'object' ? (instdAmt['@_Ccy'] || '') : '';
        if (ccy && ccy !== 'EUR') warn(`${txPfx}/InstdAmt/@Ccy`, `Währung ist nicht EUR: "${ccy}"`);
      }
      if (!isNaN(amtNum) && amtNum > 0) pmtAmtSum += amtNum;

      const mndtId = s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'MndtId'));
      if (!mndtId) err(`${txPfx}/DrctDbtTx/MndtRltdInf/MndtId`, 'Mandats-ID fehlt');

      const dtOfSgntr = s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'DtOfSgntr'));
      if (!dtOfSgntr)               err(`${txPfx}/DrctDbtTx/MndtRltdInf/DtOfSgntr`, 'Mandatsdatum fehlt');
      else if (!DATE_RE.test(dtOfSgntr)) err(`${txPfx}/DrctDbtTx/MndtRltdInf/DtOfSgntr`, `Ungültiges Datum: "${dtOfSgntr}"`);

      const dbtrBic = s(g(tx, 'DbtrAgt', 'FinInstnId', 'BICFI'));
      if (!dbtrBic)             err(`${txPfx}/DbtrAgt/FinInstnId/BICFI`, 'Schuldner-Bank-BICFI fehlt');
      else if (!BIC_RE.test(dbtrBic)) warn(`${txPfx}/DbtrAgt/FinInstnId/BICFI`, `BIC-Format ungewöhnlich: "${dbtrBic}"`);

      const dbtrNm = s(g(tx, 'Dbtr', 'Nm'));
      if (!dbtrNm) err(`${txPfx}/Dbtr/Nm`, 'Schuldnername fehlt');

      const dbtrIban = s(g(tx, 'DbtrAcct', 'Id', 'IBAN'));
      if (!dbtrIban)               err(`${txPfx}/DbtrAcct/Id/IBAN`, 'Schuldner-IBAN fehlt');
      else if (!IBAN_RE.test(dbtrIban)) warn(`${txPfx}/DbtrAcct/Id/IBAN`, `IBAN-Format ungewöhnlich: "${dbtrIban}"`);
    }

    totalTxCount += txs.length;
    totalCtrlSum += pmtAmtSum;

    // PmtInf-level control sums (if present)
    if (!isNaN(pmtInfNbOfTxs) && pmtInfNbOfTxs !== txs.length) {
      err(`${pfx}/NbOfTxs`, `PmtInf-NbOfTxs (${pmtInfNbOfTxs}) ≠ tatsächliche Anzahl (${txs.length})`);
    }
    if (!isNaN(pmtInfCtrlSum) && Math.abs(round2(pmtInfCtrlSum) - round2(pmtAmtSum)) > 0.005) {
      err(`${pfx}/CtrlSum`, `PmtInf-CtrlSum (${pmtInfCtrlSum.toFixed(2)}) ≠ Summe Beträge (${pmtAmtSum.toFixed(2)}) EUR`);
    }
  }

  // GrpHdr control sum verification
  const txCountMatch = !isNaN(expectedNbOfTxs) && expectedNbOfTxs === totalTxCount;
  const ctrlSumMatch = !isNaN(expectedCtrlSum) && Math.abs(round2(expectedCtrlSum) - round2(totalCtrlSum)) <= 0.005;

  if (!txCountMatch && !isNaN(expectedNbOfTxs)) {
    err('GrpHdr/NbOfTxs', `Transaktionsanzahl: erwartet ${expectedNbOfTxs}, tatsächlich ${totalTxCount}`);
  }
  if (!ctrlSumMatch && !isNaN(expectedCtrlSum)) {
    err('GrpHdr/CtrlSum', `Kontrollsumme: erwartet ${expectedCtrlSum.toFixed(2)} EUR, tatsächlich ${round2(totalCtrlSum).toFixed(2)} EUR`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      msgId,
      creDtTm,
      initiatingParty: initgPtyNm,
      txCount:          totalTxCount,
      ctrlSum:          round2(totalCtrlSum),
      expectedTxCount:  isNaN(expectedNbOfTxs) ? null : expectedNbOfTxs,
      expectedCtrlSum:  isNaN(expectedCtrlSum)  ? null : round2(expectedCtrlSum),
      txCountMatch,
      ctrlSumMatch,
    },
  };
}

module.exports = { validatePain008 };
