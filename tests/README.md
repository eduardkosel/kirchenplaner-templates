# Tests wiederholen

Die Tests benötigen lokale WordPress-Testinstallationen mit eigenen Datenbanken. Testdateien und feste API-Antworten gehören ausschließlich in diese Testumgebungen.

## Vorbereitung

1. Die gewünschte Plugin-Version installieren und aktivieren. Für PHP 7.0–7.3 wurde WordPress 6.5.7, für PHP 7.4–8.5 WordPress 7.1.3 verwendet.
2. `WP_DEBUG` aktivieren und `DISABLE_WP_CRON` für die Testinstallation setzen.
3. `templates/` nach `wp-content/uploads/kirchenplaner-templates/` kopieren.
4. `tests/wp-fixtures.php` als `wp-content/mu-plugins/kpt-fixtures.php` und `tests/wp-page.php` als `wp-content/mu-plugins/kpt-render/page.php` ablegen. Der Seitenrenderer muss in diesem Unterordner liegen, damit WordPress ihn nicht als eigenständiges MU-Plugin lädt.
5. `tests/cover.svg` nach `wp-content/uploads/kirchenplaner-templates/test-cover.svg` kopieren.
6. `KP_WP_ROOT` auf den WordPress-Pfad setzen und `php tests/wp-seed.php` ausführen. Das Skript legt sechs Test-Kirchenplaner und sechs Seiten an, ändert API-Schlüssel und CSS-Option und gibt die Seiten-IDs aus. Die Browserprüfungen erwarten diese Seiten-IDs in einer frischen WordPress-Installation: Licht 5/7, Horizont 9/11, Mosaik 13/15. Bei anderen IDs die Zuordnung in den Tests anpassen.
7. Node.js ab 22.12 und die Testabhängigkeiten mit `npm install` installieren; Chromium mit `npx playwright install chromium` bereitstellen. Alternativ `KP_BROWSER` auf einen vorhandenen Chromium-/Edge-Pfad setzen.

Die Fixtures richten sämtliche Kirchenplaner-API-Aufrufe auf die lokale Website um. Die Antworten werden aus den vier festen Testterminen erzeugt. Es werden keine echten API-Zugangsdaten benötigt.

Für parallele Tests mit verschiedenen Serverports müssen `WP_HOME` und `WP_SITEURL` in der **lokalen** Testkonfiguration anhand des aktuellen lokalen `HTTP_HOST` gesetzt werden. Die WordPress-Pfade müssen für die jeweilige PHP-Laufzeit lesbar sein. Ältere Windows-PHP-Versionen können OneDrive-Pfade nicht zuverlässig auflösen; die geprüften Testinstallationen lagen deshalb unter `C:/Temp/`.

## Einzelprüfung

Einen lokalen PHP-Webserver mit `tests/router.php` starten. `KP_BASE` auf dessen URL setzen und `npm test` ausführen. Der Test öffnet alle sechs Templates, prüft Filter, Kalender, Paginierung, Detailnavigation, Rücklink und mobile Darstellung und erfasst JavaScript-Ausnahmen. Bei `KP_SCREENSHOTS=1` erzeugt er die zwölf Vorschaubilder unter `preview/`.

`npm run test:extended` prüft zusätzliche Layouts, Kalenderarten, optionale CSS-Bibliotheken, das native Plugin-Modal, den Standard-WordPress-Theme-Kontext, Lade-/Leerzustände, lange Titel, fehlende Felder, ein Detailbild und automatische WCAG-A/AA-Regeln mit axe. Der bekannte Tether-Fehler der Bootstrap-4-Option wird separat erfasst und zusätzlich mit der unveränderten Plugin-Standardvorlage reproduziert.

## PHP-Matrix

Eine lokale JSON-Konfiguration anlegen, beispielsweise `runtimes.local.json`:

```json
{
  "logs": "C:/Temp/kpt-logs",
  "router": "C:/Temp/kpt-tests/router.php",
  "environment": {
    "KP_BROWSER": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  },
  "runtimes": [
    {
      "php": "C:/PHP/php7.0/php.exe",
      "wordpress": "C:/Temp/kpt-tests/legacy",
      "extensions": ["php_mysqli.dll", "php_openssl.dll", "php_mbstring.dll"]
    },
    {
      "php": "C:/PHP/php8.5/php.exe",
      "wordpress": "C:/Temp/kpt-tests/modern",
      "extensions": ["php_mysqli.dll", "php_openssl.dll", "php_mbstring.dll"]
    }
  ]
}
```

`python tests/matrix.py --config runtimes.local.json` führt die Browserprüfungen mit jeder angegebenen Laufzeit aus. `tests/router.php` zuvor an den eingetragenen Router-Pfad kopieren. Das Ergebnis wird unter `tests/results.json` gespeichert. Erweiterungsnamen für Linux entsprechend anpassen.

`tests/results.json` und `tests/extended-results.json` enthalten die tatsächlichen Ergebnisse der Veröffentlichung. Eine vollständige manuelle Barrierefreiheitsprüfung, Live-Kunden-API und beliebige zusätzliche WordPress-Themes werden durch diese Tests nicht ersetzt.

## TYPO3-Controller-Matrix

Der zusätzliche Test benötigt die drei ausgecheckten Extension-Repositories, Node.js ab 22.12 und die Abhängigkeiten aus `package-lock.json`. Er startet selbst einen lokalen HTTP-Server auf einem freien Port. Zusätzliche CMS-Installationen oder Datenbanken sind für diese Controller-Prüfung nicht erforderlich.

1. [TYPO3 6–8](https://github.com/eduardkosel/axkirchenplaner-typo3-6-8) auf `v1.0.8`, [TYPO3 9–13](https://github.com/eduardkosel/axkirchenplaner-typo3-9-13) auf `v2.0.3` und [TYPO3 14](https://github.com/eduardkosel/axkirchenplaner_typo3) auf `3.0.1` auschecken.
2. `npm ci` und `npx playwright install chromium` ausführen.
3. `tests/typo3-extensions.example.json` nach `typo3.local.json` kopieren und die drei absoluten Extension-Verzeichnisse eintragen. Gemeint ist jeweils der Ordner mit `ext_emconf.php` und `Resources/`.
4. `KP_TYPO3_CONFIG` auf diese JSON-Datei setzen und `npm run test:typo3` ausführen.

PowerShell

```powershell
$env:KP_TYPO3_CONFIG = (Resolve-Path ./typo3.local.json).Path
npm run test:typo3
```

Bash

```bash
KP_TYPO3_CONFIG="$PWD/typo3.local.json" npm run test:typo3
```

Optional kann `KP_BROWSER` auf eine vorhandene Chromium-/Edge-Datei zeigen. Ohne diese Variable wird Playwrights installiertes Chromium verwendet. Mit `KP_SCREENSHOTS=1` erzeugt der Lauf außerdem die vier Gottesdienste-Vorschaubilder unter `preview/` aus den real gerenderten Listen- und Detailvorlagen.

Der Test lädt die echten AngularJS-Controller und Bibliotheken direkt aus den angegebenen Extension-Ordnern. Die numerische Herkunftsseiten-UID in `p_id` und der Rücklink über `index.php?id=…` werden ausdrücklich geprüft. Die vier Filter müssen die vom Controller erwarteten Anfrageparameter senden. Alle vier Gestaltungen laufen mit allen drei Extension-Ständen.

`node tests/build-gottesdienste.cjs` erzeugt die eigenständigen Gottesdienste-Dateien aus dem bewährten Licht-Markup und den eigenen Gestaltungsregeln. Danach die Controller-Matrix mit Vorschaubildern erneut ausführen. Die WordPress-Testskripte und deren vorhandene Ergebnisse umfassen weiterhin nur die ursprünglichen drei Varianten.

Das Ergebnis enthält Versionsangabe, Git-Commit, SHA-256-Werte der geladenen JavaScript-Dateien und die einzelnen Prüfungen. Es wird erst nach einem vollständig erfolgreichen Lauf nach `tests/typo3-results.json` geschrieben. Ein fehlgeschlagener Lauf endet mit einem Fehlercode und lässt eine vorhandene Ergebnisdatei unverändert.

Das native Modal wird zusätzlich geprüft. Für 1.0.8 und 2.0.3 muss es funktionieren. Für 3.0.1 wird der bekannte 404-Pfad erfasst und zusätzlich mit der unveränderten Standardvorlage reproduziert. Wenn ein neuer Extension-Stand diesen Befund behebt, sind Versionserwartung und Regressionstest entsprechend anzupassen.

PHP und TYPO3s Backend-/FAL-Verarbeitung gehören nicht zu dieser Controller-Matrix. Für die abschließende Website-Prüfung richte die acht HTML-Dateien nach der Haupt-README in einer eigenen TYPO3-Testinstallation ein. Prüfe für jede Gestaltung die gespeicherte Dateiauswahl nach erneutem Öffnen des Inhaltselements, die tatsächlich geladene `listing.html`, Detailnavigation, `detail.html` und Rücklink. Besonders bei TYPO3 14 ist der dokumentierte Unterschied zwischen Datei-UID und Referenz-UID zu beachten.
