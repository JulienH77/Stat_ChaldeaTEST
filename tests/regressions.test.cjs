const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function app(){
 const elements=new Map();
 function element(selector){if(!elements.has(selector))elements.set(selector,{textContent:'',innerHTML:'',value:'',children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{},parentElement:{classList:{toggle(){}}},querySelector(){return null},querySelectorAll(){return []},appendChild(){},remove(){},addEventListener(){},setAttribute(){}});return elements.get(selector);}
 const ctx=vm.createContext({console,structuredClone,URLSearchParams,Date,Map,Set,Number,String,Math,JSON,Object,Array,Promise,initialState:JSON.parse(fs.readFileSync(path.join(root,'data/initial-state.json'))),welfareData:JSON.parse(fs.readFileSync(path.join(root,'data/welfare-ids.json'))),supportData:JSON.parse(fs.readFileSync(path.join(root,'data/support-lists.json'))),gssrData:JSON.parse(fs.readFileSync(path.join(root,'data/gssr-na.json'))),window:{CHALDEA_CONFIG:{}},document:{querySelector:element,querySelectorAll(){return []},addEventListener(){},createElement:element,body:{appendChild(){}}},localStorage:{getItem(){return null},setItem(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Image:function(){}});
 let src=fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/^import .*;\n/gm,'');
 src=src.slice(0,src.indexOf("$('#modalBackdrop').onclick=e=>"));
 vm.runInContext(src,ctx);return {ctx,run:s=>vm.runInContext(s,ctx),element};
}
test('cloud reads all three accounts beyond the default 1000-row cap',async()=>{
 const a=app();a.ctx.rows=Array.from({length:1254},(_,i)=>({player_key:['attmann','julien','yanis'][Math.floor(i/418)],servant_id:i%418+1,level:100,skills:[1,2,3]}));
 a.run(`cloudEnabled=true;cloud={from(){return{select(){return this},order(){return this},range(a,b){return Promise.resolve({data:rows.slice(a,b+1),error:null})},then(ok){return Promise.resolve({data:rows.slice(0,1000),error:null}).then(ok)}}}};`);
 await a.run('refreshPublicStats()');assert.equal(a.run("stats('yanis',418).level"),100);
});
test('GSSR drafts belong to a player and an event',()=>{
 const a=app();a.run("gssrSetPoolDraft('ny-2023','pool-01');currentPlayer='yanis';");assert.equal(a.run("gssrDraftFor('ny-2023').poolId"),null);
});
test('choosing the same GSSR pool keeps the obtained Servants',()=>{
 const a=app();a.run("gssrSetPoolDraft('ny-2023','pool-01');gssrToggleObtained('ny-2023','Sigurd',true);gssrSetPoolDraft('ny-2023','pool-01');");assert.equal(a.run("gssrDraftFor('ny-2023').obtained.length"),1);
});
test('Destiny Extra II includes Alter Ego; Extra I excludes it',()=>{
 const a=app();assert.equal(a.run("gssrDestinyCandidates({class:'Extra I'}).some(r=>r.class==='Alter Ego')"),false);assert.equal(a.run("gssrDestinyCandidates({class:'Extra II'}).some(r=>r.class==='Alter Ego')"),true);
});
test('Mash is excluded from account totals',()=>{
 const a=app();assert.equal(a.run("countOwned('julien',isMash)"),0);
});
test('decimal XP levels are normalized instead of giving zero XP',()=>{
 const a=app();assert.equal(a.run('xpNeed(1.5,90.5)'),a.run('xpNeed(1,90)'));
});
test('logged-in unassociated account opens the account dialog',async()=>{
 const a=app();a.ctx.document.querySelector=s=>s==='#modalCancel'?null:a.element(s);a.run("session={user:{id:'reader',email:'reader@example.com'}};cloud={};");await a.run('accountUI()');
});
test('successful cloud refresh removes statistics deleted remotely',async()=>{
 const a=app();a.run("cloudEnabled=true;cloud={from(){return{select(){return this},order(){return this},range(){return Promise.resolve({data:[],error:null})},then(ok){return Promise.resolve({data:[],error:null}).then(ok)}}}};");await a.run('refreshPublicStats()');assert.equal(a.run("isOwned('julien',state.roster.find(r=>r.id===2))"),false);
});
test('local storage quota failure does not crash saving',()=>{
 const a=app();a.ctx.localStorage.setItem=()=>{throw Error('quota')};assert.doesNotThrow(()=>a.run('localCacheSave()'));
});
test('late cloud confirmation stays attached to the original player',async()=>{
 const a=app();let done;a.ctx.pending=new Promise(resolve=>done=resolve);a.run("cloudEnabled=true;session={user:{id:'julien'}};currentAuth={playerKey:'julien',canEdit:true};cloud={from(){return{upsert(){return this},select(){return this},single(){return pending}}}};");const p=a.run('persistStat(2)');a.run("currentPlayer='yanis'");done({data:{player_key:'julien',servant_id:2},error:null});assert.equal(await p,true);
});
test('storage corruption cannot replace the roster with malformed player data',()=>{
 const a=app();a.ctx.localStorage.getItem=()=>JSON.stringify({julien:{stats:null}});a.run('localCacheLoad()');assert.equal(a.run("typeof state.players.julien.stats"),'object');assert.notEqual(a.run('state.players.julien.stats'),null);
});
test('late GSSR save is recorded under the original player',async()=>{
 const a=app();let done;a.ctx.pending=new Promise(resolve=>done=resolve);
 a.run("currentView='gssr';cloudEnabled=true;session={user:{id:'julien'}};currentAuth={playerKey:'julien',canEdit:true};cloud={from(){return {upsert(){return this},select(){return this},single(){return pending}}}};gssrSetPoolDraft('ny-2023','pool-01');");
 const saved=a.run("saveGssrResult('ny-2023')");a.run("currentPlayer='yanis'");done({data:{id:1,player_key:'julien',event_id:'ny-2023',selected_pool_id:'pool-01'},error:null});assert.equal(await saved,true);assert.equal(a.run("gssrPlayerResult('yanis','ny-2023')"),null);assert.equal(a.run("gssrPlayerResult('julien','ny-2023').poolId"),'pool-01');
});
test('delayed XP writes keep the original player after master switch',async()=>{
 const a=app();a.ctx.writes=[];a.run("cloudEnabled=true;session={user:{id:'julien'}};currentAuth={playerKey:'julien',canEdit:true};xpInventory('julien').Saber[5]=19;currentPlayer='yanis';cloud={from(){return {upsert(body){writes.push(body);return Promise.resolve({error:null})}}}};");assert.equal(await a.run("saveXpCloud('julien')"),true);assert.equal(a.ctx.writes[0].player_key,'julien');assert.equal(a.ctx.writes[0].inventory.Saber[5],19);
});
test('Destiny history excludes SSRs released after each anniversary',()=>{
 const a=app();assert.equal(a.run("gssrDestinyCandidates({class:'Moon Cancer'},gssrEventById('ann-2024')).some(r=>r.id===351)"),false);assert.equal(a.run("gssrDestinyCandidates({class:'Caster'},gssrEventById('ann-2025')).some(r=>r.id===385)"),false);assert.equal(a.run("gssrDestinyCandidates({class:'Extra II'},gssrEventById('ann-2026')).some(r=>r.id===417)"),false);
});
test('GSSR thumbnails resolve SSR class variants instead of the first matching name',()=>{
 const a=app();assert.equal(a.run("gssrRosterRecord('Artoria Pendragon',{label:'Archer · Simple cible'}).class"),'Archer');assert.equal(a.run("gssrRosterRecord('Jeanne d’Arc',{label:'Archer · Zone'}).class"),'Archer');assert.equal(a.run("gssrRosterRecord({name:'Ereshkigal',id:417}).class"),'Beast');
});
test('future-name matching uses the same normalization as the roster',()=>{
 const a=app();assert.equal(a.run("isVisible({id:999,name:'Van Gogh (Miner)',class:'Foreigner'})"),false);
});
test('a failed second cloud page preserves the complete fallback',async()=>{
 const a=app();const before=a.run("JSON.stringify(state.players)");a.ctx.rows=Array.from({length:500},()=>({player_key:'julien',servant_id:2,level:120}));a.run("cloudEnabled=true;cloud={from(){return {select(){return this},order(){return this},range(start){return Promise.resolve(start?{error:{message:'offline'}}:{data:rows,error:null})}}}};");await a.run('refreshPublicStats()');assert.equal(a.run('JSON.stringify(state.players)'),before);
});
test('cloud data arrives into GSSR after the event was already opened',async()=>{
 const a=app();a.run("gssrEventId='ny-2023';gssrRenderEvent();cloudEnabled=true;session={user:{id:'julien'}};cloud={from(){return {select(){return Promise.resolve({data:[{player_key:'julien',event_id:'ny-2023',selected_pool_id:'pool-03'}],error:null})}}}};");await a.run('loadGssrResults()');assert.equal(a.run("gssrDraftFor('ny-2023').poolId"),'pool-03');
});
test('unassociated account HTML escapes user email',async()=>{
 const a=app();a.run("session={user:{id:'reader',email:'<img src=x onerror=alert(1)>'}};cloud={};");await a.run('accountUI()');assert.match(a.element('#modal').innerHTML,/&lt;img/);assert.doesNotMatch(a.element('#modal').innerHTML,/<img src=x/);
});
test('editing free Destiny result preserves selected roster servants',()=>{
 const a=app();a.run("gssrEventId='ann-2026';gssrToggleDestinyObtained('ann-2026','Sigurd',true);gssrRenderEvent()");const field=a.element('#gssrFreeDestinyObtained');field.value='Unlisted servant';field.oninput();assert.equal(a.run("gssrDraftFor('ann-2026').destinyObtained.map(x=>x.name).join('|')"),'Sigurd|Unlisted servant');
});
test('failed servant save rolls back local state and leaves the draft available',async()=>{
 const a=app();a.element('#e-level').value='107';a.element('#saveServant').disabled=false;const before=a.run("JSON.stringify(stats('julien',2))");a.run("cloudEnabled=true;session={user:{id:'julien'}};currentAuth={playerKey:'julien',canEdit:true};servantModalPlayer='julien';cloud={from(){return {upsert(){return this},select(){return this},single(){return Promise.resolve({error:{message:'write denied'}})}}}};");assert.equal(await a.run('saveModal(2)'),false);assert.equal(a.run("JSON.stringify(stats('julien',2))"),before);assert.equal(a.element('#e-level').value,'107');assert.equal(a.element('#saveServant').disabled,false);
});
test('unauthorized servant save cannot mutate another player locally',async()=>{
 const a=app();const before=a.run('JSON.stringify(state.players)');a.run("session={user:{id:'julien'}};currentAuth={playerKey:'julien',canEdit:true};currentPlayer='yanis';servantModalPlayer='julien';");assert.equal(await a.run('saveModal(2)'),false);assert.equal(a.run('JSON.stringify(state.players)'),before);
});
test('Destiny distinguishes two Servants with the same display name',()=>{
 const a=app();a.run("gssrToggleDestinyObtained('ann-2026','Altria Caster',true,284);gssrToggleDestinyObtained('ann-2026','Altria Caster',true,386);");assert.equal(a.run("gssrDraftFor('ann-2026').destinyObtained.length"),2);a.run("gssrToggleDestinyObtained('ann-2026','Altria Caster',false,284)");assert.equal(a.run("gssrDraftFor('ann-2026').destinyObtained[0].id"),386);
});
test('closing a servant modal invalidates its pending Atlas callbacks',async()=>{
 const a=app();let done;a.ctx.pending=new Promise(resolve=>done=resolve);a.ctx.paints=0;a.run("atlasDetail=()=>pending;openModalBase=()=>{paints++};");const loading=a.run('openServant(2)');a.run('closeModal()');done(null);await loading;assert.equal(a.ctx.paints,1);
});
