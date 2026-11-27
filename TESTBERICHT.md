# Testbericht – Kirchenplaner Templates 1.0.0

Prüfdatum: **27. November 2026**. Drei Varianten mit jeweils Listing und Detailseite; insgesamt sechs eigenständige HTML-Templates.

## Verfügbare Plugin-Versionen

Das angegebene [Plugin-Repository](https://github.com/eduardkosel/axkirchenplaner_wordpress) enthielt zum Prüfzeitpunkt ausschließlich **v1.0.4**, Commit `5022370ac82a6fc151fc514939d2f4de480c972f`. Alle verfügbaren Releases/Tags wurden damit abgedeckt. Historische Originalpakete wie 1.0.3 waren nicht als Release/Tag verfügbar und sind ausdrücklich **nicht als getestet** ausgewiesen.

Die PHP- und JavaScript-Quelldateien beider WordPress-Testinstallationen wurden mit dem veröffentlichten Tag verglichen. Die Versionsinventur steht in [tests/plugin-versions.json](tests/plugin-versions.json).

## WordPress-/PHP-Matrix

Alle sechs Templates wurden in **jeder** der folgenden Umgebungen im Browser getestet: insgesamt **66 Template-/Laufzeit-Kombinationen**. Die Testseiten liefen mit dem echten Plugin innerhalb von WordPress; API-Antworten kamen aus lokalen Fixtures. Die Matrix verwendete keine Bootstrap-Bibliothek.

| Plugin | PHP | WordPress | Listing + Detail aller drei Varianten |
| --- | --- | --- | --- |
| 1.0.4 | 7.0.31 | 6.5.7 | bestanden |
| 1.0.4 | 7.1.23 | 6.5.7 | bestanden |
| 1.0.4 | 7.2.18 | 6.5.7 | bestanden |
| 1.0.4 | 7.3.19 | 6.5.7 | bestanden |
| 1.0.4 | 7.4.16 | 7.1.3 | bestanden |
| 1.0.4 | 8.0.1 | 7.1.3 | bestanden |
| 1.0.4 | 8.1.0 | 7.1.3 | bestanden |
| 1.0.4 | 8.2.14 | 7.1.3 | bestanden |
| 1.0.4 | 8.3.1 | 7.1.3 | bestanden |
| 1.0.4 | 8.4.27 | 7.1.3 | bestanden |
| 1.0.4 | 8.5.12 | 7.1.3 | bestanden |

PHP 7.0–7.3 wurde mit einer passenden älteren WordPress-Version geprüft. Die neuere WordPress-Version unterstützt diese PHP-Zweige selbst nicht.

## In jeder Matrix-Umgebung geprüft

- Laden aller sechs HTML-Dateien und Rendern der API-Daten mit den unveränderten AngularJS-Controllern des Plugins.
- Suche, Kategorieauswahl, Zurücksetzen, alle vier Auswahlfelder und Öffnen des Datumsauswahlfensters.
- Vor-/Zurückblättern, korrekte deaktivierte Zurück-Schaltfläche auf Seite 1.
- Klick auf einen Termin, richtige Detailseite und `v_id`, Beschreibung und Rücklink zur Liste.
- Desktop mit 1280 Pixel und Smartphone mit 390 Pixel Browserbreite, ohne horizontalen Seitenüberlauf.
- Keine Template-JavaScript-Ausnahmen und keine sichtbaren PHP-Fehlermeldungen.

## Zusätzliche Prüfungen mit PHP 8.5

Für jede Variante wurden außerdem geprüft:

- Suchbereich links/rechts/ausgeblendet, gruppierte und ungruppierte Termine.
- Startdatum, Start-/Enddatum und Inline-Kalender.
- Paginierung oben, unten, oben und unten sowie ausgeblendet.
- Gemeinde-, Zielgruppen- und Ortsauswahl mit tatsächlicher neuer API-Anfrage.
- Betrieb mit Bootstrap 3 sowie Darstellung mit der alten Bootstrap-4-Option; deren Bibliotheksfehler wurde separat erfasst.
- Öffnen und Schließen des nativen Plugin-Modals.
- Darstellung in einem breiten Test-Seitenlayout und im unveränderten WordPress-Standardtheme Twenty Twenty-Five.
- Ladezustand, leere Liste, leere Detailantwort, fehlende optionale Felder und Beschreibung sowie ein Detailbild.
- Lange Überschriften bei 320, 390, 768 und 1280 Pixel Breite ohne horizontalen Seitenüberlauf.
- Automatische axe-Prüfung der Listing- und Detailbereiche gegen die verfügbaren WCAG-A/AA-Regeln: keine gemeldeten Verstöße. Das ist keine vollständige manuelle Barrierefreiheitsprüfung oder Zertifizierung.

## Bekannter Plugin-Befund

Die vom Plugin mitgelieferte **Bootstrap-4-alpha-Bibliothek** wirft `Bootstrap tooltips require Tether (http://tether.io/)`, weil ihre Abhängigkeit fehlt. Der gleiche Fehler wurde zusätzlich mit der **unveränderten Standardvorlage** des Plugins reproduziert. Er stammt nicht aus den neuen Templates.

Die Templates benötigen Bootstrap nicht. Für diese Vorlagen kann in den Plugin-Einstellungen **CSS Bibliothek laden? → Keine** gewählt werden. Bootstrap 3 wurde ebenfalls ohne diesen Fehler geprüft. Der alte Bootstrap-4-Fehler ist in [tests/extended-results.json](tests/extended-results.json) separat von den Template-Fehlern dokumentiert.

## Vorschaubilder und Grenzen

Die zwölf [Vorschaubilder](preview/README.md) wurden aus den echten Browseransichten erzeugt, ohne nachträglich erfundene Inhalte oder Layout-Retuschen. Sie zeigen feste, fiktive Testtermine und die Gestaltung ohne Bootstrap.

Nicht geprüft sind echte Kunden-API-Zugangsdaten, nicht verfügbare historische Plugin-Pakete, alle denkbaren Themes/Plugins, mobile Safari/Firefox und jede mögliche API-Antwortform. Ein vollständiger Netzwerkausfall folgt der vorhandenen Fehlerbehandlung des Plugin-Controllers; reine HTML-Templates ergänzen daran keinen neuen Fehler-Callback. Änderungen am Plugin selbst wurden nicht vorgenommen.

Die maschinenlesbaren Ergebnisse stehen in [tests/results.json](tests/results.json) und [tests/extended-results.json](tests/extended-results.json). Anleitung zum Wiederholen: [tests/README.md](tests/README.md).
