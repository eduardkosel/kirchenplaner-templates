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
