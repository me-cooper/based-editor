# Based Electron-App 0.5.1

Dieses Paket ist die vollständige App. Kein Plugin-Kit hinein kopieren.

Im Ordner mit dieser Datei und package.json:

```sh
npm install
npm start
```

Dateien anhängen: Den festen Button oben benutzen. Bei einer neuen Notiz zuerst den Speicherort der Markdown-Datei bestätigen. Danach öffnet sich die Auswahl für alle Dateien, auch 3MF, STL, OBJ und G-Code. Dateien werden neben die Notiz kopiert und relativ verlinkt. Alternativ Dateien ins App-Fenster ziehen. „Ordner öffnen“ wählt dagegen den Notizordner.

Vorschau: Über „Plugin importieren“ einmal beispiel-plugins/three-mf/three-mf.mjs auswählen; CSS daneben lassen. Danach eine 3MF-Datei anhängen. Der Import gilt für die aktuelle Sitzung. Chart-Beispiel ebenso unter beispiel-plugins/chart. G-Code, STL und OBJ erhalten ohne passendes Vorschau-Plugin eine Dateikarte; sie werden trotzdem angehängt.

Der vorherige Quellcode hatte bereits keine Endungssperre. Diese Version macht den allgemeinen Anhang-Zugang sichtbar und unabhängig von Plugin-Aktionen, bietet einen expliziten Alle-Dateien-Dialog und Drag-and-drop im ganzen Fenster. Die konkrete Ursache des gemeldeten Mac-Fehlers ist ohne Fehlermeldung noch offen. Ein nativer Mac-Grafiktest wurde hier nicht durchgeführt.
