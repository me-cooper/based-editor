# based. — 0.5

Ein kleiner, ordnerbasierter Markdown-Editor für Electron / macOS. Direkt losschreiben, später als normale `.md`-Datei speichern. Kein Account, keine Datenbank, keine KI zum Rendern.

## Start

Node.js 22 oder neuer, dann im entpackten Projektordner:

```sh
npm install
npm start
```

`npm run build:mac` baut auf dem Mac eine lokale DMG. Kein signierter oder notarisierter Installer. Die native Mac-Oberfläche und DMG wurden hier noch nicht getestet.

## Schreiben und Speichern

- Die App startet mit einem leeren, fokussierten Entwurf.
- „＋ Neu“ / ⌘N: neuer Entwurf, ohne vorherige Namens- oder Ordnerwahl.
- ⌘S: beim ersten Speichern Name und Ort im nativen Dialog wählen. Der Name wird aus der ersten Textzeile vorgeschlagen.
- „Speichern unter …“ / ⇧⌘S: unter einem anderen Namen speichern.
- Abbrechen lässt den Text stehen. Wechseln und Schließen mit Änderungen fragt nach Speichern / Verwerfen / Abbrechen.
- Ordneransicht mit `.md`-Dateien und Unterordnern; Löschen nutzt den Papierkorb.

Noch keine automatische Entwurfswiederherstellung nach einem Absturz, externe Konflikterkennung, Ordnerumbenennung oder dauerhafte Installation importierter Plugins. Speichern erfolgt manuell. Versteckte Dateien und symbolische Links werden ausgelassen.

## Ordner und Markdown-Toolbar

Im ausgewählten Stammordner kannst du über **＋ Ordner** Unterordner anlegen. Ein Name wie `Projekte/2026/Notizen` legt die gesamte verschachtelte Struktur an. Klick auf einen Ordnernamen wählt ihn als Ziel für den nächsten Entwurf; **⌂** wählt den Stammordner. Der Zielpfad wird in der Seitenleiste angezeigt. „Neu“ bleibt ein sofort beschreibbarer Entwurf; beim ersten Speichern schlägt der native Dialog den ausgewählten Ordner vor.

Die Toolbar über dem Editor bietet H1/H2/H3, Fett, Kursiv, Durchgestrichen, Aufzählungen, nummerierte Listen, Aufgaben, Zitate, Inline-Code, Codeblöcke, Links, Tabellen und Trennlinien. Markierter Text wird umschlossen bzw. zeilenweise formatiert. Ohne Auswahl wird ein Platzhalter eingefügt. ⌘B und ⌘I formatieren die Auswahl im Editor. Aufgaben werden als deaktivierte Checkboxen angezeigt; ihren Status änderst du im Markdown (`[ ]` / `[x]`). Plugin-Buttons bleiben zusätzlich in der Seitenleiste.

## Medien relativ zur Notiz

**Dateien anhängen** ist der gemeinsame Button im Dateien-Plugin. Bilder, Video und Audio werden jeweils mit dem passenden Element dargestellt; andere Dateien erscheinen als anklickbare Dateikarte. Ein Klick auf eine Dateikarte zeigt die lokale Datei im Finder. Es wird dabei kein Dateicode ausgeführt. Ausgewählte Dateien werden direkt in den Ordner der gespeicherten Markdown-Datei kopiert. Beispiel: `Projekte/notiz.md` mit `Projekte/foto.png`, verlinkt als `![foto](./foto.png)`. Die Originaldatei bleibt erhalten. Bei gleichem Dateinamen entstehen Namen wie `foto-2.png`; bestehende Dateien werden nicht überschrieben. Liegt die gewählte Datei bereits neben der Notiz, wird sie direkt verlinkt.

Bei einem Entwurf wird zuerst der Speicherdialog geöffnet. Brichst du ab, bleibt der Text erhalten und es wird kein Medium importiert. Nach dem Import sind die Links noch ungespeicherte Textänderungen: ⌘S speichert sie in der Notiz.

Bilder lassen sich außerdem in den Editor ziehen oder als Bild aus der Zwischenablage einfügen. Zwischenablage-Bilder werden als lokale PNG-Dateien gespeichert. Drag-and-drop unterstützt auch Video und Audio.

````markdown
![Ein Bild](./foto.png)
![Ein Video](./clip.mp4)
![Audio](./aufnahme.mp3)
![Bild im benachbarten Ordner](../Bilder/foto.png)
````

Die Vorschau löst relative Medienpfade gegen den Speicherort der Markdown-Datei auf. Sie verwendet dafür keine absoluten Pfade im gespeicherten Text. `../` funktioniert innerhalb des geöffneten Stammordners. Dateien außerhalb dieses Ordners werden nicht über die Vorschau bereitgestellt. Verschiebst du den gesamten Ordner einschließlich seiner Notizen und Medien und öffnest ihn erneut, bleiben diese relativen Verknüpfungen erhalten.

„Speichern unter“ in einem anderen Ordner übernimmt referenzierte Medien, die direkt neben der bisherigen Notiz liegen. Am Ziel bereits identische Dateien werden wiederverwendet; andere gleichnamige Inhalte führen zu einer Fehlermeldung. Referenzen auf Medien in anderen Unterordnern werden nicht automatisch umgebaut oder kopiert; dafür die zugehörige Ordnerstruktur mitnehmen. Importierte Medien bleiben als normale Dateien liegen, auch wenn du später den Markdown-Link entfernst oder die Notiz verwirfst.

Inline-Vorschau für folgende Dateiendungen: PNG, JPG/JPEG, GIF, WebP, SVG, AVIF, BMP, ICO; MP4, WebM, MOV, M4V; MP3, WAV, OGG, M4A und FLAC. Alle anderen Formate (z. B. PDF, ZIP oder Dateien ohne Endung) erscheinen als Dateikarte. Ob ein konkretes Audio-/Videoformat abspielbar ist, hängt zusätzlich vom Codec und Electron ab. Die lokalen Videoantworten unterstützen Teilabrufe zum Spulen. Remote-Medien werden in dieser lokalen Erstversion nicht geladen.

Design der Medien: `plugins/media.css`, auch über **Design bearbeiten → Dateien** zugänglich. Logik und Aktionen: `plugins/media.mjs`. Der Dateizugriff bleibt im Electron-Host; eigene Plugins brauchen dafür keinen Node-Zugriff.

## Plugins: Inhalt, Design, Aktionen

Ein Plugin besteht aus `mein-plugin.mjs` und optional `mein-plugin.css` daneben. „Plugin importieren“ lädt beide Dateien. Relative JavaScript-Imports werden jetzt aus dem gewählten Plugin-Ordner geladen. Mitgelieferte lokale ES-Module und Ressourcen sind erlaubt; npm-Bare-Imports vorher zu einem Browser-Bundle bündeln. Nur vertrauenswürdigen JavaScript-Code laden. Plugin-Code ist ausführbar; CSS-Kapselung ist keine Sicherheits-Sandbox für JavaScript.

`plugins/example.mjs` und `plugins/example.css` sind eine direkt importierbare Vorlage. Sie brauchen keine Abhängigkeiten:

```js
export default {
  id: 'note',
  title: 'Notiz',
  design: {file: 'example.css'},
  actions: [{
    id: 'insert',
    label: 'Notiz einfügen',
    insert: '\n\n```note\nDeine Notiz\n```\n'
  }],
  content: {
    fence: 'note',
    render(text, argument, {escape}) {
      return `<div class="note"><strong>${escape(argument || 'Notiz')}</strong><p>${escape(text)}</p></div>`;
    }
  }
};
```

```css
/* example.css — nur innerhalb dieser Notiz */
.note { border-left: 3px solid #bad7a8; padding: 12px; }
strong { font-size: 1em; color: #bad7a8; }
```

`content.fence` registriert automatisch einen Markdown-Codeblock. `render(text, argument, context)` bekommt den Blockinhalt und den Text hinter dem Blocknamen. Der Host kapselt die Ausgabe automatisch. Für normale Text-Platzhalter oder eigene Markdown-Regeln kann `content` stattdessen eine Funktion `content(text, context)` sein. Alte Plugins mit `run(text, context)` bleiben kompatibel.

`design.css` erlaubt alternativ CSS direkt als String im Plugin. Beim Import wird eine gleichnamige CSS-Datei neben dem ausgewählten JS-Modul automatisch geladen und hat Vorrang vor dessen inline CSS. In der eingebauten Pipeline löst die App `design.file` aus dem `plugins`-Ordner auf. Für externe Dateien gilt die Namenskonvention: `mein-plugin.mjs` + `mein-plugin.css`.

`actions` erzeugt die Buttons ohne Änderungen an der App. Jede Textaktion hat `id`, `label` und `insert`. `insert` ist ein String oder eine Funktion mit `{selection, text, now}` und gibt einzufügenden Markdown-Text zurück. Markierter Text wird ersetzt. Für Medien kann eine Aktion alternativ `command: 'import-media'` mit `kind: 'file'` für alle Dateien; die bisherigen Filter `'image'`, `'video'`, `'audio'` und `'all'` bleiben verfügbar definieren. Der Host führt dabei die native Dateiauswahl und das Kopieren aus. Alle aktiven Plugins dürfen mehrere Aktionen bereitstellen. IDs innerhalb eines Plugins müssen eindeutig sein. Ein erneuter Import derselben Plugin-ID ersetzt das Plugin; Renderfehler beim Import rollen den Austausch zurück. Importierte Plugins gelten für diese Sitzung.

## CSS-Kapselung und Design-Editor

Die App, der Markdown-Inhalt und jede einzelne Plugin-Ausgabe sind getrennte CSS-Bereiche. Die Vorschau nutzt Shadow DOM; LaTeX-Formeln und Kalender erhalten jeweils eigene Shadow Roots. So trifft beispielsweise `strong { ... }` im Kalender keine Überschrift, andere Plugins oder das App-Logo. Shadow Roots sind offen und lassen sich im Browser-Debugger inspizieren.

Unter **Design bearbeiten** den Bereich auswählen, CSS ändern und **Anwenden** klicken. Die Einstellung bleibt auf diesem Rechner gespeichert. **Standard** entfernt die persönliche Anpassung. **CSS speichern …** exportiert den aktuellen CSS-Text; die Markdown-Datei bleibt dabei unverändert. Lokale Anpassungen haben Vorrang vor den Plugin-Dateien, bis du sie mit Standard zurücksetzt.

Die Dateien:

- `app/document.css`: Absätze, Fett, Überschriften, Listen und Code.
- `plugins/latex.css`: Formelfarbe, Größe, Hintergrund und Abstände.
- `plugins/calendar.css`: Kalenderfarben, Tageszellen und Jahresraster.

Beispiel für LaTeX im Design-Editor:

```css
:host {
  --formula-color: #c5b5ff;
  --formula-size: 1.25em;
  --formula-background: #24212e;
}
.katex-display { text-align: left; border-radius: 8px; }
```

Oder mit beliebigen eigenen Regeln wie `.katex { color: gold; }`. Die KaTeX-Grundregeln bleiben in der Formel-Kapsel erhalten. Schriftdateien werden lokal eingebunden. App-Branding ist auf `.brand` begrenzt; normaler Fettdruck übernimmt die Textgröße.

## Kalender

Der Kalender bringt seinen Button **Kalender hinzufügen** selbst mit. Leere Blöcke funktionieren:

````markdown
```calendar 2026-10
```

```calendar 2026
```

```calendar 2026-10-10-05
```
````

| Angabe | Ansicht |
| --- | --- |
| `calendar` | Aktueller Monat |
| `calendar 2026` | Ganzes Jahr, zwölf Monate |
| `calendar 2026-10` | Oktober 2026 |
| `calendar 2026-10-10` | 10. Oktober 2026 |
| `calendar 2026-10-05-10` | 5. bis 10. Oktober 2026 |
| `calendar 2026-10-10-05` | Ebenfalls 5. bis 10. Oktober; Tage werden sortiert |

Der vierte Zahlenteil wird als zweiter Tag desselben Monats interpretiert, nicht als Uhrzeit. Montag ist Wochenanfang. Termine bleiben einfacher Text:

````markdown
```calendar 2026-10
2026-10-17 | 14:00 Projektbesprechung
2026-10-21 | Geburtstag
2026-10-21 | 18:30 Essen
```
````

Mehrere Termine pro Tag sind möglich. Ungültige Termine und Termine außerhalb der Ansicht werden als Hinweis ausgegeben. HTML wird maskiert. Keine Kalenderkonten, Erinnerungen oder Synchronisation.

## LaTeX

Der Button **Formel einfügen** kommt aus `plugins/latex.mjs` und umschließt die Textauswahl mit `$$`. Ohne Auswahl wird eine Beispielformel eingefügt. Inline: `$...$`, `\(...\)`. Block am Zeilenanfang: `$$...$$`, `\[...\]`. Codeblöcke bleiben unverändert. KaTeX verarbeitet mathematisches LaTeX, keine vollständigen LaTeX-Dokumente. Fehlerhafte Formeln bleiben sichtbar. Dollarzeichen in Preisen mit `\$` maskieren.

## Öffentliche Renderer-API

```js
import {createRenderer} from './src/index.mjs';
const renderer = createRenderer();
const html = renderer.in('# Hallo\n\n$E=mc^2$');
renderer.pipein('## Gepufferter Text');
renderer.in();                       // Pipeline ausführen
console.log(renderer.pipeout());     // Letzte fertige HTML-Ausgabe

renderer.add({id:'replace', content:text=>text.replaceAll(':wave:', '👋')}, 0);
renderer.edit('replace', {enabled:false});
renderer.delete('replace');
renderer.push({id:'after', run:html=>html});
console.log(renderer.actions);        // Aktive Einfüge-Aktionen
```

`in` arbeitet synchron. Jeder Schritt gibt einen String zurück. Bei Fehlern wird die Ausgabe geleert. IDs sind eindeutig; `edit` erhält die ID. Änderungen geben den Renderer für Verkettung zurück. `pipeline` gibt Kopien der Metadaten zurück.

Der Kontext enthält `markdown` (frische markdown-it-Instanz pro Durchlauf), `meta` (gemeinsame Daten), `escape(text)`, `wrap(html, {block:false})` und `services`. `createRenderer()` stellt unter `services.katex` KaTeX für das LaTeX-Plugin bereit. Eine Funktions-Implementierung mit eigenen Markdown-Regeln sollte ihre HTML-Ausgabe mit `wrap` umschließen, um dieselbe Plugin-Kapselung wie deklarative Fence-Plugins zu erhalten. Für reine Texttransformationen ist das nicht erforderlich.

Der Kern benötigt kein Electron und liefert HTML mit Plugin-Markierungen. Die DOM-Kapselung erfolgt durch `mountPreview` aus `src/preview.mjs`, nicht durch einen HTML-String allein. Andere Hosts müssen diesen Adapter oder eine gleichwertige Kapselung verwenden, ihre Design-Dateien auflösen und die HTML-Ausgabe vor dem Einfügen bereinigen. Die App nutzt dafür DOMPurify. `design.stylesheets` sind optionale zusätzliche Stylesheets innerhalb einer Plugin-Kapsel; URLs beziehen sich auf die Hostseite. Das eingebaute LaTeX-Plugin verwendet `app/vendor/katex.css`, das beim Build erzeugt wird.

## Validierung

`npm test`: 55 Tests für Renderer, Formeln, Kalender, Ordnererstellung, Dateispeicherung, Medienkopien und Namenskonflikte, relative Medienpfade, Video-Teilabrufe, Entwurf-Abläufe, Toolbar, Plugin-Aktionen, CSS-Begleitdateien und DOM-Kapselung. Dateitests verwenden echte temporäre Dateien mit nachgebildeten Electron-Dialogen; Vorschautests prüfen die getrennten Shadow Roots mit linkedom. `npm run build` bündelt die App und ihre lokalen Schriftressourcen.

Native Mac-Dialoge, tatsächliche Bildschirmdarstellung und DMG sind hier nicht auf macOS geprüft. Ein Browser-Testlauf war wegen eines fehlgeschlagenen Chromium-Downloads nicht möglich.

Technische Referenzen: [Electron-Dialoge](https://www.electronjs.org/docs/latest/api/dialog), [lokale Protokolle](https://www.electronjs.org/docs/latest/api/protocol), [Datei-Drops](https://www.electronjs.org/docs/latest/api/web-utils), [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), [markdown-it Renderer-Regeln](https://github.com/markdown-it/markdown-it/blob/master/docs/examples/renderer_rules.md).

## Dateianhänge 0.4.2

Der Dateidialog hat keinen Formatfilter mehr, auch bei älteren Plugin-Aktionen. Alle regulären Dateien werden akzeptiert, einschließlich `.3mf`, `.blend`, `.stl`, `.zip` und Dateien ohne Endung. Nur bekannte Medienformate bekommen eine Inline-Vorschau. Alle übrigen Dateien erhalten eine Dateikarte mit sichtbarer Aktion „Im Finder anzeigen“. Die Dateiendung bestimmt nur die Darstellung, niemals die Importerlaubnis. Für diese Änderung auch den Electron-Host aktualisieren, nicht nur die Plugin-Datei.


## Runtime API 0.5

Die vollständige Anleitung für eigene Plugins und die Arbeit mit einer KI steht in **PLUGIN_GUIDE.md**. Neu sind Dateiendungs-Handler mit `files` + `render`, `mount(container, api)`, asynchrone Datei-Hilfsmethoden, Events, AbortSignal und Cleanup. Unveränderte Instanzen werden zwischen Vorschau-Updates wiederverwendet. HTML-Struktur bleibt bereinigt; JavaScript läuft gezielt in mount. Der native Import akzeptiert jetzt lokale Modul-Ordner mit relativen Abhängigkeiten.

Zum Ausprobieren **plugin-examples/stl/stl.mjs** importieren und eine STL-Datei anhängen. Der Ordner muss mit seiner CSS- und lib-Datei zusammenbleiben. Der Beispiel-Viewer ist ein drehbares, untexturiertes Canvas-Modell; 3MF ist weiterhin eine Dateikarte, bis ein entsprechender Loader als Plugin ergänzt wird. 55 Tests und Build geprüft. Tatsächliche Browser-, Canvas-/WebGL- und Mac-Darstellung noch nicht geprüft.
