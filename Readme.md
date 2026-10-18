# Based

Ein einfacher, ordnerbasierter Markdown-Editor als Electron-App für macOS. Mit Live-Vorschau, LaTeX und erweiterbaren Plugins aus JavaScript und CSS.

## Pakete

| Ordner | Inhalt |
|---|---|
| `base 0.5.1` | Die Electron-App zum Schreiben, Speichern und Verwenden von Plugins. |
| `plugin-kit 1.0.1` | Dokumentation, Beispiele und Werkzeuge zum Entwickeln eigener Plugins. |

Die Pakete bleiben getrennt. Ihre Dateien müssen nicht zusammenkopiert werden.

## App starten

Im Ordner mit der `package.json` der App:

```bash
cd "base 0.5.1"
npm install
npm start
```

Direkt losschreiben und später speichern. Anhänge werden neben der Markdown-Datei abgelegt und relativ verlinkt. Alle Dateitypen können angehängt werden; eine Vorschau hängt vom Dateityp und den geladenen Plugins ab.

## Plugins verwenden

In der App **„Plugin importieren“** wählen und die `.mjs`-Datei auswählen. Die zugehörige CSS-Datei bleibt daneben.

Fertige Beispiele für 3MF mit Three.js und Charts mit Chart.js liegen in der App unter `beispiel-plugins/`. Importierte Plugins gelten aktuell für die laufende Sitzung.

## Eigene Plugins entwickeln

Im Ordner `plugin-kit 1.0.1` mit **`HANDBUCH.html`** beginnen. Das Kit enthält die Plugin-API, vollständige Beispiele und Build-Werkzeuge.

Plugins können eigene Actions, HTML, gekapseltes CSS, interaktive UI und gebündelte Libraries bereitstellen.

```bash
cd "plugin-kit 1.0.1"
npm ci
npm run build
npm test
```

Das Plugin-Kit ist ein Entwicklungswerkzeug und enthält keinen eigenen Editor. Für die normale App-Nutzung sind seine Tests nicht erforderlich.
