# ALs Energiebilanz Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)
[![GitHub Release](https://img.shields.io/github/v/release/al1505/ALs-Homeassitant-Energiebilanz-Card?label=Version)](https://github.com/al1505/ALs-Homeassitant-Energiebilanz-Card/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-0070ba?logo=paypal&style=flat-square)](https://paypal.me/al1505)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=al1505&repository=ALs-Homeassitant-Energiebilanz-Card&category=plugin)

[🇩🇪 Deutsch](#deutsch) | [🇬🇧 English](#english)

## Deutsch

Eine hochperformante, interaktive Custom Card zur Visualisierung von Energieflüssen in Home Assistant. Perfekt für Photovoltaik, Batteriespeicher, Netzbezug und Hausverbrauch.

---

## ☕ Support

Wenn dir diese Card gefällt und du die Weiterentwicklung unterstützen möchtest:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-PayPal-0070ba?logo=paypal&style=for-the-badge)](https://paypal.me/al1505)

Direkt-Link: **[paypal.me/al1505](https://paypal.me/al1505)** ❤️

---

## ✨ Features

* 📱 **Mobile First UX:** Spezielles Touch-Design. Details öffnen sich auf dem Smartphone in einem nativen Bottom-Sheet am unteren Bildschirmrand.
* 👆 **Wischgesten (Swipe):** Wechsle Tage, Monate oder Jahre durch einfaches Wischen nach links oder rechts.
* 🖱️ **Desktop Optimiert:** Direkter Drill-Down per Mausklick in tiefere Zeiträume und smarte Hover-Tooltips.
* 🎨 **Dark Mode:** Automatische Theme-Erkennung. Farben für Light- und Dark-Mode können separat konfiguriert werden.
* 📊 **Detailansicht:** Visualisiert Autarkie, Batterie-SoC, Temperaturen und detaillierte Verbraucher (z.B. Wärmepumpe) in übersichtlichen Listen und Kuchendiagrammen.
* ⚙️ **Visueller Editor:** Vollständige Unterstützung für den UI-Editor in Home Assistant. Kein YAML-Schreiben nötig.
* ⚡ **Enterprise Performance:** Kapselung durch Shadow DOM, Schutz vor Race-Conditions und sauberes Memory Management.

## 📦 Installation

### Methode 1: HACS (Empfohlen)

Klicke einfach auf den blauen Button ganz oben. 
Alternativ:
1. Öffne HACS in Home Assistant.
2. Klicke oben rechts auf das Drei-Punkte-Menü und wähle **Benutzerdefinierte Repositories**.
3. Füge die URL dieses Repositories ein und wähle die Kategorie **Lovelace** (oder Dashboard).
4. Klicke auf Herunterladen.
5. Lade die Seite deines Browsers neu.

### Methode 2: Manuell

1. Lade die Datei `HA-Energiebilanz-Card.js` herunter.
2. Erstelle in Home Assistant den Ordnerpfad `/config/www/community/ALs-Homeassitant-Energiebilanz-Card/` (falls noch nicht vorhanden).
3. Lege die JS-Datei genau dort ab.
4. Gehe in Home Assistant zu Einstellungen -> Dashboards -> Drei-Punkte-Menü oben rechts -> Ressourcen.
5. Füge eine neue Ressource hinzu: 
   * URL: `/local/community/ALs-Homeassitant-Energiebilanz-Card/HA-Energiebilanz-Card.js`
   * Typ: `JavaScript-Modul`

## 🛠️ Konfiguration

Gehe in dein Dashboard, klicke auf "Karte hinzufügen" und suche nach "Energiebilanz". Alle Sensoren, Farben und Beschriftungen kannst du direkt in der grafischen Oberfläche einstellen.

*Hinweis: Die Karte nutzt den internen Recorder von Home Assistant. Deine Sensoren müssen historische Daten aufzeichnen (z.B. `state_class: total_increasing`).*

## 📸 Screenshots

**📊 Karte** — Tag · Monat · Jahr · Gesamt · Hover-Tooltips · Legende

![Card Demo](screenshots/card-demo.gif)

**⚙️ Editor** — Design · Texte · Sensoren · Sub-Einträge

![Editor Demo](screenshots/editor-demo.gif)

---

## 🙏 Danke

Wenn dir die Card im Alltag hilft → freue ich mich über einen kleinen Kaffee:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-PayPal-0070ba?logo=paypal&style=for-the-badge)](https://paypal.me/al1505)

**[paypal.me/al1505](https://paypal.me/al1505)** ☕

---

*Entwickelt mit ❤️ von [al1505](https://github.com/al1505)*

## English

A high-performance, interactive Custom Card for visualizing energy flows in Home Assistant. Perfect for photovoltaics, battery storage, grid consumption, and household consumption.

---

## ☕ Support

If you like this card and want to support further development:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-PayPal-0070ba?logo=paypal&style=for-the-badge)](https://paypal.me/al1505)

Direct link: **[paypal.me/al1505](https://paypal.me/al1505)** ❤️

---

## ✨ Features

* 📱 **Mobile First UX:** Dedicated touch design. On smartphones, details open in a native bottom sheet at the bottom of the screen.
* 👆 **Swipe Gestures:** Switch between days, months, or years with a simple swipe left or right.
* 🖱️ **Desktop Optimized:** Direct drill-down into deeper time ranges via mouse click, plus smart hover tooltips.
* 🎨 **Dark Mode:** Automatic theme detection. Colors for light and dark mode can be configured separately.
* 📊 **Detail View:** Visualizes self-sufficiency, battery state of charge, temperatures, and detailed consumers (e.g. heat pump) in clear lists and pie charts.
* ⚙️ **Visual Editor:** Full support for the Home Assistant UI editor. No YAML editing required.
* ⚡ **Enterprise Performance:** Encapsulation via Shadow DOM, protection against race conditions, and clean memory management.

## 📦 Installation

### Method 1: HACS (Recommended)

Simply click the blue button at the top. 
Alternatively:
1. Open HACS in Home Assistant.
2. Click the three-dot menu in the top right and select **Custom repositories**.
3. Paste the URL of this repository and select the category **Lovelace** (or Dashboard).
4. Click Download.
5. Reload your browser page.

### Method 2: Manual

1. Download the file `HA-Energiebilanz-Card.js`.
2. In Home Assistant, create the folder path `/config/www/community/ALs-Homeassitant-Energiebilanz-Card/` (if it doesn't already exist).
3. Place the JS file exactly there.
4. In Home Assistant, go to Settings -> Dashboards -> three-dot menu in the top right -> Resources.
5. Add a new resource: 
   * URL: `/local/community/ALs-Homeassitant-Energiebilanz-Card/HA-Energiebilanz-Card.js`
   * Type: `JavaScript Module`

## 🛠️ Configuration

Go to your dashboard, click "Add Card" and search for "Energiebilanz". You can configure all sensors, colors, and labels directly in the graphical interface.

*Note: The card uses Home Assistant's built-in Recorder. Your sensors must record historical data (e.g. `state_class: total_increasing`).*

## 📸 Screenshots

**📊 Card** — Day · Month · Year · Total · Hover tooltips · Legend

![Card Demo](screenshots/card-demo.gif)

**⚙️ Editor** — Design · Texts · Sensors · Sub-entries

![Editor Demo](screenshots/editor-demo.gif)

---

## 🙏 Thanks

If this card helps you in everyday life → I'd appreciate a small coffee:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-PayPal-0070ba?logo=paypal&style=for-the-badge)](https://paypal.me/al1505)

**[paypal.me/al1505](https://paypal.me/al1505)** ☕

---

*Developed with ❤️ by [al1505](https://github.com/al1505)*
