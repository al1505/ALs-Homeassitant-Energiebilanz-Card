'use strict';

const { XMLParser } = require('fast-xml-parser');

function mkParser() {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
    isArray: (name) => ['DrctDbtTxInf', 'PmtInf', 'AdrLine'].includes(name),
  });
}

function g(obj, ...keys) {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function s(val) {
  if (val == null) return null;
  const str = String(val).trim();
  return str === '' ? null : str;
}

function toArr(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function amtInfo(instdAmt) {
  if (instdAmt == null) return { val: null, ccy: 'EUR' };
  if (typeof instdAmt === 'object') return { val: s(instdAmt['#text']), ccy: instdAmt['@_Ccy'] || 'EUR' };
  return { val: s(instdAmt), ccy: 'EUR' };
}

const PSTL_FIELDS = ['Dept','SubDept','StrtNm','BldgNb','BldgNm','Flr','PstBx','Room',
                     'PstCd','TwnNm','TwnLctnNm','DstrctNm','CtrySubDvsn','Ctry'];

function pstlFields(pstlAdr) {
  if (!pstlAdr) return [];
  const rows = [];
  for (const f of PSTL_FIELDS) {
    if (pstlAdr[f]) rows.push({ label: `PstlAdr/${f}`, val: s(pstlAdr[f]) });
  }
  const lines = toArr(pstlAdr['AdrLine']);
  if (lines.length) rows.push({ label: 'PstlAdr/AdrLine', val: lines.join(' | ') });
  return rows;
}

// ─── Extract blocks from STUZZA pain.008.001.01 ────────────────────────────

function extract01(xml) {
  const parsed = mkParser().parse(xml.replace(/^﻿/, ''));
  const blocks = [];
  const doc = parsed['Document'];
  if (!doc) return blocks;
  const root = doc['pain.008.001.01'];
  if (!root) return blocks;

  const grpHdr = root['GrpHdr'];
  if (grpHdr) {
    blocks.push({ id: 'GrpHdr', label: 'GrpHdr — Group Header', fields: [
      { label: 'MsgId',           val: s(grpHdr['MsgId']) },
      { label: 'CreDtTm',         val: s(grpHdr['CreDtTm']) },
      { label: 'NbOfTxs',         val: s(grpHdr['NbOfTxs']) },
      { label: 'CtrlSum',         val: s(grpHdr['CtrlSum']) },
      { label: 'Grpg',            val: s(grpHdr['Grpg']) },
      { label: 'InitgPty/Nm',     val: s(g(grpHdr, 'InitgPty', 'Nm')) },
    ]});
  }

  toArr(root['PmtInf']).forEach((pmtInf, pi) => {
    const pfx      = `PmtInf[${pi+1}]`;
    const firstTx  = toArr(pmtInf['DrctDbtTxInf'])[0];
    const schmeId  = g(firstTx, 'DrctDbtTx', 'CdtrSchmeId');

    blocks.push({ id: pfx, label: pfx, fields: [
      { label: 'PmtInfId',                         val: s(pmtInf['PmtInfId']) },
      { label: 'PmtMtd',                           val: s(pmtInf['PmtMtd']) },
      { label: 'NbOfTxs',                          val: s(pmtInf['NbOfTxs']) },
      { label: 'CtrlSum',                          val: s(pmtInf['CtrlSum']) },
      { label: 'PmtTpInf/SvcLvl/Cd',              val: s(g(pmtInf, 'PmtTpInf', 'SvcLvl', 'Cd')) },
      { label: 'PmtTpInf/LclInstrm/Cd',           val: s(g(pmtInf, 'PmtTpInf', 'LclInstrm', 'Cd')) },
      { label: 'PmtTpInf/SeqTp',                  val: s(g(pmtInf, 'PmtTpInf', 'SeqTp')) },
      { label: 'ReqdColltnDt',                     val: s(pmtInf['ReqdColltnDt']) },
      { label: 'Cdtr/Nm',                          val: s(g(pmtInf, 'Cdtr', 'Nm')) },
      { label: 'CdtrAcct/Id/IBAN',                 val: s(g(pmtInf, 'CdtrAcct', 'Id', 'IBAN')) },
      { label: 'CdtrAgt/FinInstnId/BIC',           val: s(g(pmtInf, 'CdtrAgt', 'FinInstnId', 'BIC')) },
      // In STUZZA: CdtrSchmeId lebt in DrctDbtTx, nicht auf PmtInf-Ebene
      { label: 'DrctDbtTx/CdtrSchmeId/OthrId/Id',   val: s(g(schmeId, 'Id', 'PrvtId', 'OthrId', 'Id')) },
      { label: 'DrctDbtTx/CdtrSchmeId/OthrId/IdTp', val: s(g(schmeId, 'Id', 'PrvtId', 'OthrId', 'IdTp')) },
    ]});

    toArr(pmtInf['DrctDbtTxInf']).forEach((tx, ti) => {
      const txPfx = `${pfx}/DrctDbtTxInf[${ti+1}]`;
      const { val: amtVal, ccy } = amtInfo(tx['InstdAmt']);
      const txSchme = g(tx, 'DrctDbtTx', 'CdtrSchmeId');

      const fields = [
        { label: 'PmtId/InstrId',                      val: s(g(tx, 'PmtId', 'InstrId')) },
        { label: 'PmtId/EndToEndId',                   val: s(g(tx, 'PmtId', 'EndToEndId')) },
        { label: `InstdAmt (${ccy})`,                  val: amtVal },
        { label: 'DrctDbtTx/MndtRltdInf/MndtId',      val: s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'MndtId')) },
        { label: 'DrctDbtTx/MndtRltdInf/DtOfSgntr',   val: s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'DtOfSgntr')) },
        { label: 'DrctDbtTx/CdtrSchmeId/OthrId/Id',   val: s(g(txSchme, 'Id', 'PrvtId', 'OthrId', 'Id')) },
        { label: 'DrctDbtTx/CdtrSchmeId/OthrId/IdTp', val: s(g(txSchme, 'Id', 'PrvtId', 'OthrId', 'IdTp')) },
        { label: 'DbtrAgt/FinInstnId/BIC',             val: s(g(tx, 'DbtrAgt', 'FinInstnId', 'BIC')) },
        { label: 'Dbtr/Nm',                            val: s(g(tx, 'Dbtr', 'Nm')) },
        ...pstlFields(g(tx, 'Dbtr', 'PstlAdr')),
        { label: 'DbtrAcct/Id/IBAN',                   val: s(g(tx, 'DbtrAcct', 'Id', 'IBAN')) },
        { label: 'RmtInf/Ustrd',                       val: s(g(tx, 'RmtInf', 'Ustrd')) },
      ];
      blocks.push({ id: txPfx, label: txPfx, fields });
    });
  });

  return blocks;
}

// ─── Extract blocks from pain.008.001.08 output ────────────────────────────

function extract08(xml) {
  const parsed = mkParser().parse(xml.replace(/^﻿/, ''));
  const blocks = [];
  const doc = parsed['Document'];
  if (!doc) return blocks;
  const root = doc['CstmrDrctDbtInitn'];
  if (!root) return blocks;

  const grpHdr = root['GrpHdr'];
  if (grpHdr) {
    blocks.push({ id: 'GrpHdr', label: 'GrpHdr — Group Header', fields: [
      { label: 'MsgId',         val: s(grpHdr['MsgId']) },
      { label: 'CreDtTm',       val: s(grpHdr['CreDtTm']) },
      { label: 'NbOfTxs',       val: s(grpHdr['NbOfTxs']) },
      { label: 'CtrlSum',       val: s(grpHdr['CtrlSum']) },
      { label: 'InitgPty/Nm',   val: s(g(grpHdr, 'InitgPty', 'Nm')) },
    ]});
  }

  toArr(root['PmtInf']).forEach((pmtInf, pi) => {
    const pfx = `PmtInf[${pi+1}]`;

    blocks.push({ id: pfx, label: pfx, fields: [
      { label: 'PmtInfId',                              val: s(pmtInf['PmtInfId']) },
      { label: 'PmtMtd',                                val: s(pmtInf['PmtMtd']) },
      { label: 'NbOfTxs',                               val: s(pmtInf['NbOfTxs']) },
      { label: 'CtrlSum',                               val: s(pmtInf['CtrlSum']) },
      { label: 'PmtTpInf/SvcLvl/Cd',                   val: s(g(pmtInf, 'PmtTpInf', 'SvcLvl', 'Cd')) },
      { label: 'PmtTpInf/LclInstrm/Cd',                val: s(g(pmtInf, 'PmtTpInf', 'LclInstrm', 'Cd')) },
      { label: 'PmtTpInf/SeqTp',                       val: s(g(pmtInf, 'PmtTpInf', 'SeqTp')) },
      { label: 'ReqdColltnDt',                          val: s(pmtInf['ReqdColltnDt']) },
      { label: 'Cdtr/Nm',                               val: s(g(pmtInf, 'Cdtr', 'Nm')) },
      { label: 'CdtrAcct/Id/IBAN',                      val: s(g(pmtInf, 'CdtrAcct', 'Id', 'IBAN')) },
      { label: 'CdtrAgt/FinInstnId/BICFI',              val: s(g(pmtInf, 'CdtrAgt', 'FinInstnId', 'BICFI')) },
      // In pain.008.001.08: CdtrSchmeId auf PmtInf-Ebene
      { label: 'CdtrSchmeId/Othr/Id',                   val: s(g(pmtInf, 'CdtrSchmeId', 'Id', 'PrvtId', 'Othr', 'Id')) },
      { label: 'CdtrSchmeId/Othr/SchmeNm/Prtry',        val: s(g(pmtInf, 'CdtrSchmeId', 'Id', 'PrvtId', 'Othr', 'SchmeNm', 'Prtry')) },
    ]});

    toArr(pmtInf['DrctDbtTxInf']).forEach((tx, ti) => {
      const txPfx = `${pfx}/DrctDbtTxInf[${ti+1}]`;
      const { val: amtVal, ccy } = amtInfo(tx['InstdAmt']);

      const fields = [
        { label: 'PmtId/InstrId',                     val: s(g(tx, 'PmtId', 'InstrId')) },
        { label: 'PmtId/EndToEndId',                   val: s(g(tx, 'PmtId', 'EndToEndId')) },
        { label: `InstdAmt (${ccy})`,                  val: amtVal },
        { label: 'DrctDbtTx/MndtRltdInf/MndtId',      val: s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'MndtId')) },
        { label: 'DrctDbtTx/MndtRltdInf/DtOfSgntr',   val: s(g(tx, 'DrctDbtTx', 'MndtRltdInf', 'DtOfSgntr')) },
        { label: 'DbtrAgt/FinInstnId/BICFI',           val: s(g(tx, 'DbtrAgt', 'FinInstnId', 'BICFI')) },
        { label: 'Dbtr/Nm',                            val: s(g(tx, 'Dbtr', 'Nm')) },
        ...pstlFields(g(tx, 'Dbtr', 'PstlAdr')),
        { label: 'DbtrAcct/Id/IBAN',                   val: s(g(tx, 'DbtrAcct', 'Id', 'IBAN')) },
        { label: 'RmtInf/Ustrd',                       val: s(g(tx, 'RmtInf', 'Ustrd')) },
      ];
      blocks.push({ id: txPfx, label: txPfx, fields });
    });
  });

  return blocks;
}

// ─── Merge into comparison rows ─────────────────────────────────────────────

// Fields required by bank (pain.008.001.08)
const BANK_REQ = {
  GrpHdr:       new Set(['MsgId','CreDtTm','NbOfTxs','CtrlSum','InitgPty/Nm']),
  PmtInf:       new Set(['PmtInfId','PmtMtd','PmtTpInf/LclInstrm/Cd','PmtTpInf/SeqTp',
                          'ReqdColltnDt','Cdtr/Nm','CdtrAcct/Id/IBAN',
                          'CdtrAgt/FinInstnId/BICFI','CdtrSchmeId/Othr/Id']),
  DrctDbtTxInf: new Set(['PmtId/EndToEndId','DrctDbtTx/MndtRltdInf/MndtId',
                          'DrctDbtTx/MndtRltdInf/DtOfSgntr',
                          'DbtrAgt/FinInstnId/BICFI','Dbtr/Nm','DbtrAcct/Id/IBAN']),
};

// Map from 08 label → 01 label (where they differ)
const LABEL_MAP_08_TO_01 = {
  'CdtrAgt/FinInstnId/BICFI':            'CdtrAgt/FinInstnId/BIC',
  'DbtrAgt/FinInstnId/BICFI':            'DbtrAgt/FinInstnId/BIC',
  'CdtrSchmeId/Othr/Id':                 'DrctDbtTx/CdtrSchmeId/OthrId/Id',
  'CdtrSchmeId/Othr/SchmeNm/Prtry':     'DrctDbtTx/CdtrSchmeId/OthrId/IdTp',
};

function blockType(id) {
  if (id === 'GrpHdr') return 'GrpHdr';
  if (/^PmtInf\[\d+\]$/.test(id)) return 'PmtInf';
  if (id.includes('DrctDbtTxInf')) return 'DrctDbtTxInf';
  return null;
}

function buildComparison(xml01, xml08) {
  const blocks01 = extract01(xml01);
  const blocks08 = extract08(xml08);

  const map01 = new Map(blocks01.map(b => [b.id, new Map(b.fields.map(f => [f.label, f.val]))]));

  return blocks08.map(b08 => {
    const fields01 = map01.get(b08.id) || new Map();
    const bankReq  = BANK_REQ[blockType(b08.id)] || new Set();
    const used01   = new Set();
    const rows     = [];

    for (const f08 of b08.fields) {
      const label01 = LABEL_MAP_08_TO_01[f08.label] || f08.label;
      const val01   = fields01.has(label01) ? fields01.get(label01)
                    : fields01.has(f08.label) ? fields01.get(f08.label)
                    : null;
      used01.add(label01);

      const renamed      = label01 !== f08.label;
      const valueChanged = val01 !== f08.val;
      const bankOk       = !bankReq.has(f08.label) || (f08.val !== null);

      rows.push({
        label01,
        label08:     f08.label,
        val01,
        val08:       f08.val,
        renamed,
        changed:     renamed || valueChanged,
        bankRequired: bankReq.has(f08.label),
        bankOk,
      });
    }

    // Fields only in 01 (removed in 08, e.g. Grpg)
    const b01 = blocks01.find(b => b.id === b08.id);
    if (b01) {
      for (const f of b01.fields) {
        if (!used01.has(f.label) && f.val !== null) {
          rows.push({
            label01:     f.label,
            label08:     null,
            val01:       f.val,
            val08:       null,
            renamed:     false,
            changed:     true,
            removedIn08: true,
            bankRequired: false,
            bankOk:      true,
          });
        }
      }
    }

    return { id: b08.id, label: b08.label, rows };
  });
}

module.exports = { buildComparison };
