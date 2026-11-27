const events = [
    { id: 501, titel: 'Ein Licht für den Advent', category: '301' },
    { id: 502, titel: 'Musik, die den Abend trägt', category: '302' },
    { id: 503, titel: 'Zeit für einen guten Gedanken', category: '301' },
    { id: 504, titel: 'Gemeinsam an einem Tisch', category: '302' },
].map(event => ({
    untertitel: 'Begegnungen in unserer Gemeinde',
    ansprechpartner: 'Anna Weber',
    raum_name_lang: 'Stadtkirche',
    raum_ort: 'Lindenstadt',
    raum_teilort: '',
    raum_str: 'Kirchplatz 1',
    raum_plz: '70173',
    veranstalter: 'Evangelische Gemeinde',
    farbe_1: '315d48',
    beginn_wochentag_kurz_zwingend: 'So',
    beginn_datum_zwingend: '29.11.2026',
    beginn_datum: '29.11.2026',
    beginn_zeit_zwingend: '10:00',
    beginn_zeit: '10:00',
    beginn_feiertage: '1. Advent',
    beginn_prot_feiertage: '1. Advent',
    beginn_kath_feiertage: '1. Advent',
    hauptbild_pfad: '',
    hauptbild_pfad_absolut: '',
    beschreibung_lang: '<p>Ein Moment zum Ankommen mit Musik und Zeit füreinander.</p>',
    ...event,
}));

function responseFor(params) {
    let rows = structuredClone(events);
    if (params.q_vid) {
        rows = rows.filter(event => String(event.id) === String(params.q_vid));
    } else {
        if (params.q_stichwort) {
            rows = rows.filter(event => event.titel.toLowerCase().includes(params.q_stichwort.toLowerCase()));
        }
        if (params.q_rubrik_filter) {
            rows = rows.filter(event => event.category === params.q_rubrik_filter);
        }
    }
    const offset = Number(params.q_offset || 0);
    const limit = Number(params.q_limit || 20);
    return { termine: rows.slice(offset, offset + limit), total_count: rows.length };
}

module.exports = { responseFor };
