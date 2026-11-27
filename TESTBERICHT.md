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

## TYPO3-Controller-Tests

Prüfdatum **27. November 2026**. Alle sechs Templates wurden zusätzlich mit den unveränderten JavaScript-Dateien der drei TYPO3-Extension-Stände im Chromium-basierten Edge geprüft.

| Zielvariante | Extension | Git-Commit | Listing und Detail aller drei Gestaltungen |
| --- | --- | --- | --- |
| TYPO3 6–8 | 1.0.8 | `f433b4e2b5d1e5d5243da60824b924dda52938a0` | bestanden |
| TYPO3 9–13 | 2.0.3 | `b1ffdfeefccac3948b4f8ec74508a24fc9fc15c5` | bestanden |
| TYPO3 14 | 3.0.1 | `c8995d4b1337ecff1fea6b19aaa45a16a7822e79` | bestanden |

Die vollständigen Commit-IDs und SHA-256-Werte der tatsächlich geladenen Dateien stehen in [tests/typo3-results.json](tests/typo3-results.json). Im Repository 9–13 wurde nach dem Release außerdem die README ergänzt. Der Commit für diesen Test wird deshalb aus dem ausgecheckten Stand in der Ergebnisdatei übernommen.

Insgesamt wurden **18 Template-/Extension-Kombinationen** geprüft. Jede Kombination umfasst vier Auswahlfilter samt API-Parametern, Suche, Zurücksetzen, Paginierung, Datumsauswahl, gruppierte Termine, Filter links/rechts/ausgeblendet und Inline-Kalender. Detaillinks müssen Veranstaltungs-ID und numerische TYPO3-Herkunftsseiten-UID übergeben. Beschreibung, Rücklink, Lade-/Leerzustände, fehlende optionale Felder und Detailbild wurden ebenfalls geprüft.

Die Breiten 320, 390, 768 und 1280 Pixel verursachten keinen horizontalen Überlauf. Die automatischen axe-Prüfungen der Listing- und Detailbereiche meldeten keine Verstöße gegen die verfügbaren WCAG-A/AA-Regeln. Im regulären Template-Test traten keine JavaScript-Ausnahmen oder Konsolenfehler auf.

Die Tests laufen in einem lokalen HTML-Container mit der Konfiguration, die die TYPO3-Controller an AngularJS übergeben. Der Server lädt die originalen JavaScript-Controller und Bibliotheken aus den Extension-Verzeichnissen. PHP, TYPO3-Bootstrap, Backend-Speicherung und FAL-Verarbeitung werden nicht ausgeführt. Die Zuordnung zu TYPO3-Versionen beschreibt den jeweiligen Extension-Zweig. Jede einzelne TYPO3-/PHP-Version ist damit nicht als vollständig integriert getestet ausgewiesen.

### Native Modals

Das native Modal funktioniert im Test mit Extension **1.0.8 und 2.0.3**. Der Controller von **3.0.1** fordert hingegen `/typo3conf/ext/axist.axkirchenplaner/Resources/Public/Angular/Controller/kirchenPlanerModal.html` an. Der fest codierte Pfad passt nicht zu den ausgelieferten Asset-Pfaden. Der Testserver antwortet mit **404**. Der gleiche Aufruf wurde mit der unveränderten Standardvorlage der Extension reproduziert und separat vom Template-Ergebnis aufgezeichnet.

### FAL-Befund in TYPO3 14

Im PHP-Code von Extension **3.0.1** ist `Template Datei` als Referenz auf `sys_file_reference` konfiguriert. Der Controller lädt den gespeicherten Wert mit `ResourceFactory::getFileObject()` als `sys_file`-UID. Wenn diese UIDs auseinanderliegen, kann eine andere Datei ausgewählt werden oder die Auflösung fehlschlagen. Dieser Codebefund ist in der Installationsanleitung vermerkt. Er wurde in dieser Template-Prüfung nicht mit einem TYPO3-Backend reproduziert.

Die Wiederholungsanleitung steht unter [TYPO3-Controller-Matrix](tests/README.md#typo3-controller-matrix).
