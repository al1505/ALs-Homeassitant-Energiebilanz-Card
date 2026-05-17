'use strict';

const fs       = require('fs');
const path     = require('path');
const chokidar = require('chokidar');
const { convertPain008 }    = require('./converter');
const { validatePain008 }   = require('./validator');
const { buildComparison }   = require('./comparator');
const { generateDashboard } = require('./dashboard');

const INPUT_DIR  = 'Eingabe-pain.008.001.01';
const OUTPUT_DIR = 'Konvertiert-pain.008.001.08';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeMove(src, destDir, filename) {
  ensureDir(destDir);
  let dest = path.join(destDir, filename);
  if (fs.existsSync(dest)) {
    const ext  = path.extname(filename);
    const base = path.basename(filename, ext);
    dest = path.join(destDir, `${base}_${Date.now()}${ext}`);
  }
  fs.renameSync(src, dest);
  return path.basename(dest);
}

function startWatcher(baseDir) {
  const inputDir     = path.join(baseDir, INPUT_DIR);
  const archivDir    = path.join(baseDir, INPUT_DIR, 'archiv');
  const outputDir    = path.join(baseDir, OUTPUT_DIR);
  const errorDir     = path.join(baseDir, 'Fehler');
  const dashFile     = path.join(baseDir, 'dashboard.html');

  ensureDir(inputDir);
  ensureDir(archivDir);
  ensureDir(outputDir);
  ensureDir(errorDir);

  const results = [];

  function saveDashboard() {
    const ts = new Date().toISOString();
    fs.writeFileSync(dashFile, generateDashboard(results, ts), 'utf-8');
  }

  function processFile(filePath) {
    const filename = path.basename(filePath);

    if (!filename.toLowerCase().endsWith('.xml')) return;
    if (path.dirname(path.resolve(filePath)) !== path.resolve(inputDir)) return;
    if (!fs.existsSync(filePath)) return;

    console.log(`\n📄 Verarbeite: ${filename}`);

    const result = {
      inputFile:  filePath,
      filename,
      status:     'fehler',
      error:      null,
      validation: null,
      comparison: [],
      timestamp:  new Date().toISOString(),
    };

    try {
      const xmlIn  = fs.readFileSync(filePath, 'utf-8').replace(/^﻿/, '');
      const xmlOut = convertPain008(xmlIn);

      const validation = validatePain008(xmlOut);
      result.validation = validation;

      // Build field comparison (safe — errors here must not abort the conversion)
      try {
        result.comparison = buildComparison(xmlIn, xmlOut);
      } catch (cmpErr) {
        console.log(`  ⚠  Feldvergleich übersprungen: ${cmpErr.message}`);
      }

      if (validation.valid) {
        result.status = 'ok';
        const sum = validation.summary;
        console.log(`  ✓ Konvertierung erfolgreich`);
        if (sum) {
          const txStatus = sum.txCountMatch ? 'OK' : `ABWEICHUNG (erwartet ${sum.expectedTxCount})`;
          const csStatus = sum.ctrlSumMatch ? 'OK' : `ABWEICHUNG (erwartet ${sum.expectedCtrlSum} EUR)`;
          console.log(`  ✓ Buchungen: ${sum.txCount} — ${txStatus}`);
          console.log(`  ✓ Kontrollsumme: ${sum.ctrlSum.toFixed(2)} EUR — ${csStatus}`);
        }
        if (validation.warnings.length > 0) {
          console.log(`  ⚠  ${validation.warnings.length} Warnung(en)`);
        }

        const outFilename = filename.replace(/\.xml$/i, '.08.xml');
        let outPath = path.join(outputDir, outFilename);
        if (fs.existsSync(outPath)) {
          const ext  = path.extname(outFilename);
          const base = path.basename(outFilename, ext);
          outPath = path.join(outputDir, `${base}_${Date.now()}${ext}`);
        }
        fs.writeFileSync(outPath, xmlOut, 'utf-8');
        console.log(`  → Ausgabe: 0.8/${path.basename(outPath)}`);

      } else {
        result.status = 'fehler';
        result.error  = validation.errors[0]?.message || 'Validierung fehlgeschlagen';
        console.log(`  ✗ Validierung: ${validation.errors.length} Fehler`);
        validation.errors.slice(0, 5).forEach(e => console.log(`    ✗ ${e.field}: ${e.message}`));
        if (validation.errors.length > 5) console.log(`    … und ${validation.errors.length - 5} weitere`);

        const errXmlName = filename.replace(/\.xml$/i, '_konvertiert_ungueltig.xml');
        fs.writeFileSync(path.join(errorDir, errXmlName), xmlOut, 'utf-8');

        const errName = safeMove(filePath, errorDir, filename);
        console.log(`  → Fehlerhaft archiviert: Fehler/${errName}`);
      }

    } catch (convErr) {
      result.error = convErr.message;
      console.log(`  ✗ Konvertierungsfehler: ${convErr.message}`);
      try {
        const errName = safeMove(filePath, errorDir, filename);
        console.log(`  → In Fehlerordner verschoben: Fehler/${errName}`);
      } catch (mvErr) {
        console.error(`  ⚠  Verschieben fehlgeschlagen: ${mvErr.message}`);
      }
    }

    if (fs.existsSync(filePath)) {
      try {
        const archName = safeMove(filePath, archivDir, filename);
        console.log(`  → Archiviert: 0.1/archiv/${archName}`);
      } catch (mvErr) {
        console.error(`  ⚠  Archivierung fehlgeschlagen: ${mvErr.message}`);
      }
    }

    results.push(result);
    saveDashboard();
    console.log(`  📊 Dashboard aktualisiert: dashboard.html`);
  }

  console.log('\n🚀 SEPA Konvertierer gestartet');
  console.log(`   Eingabe:  ${inputDir}`);
  console.log(`   Ausgabe:  ${outputDir}`);
  console.log(`   Fehler:   ${errorDir}`);
  console.log(`   Archiv:   ${archivDir}`);
  console.log(`   Dashboard: ${dashFile}`);
  console.log('\n👀 Überwachung aktiv... (Strg+C zum Beenden)\n');

  saveDashboard();

  const watcher = chokidar.watch(inputDir, {
    ignored:          /(^|[/\\])\../,
    persistent:       true,
    ignoreInitial:    false,
    depth:            0,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 100 },
  });

  watcher.on('add',   filePath => processFile(filePath));
  watcher.on('error', err      => console.error(`Watcher-Fehler: ${err.message}`));

  process.on('SIGINT', () => {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Abschlussbericht');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const ok  = results.filter(r => r.status === 'ok').length;
    const err = results.filter(r => r.status === 'fehler').length;
    const wns = results.filter(r => r.status === 'ok' && r.validation && r.validation.warnings.length > 0).length;
    console.log(`  Gesamt:           ${results.length}`);
    console.log(`  ✓ Erfolgreich:    ${ok}`);
    console.log(`  ✗ Fehlgeschlagen: ${err}`);
    if (wns > 0) console.log(`  ⚠  Mit Warnungen: ${wns}`);
    console.log(`\n  Dashboard: ${dashFile}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    watcher.close();
    process.exit(0);
  });

  return watcher;
}

module.exports = { startWatcher };
