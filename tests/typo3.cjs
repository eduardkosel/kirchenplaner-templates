const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { responseFor } = require('./typo3-fixtures.cjs');

const repo = path.resolve(__dirname, '..');
const scripts = [
    'libs/angular.min.js',
    'libs/angular-locale_de-de.js',
    'libs/angular-ui-bootstrap.min.js',
    'libs/angular-filter.min.js',
    'libs/angular-animate.min.js',
    'libs/angular-scroll.min.js',
    'libs/underscore.min.js',
    'app.js',
    'Controller/kirchenPlaner.js',
    'Controller/kirchenPlanerModal.js',
];

function configuration(base, slug, pageId, options) {
    return {
        apiKey: 'local-fixture', apiUrl: base, baseUrl: base + '/', pageId: String(pageId),
        topics: '', locations: '', targetAudience: '', communities: '',
        detailLinkType: options.get('link') || 'linkdetailseite',
        detailsPage: base + '/index.php?id=2&variant=' + slug,
        htmlTemplate: base + '/templates/' + slug + (pageId === 2 ? '/detail.html' : '/listing.html'),
        modalTemplate: base + '/assets/Angular/Controller/kirchenPlanerModal.html',
        groupItems: options.get('group') || 'nein', borderColors: 'ja',
        showPagination: options.get('pagination') || 'obenunten',
        startDate: '', endDate: '', daysToFetch: '10', itemsPerPage: '2',
        holidays: 'prot', additionalItems: '', items: '', includeSubCommunities: 'ja',
        detailItem: options.get('v_id') || '',
        displaySearch: options.get('layout') || 'oben',
        searchTextSearch: 'ja', searchTextSearchValue: '',
        searchCalendar: options.get('calendar') || 'startende', searchPast: 'ja',
        searchCategories: [{ id: '301', name: 'Gottesdienst' }, { id: '302', name: 'Musik' }],
        searchCategoryValue: '', searchLocations: [{ id: '201', name: 'Stadtkirche' }],
        searchLocationValue: '', searchTargetAudiences: [{ id: '401', name: 'Alle' }],
        searchTargetAudienceValue: '', searchCommunities: [{ id: '101', name: 'Gemeinde' }],
        searchCommunityValue: '',
    };
}

function startServer(extension) {
    const server = http.createServer((request, response) => {
        const base = 'http://127.0.0.1:' + server.address().port;
        const url = new URL(request.url, base);
        try {
            if (url.pathname.startsWith('/api/index/')) {
                const params = JSON.parse(decodeURIComponent(url.pathname.slice('/api/index/'.length)));
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(responseFor(params)));
                return;
            }
            if (url.pathname === '/index.php' || url.pathname === '/') {
                const slug = url.searchParams.get('variant') || 'licht';
                assert(['licht', 'horizont', 'mosaik'].includes(slug));
                const pageId = Number(url.searchParams.get('id') || 1);
                const config = configuration(base, slug, pageId, url.searchParams);
                if (url.searchParams.has('baseline')) {
                    config.htmlTemplate = base + '/assets/Angular/templates/defaultListing.html';
                }
                // TYPO3 passes the numeric origin page UID as p_id, unlike WordPress.
                config.pageId = url.searchParams.get('p_id') || String(pageId);
                response.setHeader('Content-Type', 'text/html; charset=utf-8');
                response.end(`<!doctype html><html lang="de" ng-app="kirchenPlanerApp"><head>
                    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                    <title>TYPO3 template controller test</title>
                    <style>body{margin:0}main{max-width:1180px;margin:auto;padding:16px}</style>
                    </head><body><main>
                    <script>window.kirchenplaner_config=[];kirchenplaner_config[17]=${JSON.stringify(config)};</script>
                    <div ng-controller="kirchenPlanerCtrl" ng-init="init_uid(17)"><div ng-include="template"></div></div>
                    </main>${scripts.map(file => `<script src="/assets/Angular/${file}"></script>`).join('')}</body></html>`);
                return;
            }
            let file;
            if (url.pathname.startsWith('/templates/')) {
                file = path.resolve(repo, '.' + url.pathname);
                assert(file.startsWith(path.join(repo, 'templates') + path.sep));
            } else if (url.pathname.startsWith('/assets/')) {
                const publicPath = path.join(extension.root, 'Resources', 'Public');
                file = path.resolve(publicPath, '.' + url.pathname.slice('/assets'.length));
                assert(file.startsWith(publicPath + path.sep));
            } else if (url.pathname === '/cover.svg') {
                file = path.join(__dirname, 'cover.svg');
            } else {
                response.writeHead(404).end();
                return;
            }
            const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
            response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
            if (!fs.existsSync(file)) {
                response.writeHead(404).end();
                return;
            }
            response.end(fs.readFileSync(file));
        } catch (error) {
            response.writeHead(500).end(error.message);
        }
    });
    server.listen(0, '127.0.0.1');
    return server;
}

function provenance(extension) {
    const root = path.resolve(extension.root);
    const emconf = fs.readFileSync(path.join(root, 'ext_emconf.php'), 'utf8');
    const version = emconf.match(/'version'\s*=>\s*'([^']+)'/)[1];
    assert.equal(version, extension.version, 'Unexpected extension version');
    const controllerFiles = scripts.map(file => path.join('Resources/Public/Angular', file));
    const files = Object.fromEntries(controllerFiles.map(file => [file.replaceAll('\\', '/'),
        crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const changes = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', ...controllerFiles], { encoding: 'utf8' }).trim();
    assert.equal(changes, '', 'Commit controller changes before running compatibility tests');
    return { extension: extension.label, version, commit, files };
}

async function checkVariant(browser, slug, base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
    });
    let mode = 'normal';
    await page.route('**/api/index/**', async route => {
        const params = JSON.parse(decodeURIComponent(new URL(route.request().url()).pathname.split('/api/index/')[1]));
        let data = responseFor(params);
        if (mode === 'empty') data = { termine: [], total_count: 0 };
        if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 600));
        if (mode === 'missing') {
            for (const row of data.termine) {
                for (const key of ['beschreibung_lang', 'hauptbild_pfad', 'hauptbild_pfad_absolut', 'untertitel', 'ansprechpartner', 'veranstalter', 'raum_name_lang', 'raum_ort', 'raum_str', 'raum_plz']) delete row[key];
            }
        }
        if (mode === 'image') data.termine[0].hauptbild_pfad_absolut = base + '/cover.svg';
        if (mode === 'long') for (const row of data.termine) row.titel = 'Ein besonderer Abend für alle Generationen mit Musik und guten Begegnungen in unserer Gemeinde';
        await route.fulfill({ json: data });
    });
    const list = base + '/index.php?id=1&variant=' + slug;
    const detail = base + '/index.php?id=2&variant=' + slug + '&v_id=501&p_id=1';
    async function ready(count = 2) {
        await page.waitForFunction(count => document.querySelectorAll('.kpt-event').length === count, count);
    }
    async function clean() {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
        assert(!/\{\{|Warning:|Fatal error:/.test(await page.locator('body').innerText()), 'Unresolved content');
    }
    try {
        await page.goto(list);
        await ready();
        await clean();
        assert.equal(await page.locator('.kpt-filters select').count(), 4);
        assert(await page.locator('.kpt-pagination-bottom button').first().isDisabled());
        await page.locator('.kpt-pagination-bottom button').last().click();
        await page.getByRole('heading', { name: 'Zeit für einen guten Gedanken', exact: true }).waitFor();
        await page.locator('input[type=search]').fill('Musik');
        await ready(1);
        assert.match(await page.locator('.kpt-event-title').innerText(), /Musik/);
        await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
        await ready();
        await page.getByLabel('Kategorie', { exact: true }).selectOption('302');
        await page.getByRole('heading', { name: 'Gemeinsam an einem Tisch', exact: true }).waitFor();
        for (const [label, parameter, value] of [
            ['Gemeinde', 'q_gemeinde', '101'], ['Zielgruppe', 'q_zielgruppe_filter', '401'], ['Ort', 'q_ort_ids', '201'],
        ]) {
            const response = page.waitForResponse(response => {
                if (!response.url().includes('/api/index/')) return false;
                const params = JSON.parse(decodeURIComponent(new URL(response.url()).pathname.split('/api/index/')[1]));
                return params[parameter] === value;
            });
            await page.getByLabel(label, { exact: true }).selectOption(value);
            await response;
        }
        await page.getByRole('button', { name: 'Kalender für Ab Datum öffnen', exact: true }).click();
        await page.locator('.uib-datepicker-popup').waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
        await page.getByRole('heading', { name: 'Ein Licht für den Advent', exact: true }).waitFor();
        await page.locator('.kpt-event-action').first().click();
        await page.waitForURL(url => url.searchParams.get('v_id') === '501');
        assert.equal(new URL(page.url()).searchParams.get('id'), '2');
        assert.equal(new URL(page.url()).searchParams.get('p_id'), '1');
        await page.locator('.kpt-detail-title').waitFor();
        assert.match(await page.locator('.kpt-description').innerText(), /Ein Moment zum Ankommen/);
        assert.equal(await page.locator('.kpt-back').getAttribute('href'), base + '/index.php?id=1');
        await clean();
        for (const width of [320, 390, 768, 1280]) {
            await page.setViewportSize({ width, height: 1000 });
            await clean();
        }
        const detailAudit = await new AxeBuilder({ page }).include('.kpt').withTags(['wcag2a', 'wcag2aa']).analyze();
        assert.deepEqual(detailAudit.violations.map(violation => violation.id), []);
        for (const options of [
            '&layout=links&calendar=start&group=ja&pagination=oben',
            '&layout=rechts&calendar=kalender&pagination=obenunten',
            '&layout=nein&calendar=nein&pagination=ausblenden',
        ]) {
            await page.goto(list + options);
            await ready();
            await clean();
            if (options.includes('calendar=kalender')) assert.equal(await page.locator('.uib-datepicker').count(), 1);
            if (options.includes('layout=nein')) assert.equal(await page.locator('.kpt-filters').count(), 0);
        }
        mode = 'long';
        await page.goto(list);
        await ready();
        for (const width of [320, 390, 768, 1280]) {
            await page.setViewportSize({ width, height: 1000 });
            await clean();
        }
        const listAudit = await new AxeBuilder({ page }).include('.kpt').withTags(['wcag2a', 'wcag2aa']).analyze();
        assert.deepEqual(listAudit.violations.map(violation => violation.id), []);
        mode = 'loading';
        await page.goto(list);
        await page.getByRole('status').filter({ hasText: 'Termine werden geladen' }).waitFor();
        await ready();
        mode = 'empty';
        await page.goto(list);
        await page.getByText('Gerade ist es hier ganz ruhig.').waitFor();
        await page.goto(detail);
        await page.getByText('Dieser Termin ist gerade nicht verfügbar.').waitFor();
        mode = 'missing';
        await page.goto(detail);
        await page.getByText('Weitere Informationen erhalten Sie direkt beim Veranstalter.').waitFor();
        mode = 'image';
        await page.goto(detail);
        await page.waitForFunction(() => {
            const image = document.querySelector('.kpt-cover');
            return image && image.complete && image.naturalWidth > 0;
        });
        assert.deepEqual(errors, []);
        return {
            template: slug,
            views: ['listing', 'detail'],
            checks: [
                'four filters and request parameters', 'search and reset', 'pagination',
                'datepicker', 'numeric TYPO3 page IDs in detail navigation and backlink',
                'left/right/hidden filters', 'grouping', 'inline calendar',
                'loading/empty states', 'optional fields and image',
                '320/390/768/1280px without overflow', 'axe WCAG A/AA listing and detail',
            ],
            status: 'passed',
            javascript_errors: errors,
        };
    } finally {
        await context.close();
    }
}

async function checkNativeModal(browser, base, baseline = false) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto(base + '/index.php?id=1&link=modal' + (baseline ? '&baseline=1' : ''));
        const button = page.locator(baseline ? '.clickable-row' : '.kpt-event-action').first();
        await button.waitFor();
        const templateResponse = page.waitForResponse(response => response.url().endsWith('/kirchenPlanerModal.html'));
        await button.click();
        const response = await templateResponse;
        if (response.status() !== 200) {
            return { status: 'blocked', upstream: true, requested_path: new URL(response.url()).pathname, http_status: response.status() };
        }
        await page.locator('#modal-title').waitFor();
        assert.match(await page.locator('#modal-title').textContent(), /Ein Licht für den Advent/);
        return { status: 'passed' };
    } finally {
        await context.close();
    }
}

async function main() {
    assert(process.env.KP_TYPO3_CONFIG, 'Set KP_TYPO3_CONFIG to your extension roots JSON (see tests/typo3-extensions.example.json)');
    const extensions = JSON.parse(fs.readFileSync(process.env.KP_TYPO3_CONFIG, 'utf8'));
    assert.equal(extensions.length, 3, 'Provide all three TYPO3 extension variants');
    assert.deepEqual(extensions.map(extension => extension.version).sort(), ['1.0.8', '2.0.3', '3.0.1']);
    const results = {
        scope: 'Real extension JavaScript controllers and assets in a local HTML harness; TYPO3 PHP bootstrap and FAL are not executed',
        browser: null,
        node: process.version,
        extensions: [],
    };
    const launchOptions = { headless: true };
    if (process.env.KP_BROWSER) launchOptions.executablePath = process.env.KP_BROWSER;
    const browser = await chromium.launch(launchOptions);
    results.browser = await browser.version();
    try {
        for (const extension of extensions) {
            extension.root = path.resolve(extension.root);
            const metadata = provenance(extension);
            const server = startServer(extension);
            try {
                await once(server, 'listening');
                const base = 'http://127.0.0.1:' + server.address().port;
                const checks = [];
                for (const slug of ['licht', 'horizont', 'mosaik']) {
                    checks.push(await checkVariant(browser, slug, base));
                    console.log(extension.label + ' / ' + slug + ' passed');
                }
                const nativeModal = await checkNativeModal(browser, base);
                if (extension.version === '3.0.1') {
                    assert.equal(nativeModal.status, 'blocked', 'Review the documented TYPO3 14 modal finding after an extension update');
                    assert.equal(nativeModal.requested_path, '//typo3conf/ext/axist.axkirchenplaner/Resources/Public/Angular/Controller/kirchenPlanerModal.html');
                    assert.equal(nativeModal.http_status, 404);
                    assert.deepEqual(await checkNativeModal(browser, base, true), nativeModal, 'Standard template must reproduce the extension modal issue');
                    nativeModal.standard_template_confirmed = true;
                } else {
                    assert.equal(nativeModal.status, 'passed');
                }
                results.extensions.push({ ...metadata, checks, native_modal: nativeModal });
            } finally {
                await new Promise(resolve => server.close(resolve));
            }
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(__dirname, 'typo3-results.json'), JSON.stringify(results, null, 2) + '\n');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
