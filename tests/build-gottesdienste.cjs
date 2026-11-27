// Derive standalone HTML files from the shared, controller-compatible Licht markup.
// Run after changing the shared markup: node tests/build-gottesdienste.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const styles = `
/* Gottesdienste: calendar cards, calm teal, warm Sunday accents. */
.kpt.kpt--gottesdienste{--paper:#f7f9f8;--white:#fff;--ink:#20343a;--muted:#52656a;--accent:#244c59;--soft:#eaf0ef;--line:#cddbd9;border-radius:16px;container-type:inline-size}
.kpt--gottesdienste .kpt-hero{background:#eef3f0;border-bottom:3px solid #b89a60}
.kpt--gottesdienste .kpt-hero h2{font-family:Georgia,serif;font-weight:400;letter-spacing:-.025em}
.kpt--gottesdienste .kpt-mark{display:none}
.kpt--gottesdienste .kpt-events{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.kpt--gottesdienste .kpt-event{grid-template-columns:62px minmax(0,1fr);align-items:start;gap:16px;padding:22px;border-top:3px solid var(--line);border-radius:10px}
.kpt--gottesdienste .kpt-stamp{padding:0;gap:0;border:1px solid var(--line);border-radius:7px;background:#fff;overflow:hidden;color:var(--ink)}
.kpt--gottesdienste .kpt-stamp .kpt-weekday{width:100%;padding:6px 2px;background:var(--accent);color:#fff;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.08em;text-align:center}
.kpt--gottesdienste .kpt-stamp strong{padding:8px 0 4px;font-size:30px;font-weight:650}
.kpt--gottesdienste .kpt-stamp small{padding:0 2px 8px;font-size:10px;white-space:nowrap}
.kpt--gottesdienste .kpt-sunday .kpt-weekday{background:#78571f}
.kpt--gottesdienste .kpt-event .kpt-tag{background:transparent;color:var(--accent);padding:0;margin-bottom:10px;font-size:20px;letter-spacing:0;font-weight:750;text-transform:none}
.kpt--gottesdienste .kpt-event .kpt-tag:before{display:none}
.kpt--gottesdienste .kpt-event-title{font-size:20px;line-height:1.4;letter-spacing:-.02em;text-wrap:initial}
.kpt--gottesdienste .kpt-event-action{display:inline-flex;align-items:center;grid-column:2;justify-self:start;width:auto;height:auto;min-height:44px;padding:8px 0;border:0;border-radius:4px;background:transparent;color:var(--accent);gap:10px;font-size:13px}
.kpt--gottesdienste .kpt-event-action:hover{background:var(--soft);color:var(--accent)}
.kpt--gottesdienste .kpt-action-label{text-decoration:underline;text-underline-offset:3px}
.kpt--gottesdienste .kpt-group-title{font-size:16px;color:var(--ink);padding:12px 0;border-bottom:1px solid var(--line)}
.kpt--gottesdienste .kpt-holiday{font-size:13px}
.kpt--gottesdienste .kpt-person{margin-top:10px;color:var(--muted);font-size:13px}
.kpt--gottesdienste .kpt-layout-left .kpt-events,.kpt--gottesdienste .kpt-layout-right .kpt-events{grid-template-columns:minmax(0,1fr)}
@container(max-width:700px){.kpt--gottesdienste .kpt-events{grid-template-columns:minmax(0,1fr)}}
@media(max-width:700px){.kpt--gottesdienste .kpt-events{grid-template-columns:minmax(0,1fr)}.kpt--gottesdienste .kpt-event{grid-template-columns:54px minmax(0,1fr);gap:12px;padding:16px}.kpt--gottesdienste .kpt-event-title{font-size:18px}.kpt--gottesdienste .kpt-event-action{grid-column:2;width:auto}.kpt--gottesdienste .kpt-stamp{border:1px solid var(--line);padding:0}}
@media print{.kpt--gottesdienste .kpt-filters,.kpt--gottesdienste .kpt-pagination,.kpt--gottesdienste .kpt-event-action{display:none}.kpt--gottesdienste .kpt-events{display:block}.kpt--gottesdienste .kpt-event{break-inside:avoid;margin-bottom:12px}.kpt--gottesdienste .kpt-group-title{break-after:avoid}}
`;
fs.mkdirSync(path.join(root, 'templates/gottesdienste'), { recursive: true });
for (const view of ['listing', 'detail']) {
    let html = fs.readFileSync(path.join(root, 'templates/licht', view + '.html'), 'utf8');
    html = html.replace('Licht · MIT', 'Gottesdienste · MIT')
        .replace('kpt kpt--licht', 'kpt kpt--gottesdienste')
        .replace('</style>', styles + '\n</style>')
        .replace('Kirche. Gemeinsam. Erleben.', 'Glauben teilen. Gemeinschaft erleben.');
    if (view === 'listing') {
        html = html.replace('Raum für Begegnung', 'Gottesdienste & Begegnungen')
            .replace('Gute Zeit.<br>In guter Gesellschaft.', 'Zeit für Glauben.<br>Raum für Begegnung.')
            .replace('Gottesdienste, Musik und kleine Auszeiten. Entdecken Sie, was unsere Gemeinde verbindet.', 'Gemeinsam feiern, zur Ruhe kommen und Zuversicht finden. Die nächsten Termine unserer Gemeinde auf einen Blick.')
            .replace('Nächste Begegnungen', 'Unsere nächsten Termine')
            .replaceAll('<article class="kpt-event"', '<article class="kpt-event" ng-class="{\'kpt-sunday\': r.beginn_wochentag_kurz_zwingend == \'So\'}"')
            .replaceAll('<div class="kpt-stamp" aria-hidden="true">', '<div class="kpt-stamp" aria-hidden="true"><span class="kpt-weekday">{{r.beginn_wochentag_kurz_zwingend}}</span>')
            .replaceAll('<span class="kpt-tag">{{r.veranstalter || \'Gemeindeleben\'}}</span>', '<span class="kpt-tag" ng-if="r.beginn_zeit_zwingend || r.beginn_zeit">{{r.beginn_zeit_zwingend || r.beginn_zeit}} Uhr</span>')
            .replaceAll('</div></div>\n <button type="button" class="kpt-event-action"', '</div><p class="kpt-person" ng-if="r.ansprechpartner">{{r.ansprechpartner}}</p></div>\n <button type="button" class="kpt-event-action"')
            .replaceAll('aria-label="Details zu {{r.titel}} öffnen"><svg', 'aria-label="Details zu {{r.titel}} öffnen"><span class="kpt-action-label">Mehr erfahren</span><svg');
    }
    fs.writeFileSync(path.join(root, 'templates/gottesdienste', view + '.html'), html);
}
console.log('Generated Gottesdienste listing and detail with embedded CSS.');
