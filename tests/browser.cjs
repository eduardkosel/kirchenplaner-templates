const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const base=process.env.KP_BASE||'http://127.0.0.1:18385';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local test site required');
const browser=await chromium.launch({headless:true,executablePath:process.env.KP_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const checks=[];const errors=[];
try{
const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error' && m.text().includes('Error:')) errors.push(m.text())});
const variants={licht:{listing:5,detail:7},horizont:{listing:9,detail:11},mosaik:{listing:13,detail:15}};
async function visibleEvents(n){try{await page.waitForFunction(n=>document.querySelectorAll('.kpt .kpt-event').length===n,n)}catch(e){console.error(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(0,1600)}));throw e}}
async function clean(){const text=await page.locator('body').innerText();assert(!/Deprecated:|Warning:|Fatal error:/.test(text),text.slice(0,500));assert(!text.includes('{{'),'Unresolved bindings');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Page overflow');}
for(const [slug,ids] of Object.entries(variants)){
const listing=base+'/?page_id='+ids.listing;
await page.goto(listing);await visibleEvents(2);await clean();
assert((await page.locator('.kpt-event').first().innerText()).includes('Ein Licht für den Advent'));
assert.equal(await page.locator('.kpt-filters select').count(),4);
assert(await page.locator('.kpt-pagination-bottom button').first().isDisabled());
if(process.env.KP_SCREENSHOTS){fs.mkdirSync('preview',{recursive:true});await page.locator('.kpt').screenshot({path:'preview/'+slug+'-listing.png'});}
await page.locator('.kpt-pagination-bottom button').last().click();
await page.locator('.kpt-event-title').filter({hasText:'Zeit für einen guten Gedanken'}).waitFor();
await page.locator('.kpt-pagination-bottom button').first().click();
await page.locator('.kpt-event-title').filter({hasText:'Ein Licht für den Advent'}).waitFor();
await page.locator('input[type=search]').fill('Musik');await visibleEvents(1);
assert((await page.locator('.kpt-event-title').innerText()).includes('Musik'));
await page.getByRole('button',{name:'Filter zurücksetzen'}).click();await visibleEvents(2);
await page.getByLabel('Kategorie',{exact:true}).selectOption('302');await visibleEvents(2);
assert((await page.locator('.kpt-event-title').first().innerText()).includes('Musik'));
await page.getByRole('button',{name:'Filter zurücksetzen'}).click();
await page.locator('.kpt-event-title').filter({hasText:'Ein Licht für den Advent'}).waitFor();
await page.getByRole('button',{name:'Kalender für Ab Datum öffnen',exact:true}).click();
await page.locator('.uib-datepicker-popup').waitFor();
await page.keyboard.press('Escape');
await page.locator('.kpt-event-action').first().click();
await page.waitForURL(u=>u.searchParams.get('v_id')==='501');
await page.locator('.kpt-detail-title').waitFor();
assert((await page.locator('.kpt-description').innerText()).includes('Ein Moment zum Ankommen'));
assert.equal(new URL(page.url()).searchParams.get('page_id'),String(ids.detail));
assert.equal(await page.locator('.kpt-back').getAttribute('href'),listing);
await clean();
if(process.env.KP_SCREENSHOTS){await page.locator('.kpt').screenshot({path:'preview/'+slug+'-detail.png'});}
await page.setViewportSize({width:390,height:844});await clean();
if(process.env.KP_SCREENSHOTS){await page.locator('.kpt').screenshot({path:'preview/'+slug+'-detail-mobile.png'});}
await page.locator('.kpt-back').click();await visibleEvents(2);await clean();
if(process.env.KP_SCREENSHOTS){await page.locator('.kpt').screenshot({path:'preview/'+slug+'-listing-mobile.png'});}
await page.setViewportSize({width:1280,height:1000});
checks.push({template:slug,views:['listing','detail'],checks:['render','four filters','pagination','search','reset','category','datepicker','detail navigation','back link','desktop','mobile','no overflow']});
}
assert.deepEqual(errors,[]);
console.log(JSON.stringify({base,browser:await browser.version(),node:process.version,checks,errors}));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
