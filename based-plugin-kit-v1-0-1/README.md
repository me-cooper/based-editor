# Based Plugin-Handbuch und Beispiele

**Zuerst `HANDBUCH.html` öffnen** — offline lesbar mit Navigation. `HANDBUCH.md` enthält denselben Inhalt einschließlich vollständiger Quellen. `based-plugin-api.d.ts` bietet die Typreferenz.

## Die App bleibt Electron

Zum normalen Arbeiten **nicht** `npm run test:browser` ausführen. Das ist ausschließlich ein optionaler Entwicklertest. Der Editor wird im Electron-Projekt mit `npm start` gestartet.

Wenn dieses Plugin-Kit im App-Ordner oder neben einem Ordner `based` liegt, funktioniert jetzt auch hier `npm start`: Der Starter sucht die bestehende Electron-App und startet sie. Er startet keinen Webserver und keinen externen Browser. Bei anderem Speicherort: `npm start -- /absoluter/Pfad/zur/Electron-App`.

HTML, CSS, Canvas und Browser-Libraries laufen innerhalb des Electron-Fensters als Plugin-Bausteine. Das Plugin-Kit enthält selbst keinen zweiten Editor und ersetzt die App nicht.

## Fertige Plugins

1. In Based (Plugin Runtime 0.5) „Plugin importieren“ wählen.
2. `plugins/three-mf/three-mf.mjs` und/oder `plugins/chart/chart.mjs` auswählen.
3. CSS-Dateien jeweils daneben lassen.
4. Zum Testen `fixtures/demo.md` öffnen; die Fixtures gemeinsam mitnehmen.

3MF: Three.js, Drehen/Zoomen, Drahtgitter, automatische Rotation und Rücksetzen.
Charts: Chart.js, drei Actions, Typauswahl, Dateneditor, JSON-Validierung und Markdown-Kopie.

Bei 3MF-Texturen den kleinen Host-Patch in `host-update/` anwenden. Das Handbuch erklärt Voraussetzungen und die Sicherung. Kein vollständiger neuer App-Quellbaum liegt bei.

## Ändern und bauen

Node.js 22+: `npm ci`, dann `npm run build`. Änderungen an `src/` werden zu importierbaren Browser-Modulen in `plugins/` gebündelt. `npm test` prüft Beispiele und Rendering unter Node; `npm run test:browser` ist ein zusätzlicher grafischer Test nach `npx playwright install chromium`.

**Prüfstatus:** `validation/TESTBERICHT.md`. Grafische WebGL-/Mac-Interaktion wurde in dieser Umgebung nicht erfolgreich ausgeführt. Es wird kein bestandener Browsertest behauptet.
