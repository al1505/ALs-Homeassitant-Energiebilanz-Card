'use strict';

const { XMLParser } = require('fast-xml-parser');
const { create } = require('xmlbuilder2');

const TARGET_NS = 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.08';

function g(obj, ...keys) {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function s(val) {
  if (val == null) return '';
  return String(val).trim();
}

function toArr(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function buildFinInstnId(parent, finInstn) {
  if (!finInstn) return;
  const bic = s(finInstn['BIC'] || finInstn['BICFI']);
  if (!bic) return;
  parent.ele(TARGET_NS, 'FinInstnId').ele(TARGET_NS, 'BICFI').txt(bic);
}

// Structured field order as per ISO 20022 PostalAddress24 XSD
const PSTL_ADR_FIELDS = [
  'Dept','SubDept','StrtNm','BldgNb','BldgNm',
  'Flr','PstBx','Room','PstCd','TwnNm',
  'TwnLctnNm','DstrctNm','CtrySubDvsn',
];

function buildPstlAdr(parent, pstlAdr) {
  if (!pstlAdr) return;
  const adrEle = parent.ele(TARGET_NS, 'PstlAdr');
  // Structured fields first (XSD-konformer Reihenfolge)
  for (const field of PSTL_ADR_FIELDS) {
    if (pstlAdr[field]) adrEle.ele(TARGET_NS, field).txt(s(pstlAdr[field]));
  }
  // Ctry nach strukturierten Feldern, vor AdrLine (XSD-Reihenfolge)
  if (pstlAdr['Ctry']) adrEle.ele(TARGET_NS, 'Ctry').txt(s(pstlAdr['Ctry']));
  // Unstrukturierte Adresszeilen (alternativ zu strukturierten Feldern)
  for (const line of toArr(pstlAdr['AdrLine'])) {
    adrEle.ele(TARGET_NS, 'AdrLine').txt(s(line));
  }
}

function buildParty(parent, tag, party) {
  if (!party) return;
  const ele = parent.ele(TARGET_NS, tag);
  if (party['Nm']) ele.ele(TARGET_NS, 'Nm').txt(s(party['Nm']));
  buildPstlAdr(ele, party['PstlAdr']);
}

function buildAccount(parent, tag, acct) {
  if (!acct) return;
  const iban = g(acct, 'Id', 'IBAN');
  if (!iban) return;
  const ele = parent.ele(TARGET_NS, tag);
  ele.ele(TARGET_NS, 'Id').ele(TARGET_NS, 'IBAN').txt(s(iban));
  if (acct['Ccy']) ele.ele(TARGET_NS, 'Ccy').txt(s(acct['Ccy']));
}

function buildCdtrSchmeId(parent, cdtrSchmeId) {
  if (!cdtrSchmeId) return;
  const prvtId = g(cdtrSchmeId, 'Id', 'PrvtId');
  if (!prvtId) return;

  // Austrian STUZZA variant: OthrId/Id + OthrId/IdTp
  // Standard ISO variant:    Othr/Id   + Othr/SchmeNm/Prtry
  const othrId = prvtId['OthrId'];
  const othr   = prvtId['Othr'];

  const credId     = othrId ? s(othrId['Id'])  : (othr ? s(othr['Id']) : '');
  const schemeName = othrId ? s(othrId['IdTp']) : (othr ? s(g(othr, 'SchmeNm', 'Prtry')) : '');

  if (!credId) return;

  parent.ele(TARGET_NS, 'CdtrSchmeId')
    .ele(TARGET_NS, 'Id')
      .ele(TARGET_NS, 'PrvtId')
        .ele(TARGET_NS, 'Othr')
          .ele(TARGET_NS, 'Id').txt(credId).up()
          .ele(TARGET_NS, 'SchmeNm')
            .ele(TARGET_NS, 'Prtry').txt(schemeName || 'SEPA');
}

function buildMndtRltdInf(parent, mndt) {
  if (!mndt) return;
  const ele = parent.ele(TARGET_NS, 'MndtRltdInf');
  if (mndt['MndtId'])    ele.ele(TARGET_NS, 'MndtId').txt(s(mndt['MndtId']));
  if (mndt['DtOfSgntr']) ele.ele(TARGET_NS, 'DtOfSgntr').txt(s(mndt['DtOfSgntr']));
  if (mndt['AmdmntInd'] != null) ele.ele(TARGET_NS, 'AmdmntInd').txt(s(mndt['AmdmntInd']));
  if (mndt['AmdmntInfDtls']) {
    const amd    = mndt['AmdmntInfDtls'];
    const amdEle = ele.ele(TARGET_NS, 'AmdmntInfDtls');
    if (amd['OrgnlMndtId']) amdEle.ele(TARGET_NS, 'OrgnlMndtId').txt(s(amd['OrgnlMndtId']));
  }
}

function buildDrctDbtTxInf(parent, tx) {
  const ele = parent.ele(TARGET_NS, 'DrctDbtTxInf');

  const pmtId = tx['PmtId'];
  if (pmtId) {
    const pmtIdEle = ele.ele(TARGET_NS, 'PmtId');
    if (pmtId['InstrId'])    pmtIdEle.ele(TARGET_NS, 'InstrId').txt(s(pmtId['InstrId']));
    pmtIdEle.ele(TARGET_NS, 'EndToEndId').txt(s(pmtId['EndToEndId']));
  }

  const instdAmt = tx['InstdAmt'];
  if (instdAmt != null) {
    const amtVal = typeof instdAmt === 'object' ? s(instdAmt['#text']) : s(instdAmt);
    const ccy    = typeof instdAmt === 'object' ? (instdAmt['@_Ccy'] || 'EUR') : 'EUR';
    ele.ele(TARGET_NS, 'InstdAmt').att('Ccy', ccy).txt(amtVal);
  }

  const drctDbtTx = tx['DrctDbtTx'];
  if (drctDbtTx) {
    const drctEle = ele.ele(TARGET_NS, 'DrctDbtTx');
    buildMndtRltdInf(drctEle, drctDbtTx['MndtRltdInf']);
    // CdtrSchmeId wird auf PmtInf-Ebene geschrieben, nicht hier
  }

  const dbtrAgt = tx['DbtrAgt'];
  if (dbtrAgt) {
    const agtEle = ele.ele(TARGET_NS, 'DbtrAgt');
    buildFinInstnId(agtEle, dbtrAgt['FinInstnId']);
  }

  buildParty(ele, 'Dbtr', tx['Dbtr']);
  buildAccount(ele, 'DbtrAcct', tx['DbtrAcct']);

  const rmtInf = tx['RmtInf'];
  if (rmtInf && rmtInf['Ustrd']) {
    ele.ele(TARGET_NS, 'RmtInf').ele(TARGET_NS, 'Ustrd').txt(s(rmtInf['Ustrd']));
  }
}

function buildPmtInf(parent, pmtInf) {
  const ele = parent.ele(TARGET_NS, 'PmtInf');

  ele.ele(TARGET_NS, 'PmtInfId').txt(s(pmtInf['PmtInfId']));
  ele.ele(TARGET_NS, 'PmtMtd').txt(s(pmtInf['PmtMtd'] || 'DD'));
  if (pmtInf['NbOfTxs']) ele.ele(TARGET_NS, 'NbOfTxs').txt(s(pmtInf['NbOfTxs']));
  if (pmtInf['CtrlSum']) ele.ele(TARGET_NS, 'CtrlSum').txt(s(pmtInf['CtrlSum']));

  const pmtTpInf = pmtInf['PmtTpInf'];
  if (pmtTpInf) {
    const pmtTpEle = ele.ele(TARGET_NS, 'PmtTpInf');
    const svcLvlCd  = g(pmtTpInf, 'SvcLvl', 'Cd');
    if (svcLvlCd)  pmtTpEle.ele(TARGET_NS, 'SvcLvl').ele(TARGET_NS, 'Cd').txt(s(svcLvlCd));
    const lclInstrCd = g(pmtTpInf, 'LclInstrm', 'Cd');
    if (lclInstrCd) pmtTpEle.ele(TARGET_NS, 'LclInstrm').ele(TARGET_NS, 'Cd').txt(s(lclInstrCd));
    if (pmtTpInf['SeqTp']) pmtTpEle.ele(TARGET_NS, 'SeqTp').txt(s(pmtTpInf['SeqTp']));
  }

  ele.ele(TARGET_NS, 'ReqdColltnDt').txt(s(pmtInf['ReqdColltnDt']));

  buildParty(ele, 'Cdtr', pmtInf['Cdtr']);
  buildAccount(ele, 'CdtrAcct', pmtInf['CdtrAcct']);

  const cdtrAgt = pmtInf['CdtrAgt'];
  if (cdtrAgt) {
    const agtEle = ele.ele(TARGET_NS, 'CdtrAgt');
    buildFinInstnId(agtEle, cdtrAgt['FinInstnId']);
  }

  // CdtrSchmeId gehört laut pain.008.001.08 XSD auf PmtInf-Ebene (nach CdtrAgt),
  // nicht in jede DrctDbtTx. Wir nehmen sie aus der ersten Transaktion.
  const txList = toArr(pmtInf['DrctDbtTxInf']);
  const firstCdtrSchmeId = txList.length > 0
    ? txList[0]?.['DrctDbtTx']?.['CdtrSchmeId']
    : undefined;
  buildCdtrSchmeId(ele, firstCdtrSchmeId);

  for (const tx of txList) {
    buildDrctDbtTxInf(ele, tx);
  }
}

function convertPain008(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes:   false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    parseTagValue:       false,
    trimValues:          true,
    isArray: (name) => ['DrctDbtTxInf', 'PmtInf', 'AdrLine'].includes(name),
  });

  // Strip BOM if present
  const xml = xmlString.replace(/^﻿/, '');

  const parsed = parser.parse(xml);
  const docNode = parsed['Document'];
  if (!docNode) throw new Error('Kein <Document>-Wurzelelement gefunden');

  const src = docNode['pain.008.001.01'];
  if (!src) throw new Error('Kein <pain.008.001.01>-Element gefunden — erwartet Format APC:STUZZA:payments:ISO:pain:008:001:01:austrian:002');

  const grpHdr = src['GrpHdr'];
  if (!grpHdr) throw new Error('Kein <GrpHdr>-Element gefunden');

  const doc   = create({ version: '1.0', encoding: 'UTF-8' });
  const docEl = doc.ele(TARGET_NS, 'Document');
  const root  = docEl.ele(TARGET_NS, 'CstmrDrctDbtInitn');

  // GrpHdr — <Grpg> wird absichtlich weggelassen (existiert nicht in pain.008.001.08)
  const grpHdrEl = root.ele(TARGET_NS, 'GrpHdr');
  grpHdrEl.ele(TARGET_NS, 'MsgId').txt(s(grpHdr['MsgId']));
  grpHdrEl.ele(TARGET_NS, 'CreDtTm').txt(s(grpHdr['CreDtTm']));
  grpHdrEl.ele(TARGET_NS, 'NbOfTxs').txt(s(grpHdr['NbOfTxs']));
  grpHdrEl.ele(TARGET_NS, 'CtrlSum').txt(s(grpHdr['CtrlSum']));
  if (grpHdr['InitgPty']) {
    const initgPtyEl = grpHdrEl.ele(TARGET_NS, 'InitgPty');
    if (grpHdr['InitgPty']['Nm']) {
      initgPtyEl.ele(TARGET_NS, 'Nm').txt(s(grpHdr['InitgPty']['Nm']));
    }
  }

  for (const pmtInf of toArr(src['PmtInf'])) {
    buildPmtInf(root, pmtInf);
  }

  return doc.end({ prettyPrint: true });
}

module.exports = { convertPain008 };
