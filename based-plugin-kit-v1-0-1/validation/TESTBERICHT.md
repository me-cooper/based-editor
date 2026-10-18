# Prüfbericht — Based Plugin-Kit 1.0.1

Stand: 17. Oktober 2026. Bibliotheken: Three.js 0.186.1, Chart.js 4.5.1. Node.js 24.19.0. Exakte weitere Versionen im Lockfile.

## Tatsächlich bestanden

`npm run build`: beide vollständigen Browser-ESM-Bundles erzeugt, ohne CDN-Abhängigkeit.

`node --test tests/unit.test.mjs tests/render.test.mjs`: **12 Tests bestanden**, kein Fehler. Vollständiges TAP-Protokoll: `node-tests.tap`.

- Chart-JSON-Schema mit gültigen und ungültigen Daten.
- Drei unterschiedliche Actions in einem Chart-Plugin.
- Dateirouting und HTML-Escaping des 3MF-Plugins.
- Gemeinsame Three.js-Ressourcen werden jeweils einmal entsorgt.
- Auch ungültiger initialer Chart-Inhalt erzeugt einen editierbaren Container.
- Echte ZIP-3MF-Datei mit dem echten ThreeMFLoader geparst; Meshes und Geometrie vorhanden.
- Ungültige 3MF-Datei vom echten Loader zurückgewiesen.
- Chart.js zeichnet auf einer nativen Canvas; nichtleere Pixel geprüft und PNG gespeichert. Mit einem DOM-Modell wurden Typauswahl, Datenanwendung, Titeländerung und Fehlernachricht ausgelöst.
- Die im Textur-Fixture eingebettete PNG-Datei tatsächlich dekodiert, 2×2 Pixel bestätigt.
- Minimaler Host-Patch inklusive Sicherung und wiederholter Ausführung geprüft.

`chart-node.png` ist das tatsächlich erzeugte Chart.js-Rendering. Es ist kein Screenshot der Electron-Oberfläche und kein generiertes Illustrationsbild.

## Nicht als bestanden gewertet

Der Chromium-/WebGL-Browsertest ließ sich in der abgeschotteten Ausführungsumgebung nicht starten. Die sichtbare Dateisystemumgebung enthält kein /proc; Chromium beendet den Start mit SIGTRAP. Der genaue native Startfehler wurde nicht weiter aufgelöst. Deshalb gibt es **keinen bestandenen Browser-/WebGL-/Mac-Test** und keinen Nachweis der vollständigen 3MF-Texturdarstellung auf dem Bildschirm.

`tests/browser.mjs` liegt ausführbar bei. Er prüft bei erfolgreichem Start echte 3D-Pixel, UI, Chart-Typen, Dateneditor, Wiederverwendung, Cleanup, Textur-Fixture und Fehlerwege. Auf einem üblichen Mac oder Linux-Rechner:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

Der Browser-Harness verwendet den produktiven Based-Renderer/Preview als gebündelten Snapshot mit Medienrouting und DOMPurify. Er ersetzt native Dateidialoge und lokale Electron-Protokolle durch einen lokalen HTTP-Testserver. Selbst ein erfolgreicher Harness-Lauf wäre daher noch kein vollständiger Test des nativen Electron-Installers.

## Praktische Grenzen

ThreeMFLoader deckt nicht jede herstellerspezifische 3MF-/Slicer-Erweiterung ab. Große Modelle werden synchron geparst. Chart-UI-Änderungen werden nicht automatisch in Markdown gespeichert; dafür „Markdown kopieren“ verwenden. Das Paket legt diese Grenzen offen und enthält keine fiktiven Loader- oder Host-APIs.


## Korrekturen 1.0.1

Der normale Einstieg ist wieder deutlich als Electron-Start ausgewiesen. `npm start` im Kit delegiert an die benachbarte Electron-App; ein zusätzlicher Test prüft diese Übergabe an ein als Electron-Projekt erkanntes Testpaket. Dabei wurde kein echtes Electron-Fenster gestartet.

Ein weiterer Regressionstest nutzt echtes DOMPurify und ein Browser-DOM-Modell, um Dateimetadaten, Chart-Daten, Container und Lifecycle-Übergabe zusammen zu prüfen. Diese Sanitizer-Prüfung ist bestanden; sie ersetzt keinen GPU-Test.

Der vom Nutzer gemeldete Mac-Browsertest hat Chromium gestartet, aber die Bereitschaft beider Beispiel-Plugins nicht erreicht. Der ursprüngliche Log zeigt nur den Timeout und erlaubt keine genaue Ursache. Die neue Testfassung erzwingt auf macOS keinen Software-Grafikmodus mehr. Sie erfasst Plugin-Fehler, Konsolenmeldungen, fehlgeschlagene Requests, Zustand und einen Screenshot unter browser-failure.json/.png. Ein erfolgreicher grafischer Lauf wird weiterhin nicht behauptet.
