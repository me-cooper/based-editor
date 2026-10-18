# Based Plugin API 0.5 — diese Datei als Kontext an deine KI geben

Ziel: ein Plugin-Ordner mit `mein-plugin.mjs`, optional `mein-plugin.css` und optional `lib/` oder `vendor/`. In Based „Plugin importieren“ wählen und die `.mjs` auswählen. Relative ES-Modul-Imports werden unterstützt. Kein Node.js im Plugin; Browser-APIs verwenden. Lokale Libraries als ESM mitbringen. npm-Pakete mit nicht auflösbaren Bare Imports vorher zu einem Browser-ES-Modul bündeln. CDNs sind nicht freigeschaltet.

## 1. Datei-Vorschau: kleinster funktionierender Einstieg

```js
export default {
  id: 'text-preview',
  title: 'Textdateien',
  files: ['txt', 'log'],
  design: { css: 'pre { white-space:pre-wrap; padding:12px; background:#242e26; }' },
  render(file, {escape}) {
    return `<h3>${escape(file.name)}</h3><pre>Lade …</pre>`;
  },
  async mount(container, {file, signal}) {
    const text = await file.text();
    if (signal.aborted) return;
    container.querySelector('pre').textContent = text;
  }
};
```

Nach dem Import übernimmt dieses Plugin angehängte `.txt`- und `.log`-Dateien. Der vorhandene Button „Dateien anhängen“ bleibt zuständig. Keine Änderung am Dateien-Plugin nötig. Dateiendungen werden ohne Punkt und unabhängig von Groß-/Kleinschreibung verglichen. Bei mehreren passenden Plugins gewinnt das zuletzt hinzugefügte. Ohne passenden Handler erscheint die bisherige Dateikarte bzw. Standard-Medienvorschau.

`render` ist synchron und erzeugt den Anfangszustand als HTML-String. Die App bereinigt dieses HTML und fügt es in einen eigenen offenen Shadow Root ein. Blockelemente wie `section`, `div` und `canvas` bleiben dabei innerhalb dieses Containers. HTML-`script`-Tags und inline Eventhandler werden nicht als Programmierschnittstelle verwendet: JavaScript gehört in `mount`. Dort stehen normale DOM-, Canvas-, WebGL- und Browser-APIs zur Verfügung. CSS ist separat gekapselt; JavaScript ist vertrauenswürdiger Plugin-Code, keine Sandbox.

## 2. API in mount(container, api)

| API | Bedeutung |
| --- | --- |
| `container` | Eigener Shadow Root; `querySelector`, `append`, `innerHTML` und weitere DOM-Methoden |
| `file.name`, `.extension`, `.label` | Dateiinformationen |
| `file.src` | Relativer Pfad aus dem Markdown |
| `file.url` | Aufgelöste lokale URL für Loader, Audio, Video oder fetch |
| `await file.arrayBuffer()` | Binärdaten, z. B. für einen 3D-Loader |
| `await file.text()` | Textinhalt |
| `await file.blob()` | Blob |
| `data` | Bei Fence-Plugins: `{text, argument}`; sonst benutzerdefinierte wrap-Daten bzw. null |
| `signal` | AbortSignal: wird beim Entfernen/Neuladen der Instanz abgebrochen |
| `on(event, callback)` | Instanzbezogen abonnieren; gibt Abmeldefunktion zurück |
| `emit(event, detail)` | Eigenes Event senden; auch im Renderer sichtbar |
| `events.on/emit` | Gemeinsamer Eventbus für andere Plugin-Instanzen; Abmeldung mit onDispose registrieren |
| `onDispose(fn)` | Observer, Timer, WebGL-Ressourcen usw. aufräumen |

`mount` kann alternativ direkt oder asynchron eine Cleanup-Funktion zurückgeben. Nach jedem `await` prüfen, ob `signal.aborted` ist, bevor die Oberfläche verändert wird. `file` ist bei normalen Markdown-Fence-Plugins null.

Unveränderte Instanzen bleiben beim Weiterschreiben und bei Vorschau-Updates erhalten. Änderungen an Datei-URL, HTML, CSS oder mount-Funktion erzeugen eine neue Instanz und räumen die alte auf. Externe Änderungen an Dateibytes werden noch nicht automatisch überwacht; die Notiz bzw. das Plugin zum erneuten Laden neu öffnen/importieren.

## 3. Events

- `file:attached`: global nach einem Import; `{files}` enthält die importierten Einträge.
- `render:mounted`: Container ist eingefügt; async Initialisierung kann noch laufen.
- `file:loaded`: nach erfolgreichem `file.text()`, `arrayBuffer()` oder `blob()`.
- `file:error`: Datei-Hilfsmethode ist fehlgeschlagen.
- `plugin:ready`: mount einschließlich async Initialisierung ist abgeschlossen.
- `plugin:error`: Initialisierung oder Cleanup ist fehlgeschlagen.
- `render:disposed`: Instanz wurde entfernt; Signal abgebrochen.

Ereignisse aus Instanzen enthalten ihre `plugin`-ID. Datei-Ereignisse enthalten `file`. `file:loaded` bezieht sich auf die Datei-Hilfsmethoden; Bibliotheken, die `file.url` selbst laden, senden dieses Event nicht automatisch. Dafür nach ihrer Initialisierung `emit('viewer:ready', {...})` verwenden.

Im Host:

```js
const unsubscribe = renderer.on('file:loaded', event => console.log(event));
renderer.emit('my:event', {value: 1});
unsubscribe();
```

## 4. Eigene Bibliotheken und 3D

```js
import {parseSTL} from './lib/stl.mjs';
```

Oder dynamisch in mount: `const module = await import('./vendor/viewer.mjs')`. Relative Imports beziehen sich auf den Plugin-Ordner. `new URL('./asset.bin', import.meta.url)` liefert eine URL für mitgelieferte Ressourcen. Bei dynamischem Import anschließend `signal.aborted` prüfen. Lokale WASM-Dateien können geladen werden; die jeweilige Library muss browserkompatibel sein. Mitgelieferte Dateien bleiben auf den ausgewählten Plugin-Ordner begrenzt.

Das Projekt enthält `plugin-examples/stl/stl.mjs`, `stl.css` und `lib/stl.mjs`. `stl.mjs` importieren, eine `.stl` anhängen und das Modell per Ziehen drehen. Das Beispiel liest ASCII- und binäre STL-Dateien und zeichnet ein drehbares Dreiecksmodell auf Canvas. Es ist ein einfacher, untexturierter Viewer, kein CAD-Renderer; bei großen Modellen werden maximal ungefähr 20.000 Dreiecke angezeigt. Die Parser- und Runtime-Tests laufen ohne grafische Oberfläche; die tatsächliche Canvas-/Mac-Darstellung ist noch zu prüfen.

Für `.3mf`, `.glb`, `.obj` usw. einen passenden Loader ergänzen. Die Runtime bietet den Container, Dateizugriff und Lifecycle, keinen universellen Decoder. Three.js und dessen Loader können als lokales Browser-Bundle mitgeliefert werden; verwendete Lizenzen und Versionsabhängigkeiten beim Erstellen des Plugin-Pakets beibehalten.

## 5. Inhalte ohne Dateianhang

```js
export default {
  id: 'counter',
  design: { css: 'button { padding:8px; }' },
  actions: [{ id:'add', label:'Zähler einfügen', insert:'\n```counter\n```\n' }],
  content: {
    fence: 'counter',
    render: () => '<button>0</button>'
  },
  mount(container, {signal}) {
    let count = 0;
    container.querySelector('button').addEventListener('click', event => {
      event.currentTarget.textContent = String(++count);
    }, {signal});
  }
};
```

Die bisherigen `content(text, context)`, `run`, `design`, `actions` und Renderer-Methoden bleiben erhalten. Eigene Markdown-Regeln kapseln ihre Ausgabe mit `context.wrap(html, {block:true, data:{...}})`; mount erhält diese Daten unter `api.data`.

## Prompt für deine KI

„Erstelle mir ein Based-Plugin gemäß dieser API. Gib eine vollständige .mjs und passende .css aus. Verwende render für HTML und mount für JavaScript, kapsle CSS, nutze signal und onDispose zum Aufräumen. Nutze file.arrayBuffer/text/blob zum Lesen. Wenn eine Library nötig ist, liefere ein lokales Browser-ESM-Bundle oder genaue Build-Schritte. Keine erfundenen Loader-APIs, keine Node-Imports im Plugin. Erhalte bestehende Standard-Dateikarten für nicht unterstützte Endungen.“
