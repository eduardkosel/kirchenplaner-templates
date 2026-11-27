const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const assert=require('node:assert/strict');
(async()=>{
const base=process.env.KP_BASE||'http://127.0.0.1:18385';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,executablePath:process.env.KP_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const errors=[];const result=[];const knownPluginErrors=[];let phase='standard';
try{
const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(15000);
page.on('pageerror',e=>{if(e.message.includes('Bootstrap tooltips require Tether') && ['bootstrap4','baselineBootstrap4'].includes(phase)){knownPluginErrors.push({phase,message:e.message});}else errors.push(e.message)});
let mode='normal';let requests=[];
await page.route('**/api/index/**',async route=>{
 const response=await route.fetch();let data=await response.json();
 requests.push(JSON.parse(decodeURIComponent(route.request().url().split('/api/index/')[1])));
 if(mode==='loading')await new Promise(r=>setTimeout(r,650));
 if(mode==='empty')data={termine:[],total_count:0};
 if(mode==='long')for(const row of data.termine){row.titel='Ein besonderer Abend für unsere ganze Gemeinde mit Musik, Geschichten und guten Begegnungen über alle Generationen hinweg';row.untertitel='Gemeinsam unterwegs — alle sind willkommen';}
 if(mode==='missing')for(const row of data.termine){for(const key of ['untertitel','beschreibung_lang','hauptbild_pfad','hauptbild_pfad_absolut','ansprechpartner','veranstalter','raum_name_lang','raum_ort','raum_str','raum_plz'])delete row[key]}
 if(mode==='image')for(const row of data.termine)row.hauptbild_pfad_absolut=base+'/wp-content/uploads/kirchenplaner-templates/test-cover.svg';
 await route.fulfill({response,json:data});
});
async function ready(){await page.locator('.kpt-event').first().waitFor()}
async function overflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Horizontal page overflow')}
for(const [slug,ids] of Object.entries({licht:[5,7],horizont:[9,11],mosaik:[13,15]})){
 const list=base+'/?page_id='+ids[0];const detail=base+'/?page_id='+ids[1]+'&v_id=501&p_id='+encodeURIComponent(list);
 await page.goto(list+'&theme=default');await ready();await overflow();await page.goto(detail+'&theme=default');await page.locator('.kpt-detail-title').waitFor();await overflow();
 for(const query of ['&layout=links&calendar=start&group=nein&pagination=oben','&layout=rechts&calendar=kalender&pagination=obenunten','&layout=nein&calendar=nein&pagination=ausblenden']){
  await page.goto(list+query);await ready();await overflow();
  if(query.includes('layout=nein'))assert.equal(await page.locator('.kpt-filters').count(),0);
  if(query.includes('calendar=kalender'))assert.equal(await page.locator('.uib-datepicker').count(),1);
 }
 for(const csslib of ['bootstrap3','bootstrap4']){phase=csslib;await page.goto(list+'&csslib='+csslib);await ready();await overflow();phase='standard'}
 await page.goto(list+'&link=modal&csslib=bootstrap3');await ready();await page.locator('.kpt-event-action').first().click();await page.locator('.modal-dialog').waitFor();await page.locator('.modal-dialog .close').click();await page.locator('.modal-dialog').waitFor({state:'detached'});
 await page.goto(list);await ready();
 for(const label of ['Gemeinde','Zielgruppe','Ort']){requests=[];await page.getByLabel(label,{exact:true}).selectOption({index:1});await page.waitForTimeout(80);assert(requests.length>0,'Filter did not request data: '+label)}
 const auditList=await new AxeBuilder({page}).include('.kpt').withTags(['wcag2a','wcag2aa']).analyze();
 assert.deepEqual(auditList.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],slug+' listing accessibility');
 mode='loading';const loading=page.goto(list);await page.getByRole('status').filter({hasText:'Termine werden geladen'}).waitFor();await loading;await ready();
 mode='empty';await page.goto(list);await page.getByText('Gerade ist es hier ganz ruhig.').waitFor();assert.equal(await page.locator('.kpt-event').count(),0);
 mode='long';await page.goto(list);await ready();for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});await overflow()}
 mode='missing';await page.goto(detail);await page.getByText('Weitere Informationen erhalten Sie direkt beim Veranstalter.').waitFor();assert.equal(await page.locator('.kpt-cover').count(),0);
 mode='empty';await page.goto(detail);await page.getByText('Dieser Termin ist gerade nicht verfügbar.').waitFor();
 mode='image';await page.goto(detail);await page.locator('.kpt-cover').waitFor();await page.waitForFunction(()=>{const image=document.querySelector('.kpt-cover');return image.complete&&image.naturalWidth>0});
 mode='normal';await page.goto(detail);await page.locator('.kpt-detail-title').waitFor();
 const auditDetail=await new AxeBuilder({page}).include('.kpt').withTags(['wcag2a','wcag2aa']).analyze();
 if(auditDetail.violations.length)console.error(JSON.stringify(auditDetail.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
 assert.deepEqual(auditDetail.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],slug+' detail accessibility');
 result.push({template:slug,checks:['left and right sidebar','hidden filters','three calendar modes','four pagination modes','Bootstrap 3 and 4 (upstream Tether issue recorded)','native plugin modal','standard WordPress theme listing and detail','community audience location filters','loading','empty listing and detail','long titles at 320 390 768 1280px','missing metadata','detail image','axe WCAG A/AA listing and detail']});
}
phase='baselineBootstrap4';const before=knownPluginErrors.length;await page.goto(base+'/?page_id=5&baseline=1&csslib=bootstrap4');await page.locator('.kirchenplaner .clickable-row').first().waitFor();assert(knownPluginErrors.length>before,'Bootstrap 4 baseline issue not reproduced');
assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:await browser.version(),node:process.version,checks:result,javascript_errors:errors,known_plugin_errors:knownPluginErrors,baseline_confirmed:true}));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
